"""Verifica decisões e isolamento dos hooks sem executar operações destrutivas."""

from contextlib import redirect_stdout
import importlib.util
import io
import json
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]


def load(name, path):
    spec = importlib.util.spec_from_file_location(name, ROOT / path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


gate = load("gate", ".claude/hooks/gate.py")
feedback = load("feedback", ".claude/hooks/feedback.py")
docs = load("docs_check", "scripts/check-docs.py")


def invoke(module, payload):
    output = io.StringIO()
    with patch("sys.stdin", io.StringIO(json.dumps(payload))), redirect_stdout(output):
        module.main()
    return output.getvalue()


class GateTests(unittest.TestCase):
    def test_destructive_operations_require_confirmation(self):
        commands = (
            "rm -rf build", "rm -fr build", "rm -r -f build", "git push --force origin main",
            "git push -f origin main", "git reset --hard HEAD", "git clean -fd",
            "DROP TABLE orders", "TRUNCATE TABLE orders", "docker compose down -v",
            "docker compose -f compose.yaml down --volumes",
        )
        for command in commands:
            with self.subTest(command=command):
                result = json.loads(invoke(gate, {"tool_input": {"command": command}}))
                self.assertEqual(result["hookSpecificOutput"]["permissionDecision"], "ask")

    def test_normal_validation_and_push_do_not_prompt(self):
        for command in ("git status", "git diff --check", "npm test", "git push origin main",
                        "docker compose -f compose.validation.yaml run --rm quality"):
            with self.subTest(command=command):
                self.assertEqual(invoke(gate, {"tool_input": {"command": command}}), "")

    def test_malformed_payload_does_not_crash_or_execute(self):
        for payload in ([], None, {}, {"tool_input": []}, {"tool_input": {"command": []}}):
            with self.subTest(payload=payload):
                self.assertEqual(invoke(gate, payload), "")


class FeedbackTests(unittest.TestCase):
    def test_outside_and_generated_paths_never_run_linter(self):
        for path in ("/tmp/outside.ts", "../../outside.ts", "node_modules/typescript/lib/typescript.d.ts",
                     "README.md", "missing.ts"):
            with self.subTest(path=path), patch.object(feedback.subprocess, "run") as run:
                self.assertEqual(invoke(feedback, {"tool_input": {"file_path": path}}), "")
                run.assert_not_called()

    def test_missing_runtime_reports_skipped_feedback(self):
        with patch.object(feedback.shutil, "which", return_value=None):
            output = invoke(feedback, {"tool_input": {"file_path": "src/domain/orders.ts"}})
        self.assertIn("não executado", output)

    def test_linter_uses_arguments_and_no_shell_or_fix(self):
        result = subprocess.CompletedProcess([], 1, stdout="erro de lint", stderr="")
        with patch.object(feedback.shutil, "which", return_value="/usr/bin/node"), \
             patch.object(feedback.Path, "is_file", return_value=True), \
             patch.object(feedback.subprocess, "run", return_value=result) as run:
            output = invoke(feedback, {"tool_input": {"file_path": "src/domain/orders.ts"}})
        self.assertIn("erro de lint", output)
        args, kwargs = run.call_args
        self.assertEqual(args[0][-2:], ["--", "src/domain/orders.ts"])
        self.assertNotIn("--fix", args[0])
        self.assertFalse(kwargs.get("shell", False))


class DecisionTests(unittest.TestCase):
    def test_finalized_decision_allows_only_status_and_links(self):
        original = "# ADR-0001: Decidir\n- **Status**: Aceito\n## Decisão\nUsar A.\n## Links\n- Antigo\n"
        metadata = original.replace("Aceito", "Deprecado").replace("- Antigo", "- Novo")
        changed = original.replace("Usar A.", "Usar B.")
        self.assertEqual(docs.normalized_adr(original), docs.normalized_adr(metadata))
        self.assertNotEqual(docs.normalized_adr(original), docs.normalized_adr(changed))


if __name__ == "__main__":
    unittest.main()
