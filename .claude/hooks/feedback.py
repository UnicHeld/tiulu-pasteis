"""Oferece feedback ESLint sem corrigir arquivos nem executar texto do payload."""

import json
from pathlib import Path
import shutil
import subprocess
import sys

ROOT = Path(__file__).resolve().parents[2]


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return
    if not isinstance(payload, dict) or not isinstance(payload.get("tool_input"), dict):
        return
    value = payload["tool_input"].get("file_path")
    if not isinstance(value, str) or not value:
        return
    path = Path(value)
    path = (ROOT / path).resolve() if not path.is_absolute() else path.resolve()
    if not path.is_relative_to(ROOT) or path.suffix not in {".ts", ".tsx"}:
        return
    relative = path.relative_to(ROOT)
    if any(part in {"node_modules", "dist", "dist-server", ".git"} for part in relative.parts):
        return
    if not path.is_file():
        return
    node = shutil.which("node")
    eslint = ROOT / "node_modules/eslint/bin/eslint.js"
    if not node or not eslint.is_file():
        print("Feedback ESLint não executado: Node.js ou dependências indisponíveis. Use validate-tiulu.")
        return
    try:
        result = subprocess.run(
            [node, str(eslint), "--", str(relative)],
            cwd=ROOT, capture_output=True, text=True, timeout=15, check=False,
        )
    except (OSError, subprocess.TimeoutExpired):
        print("Feedback ESLint não concluído. Execute validate-tiulu antes de entregar.")
        return
    if result.returncode:
        print(result.stdout + result.stderr)


if __name__ == "__main__":
    main()
