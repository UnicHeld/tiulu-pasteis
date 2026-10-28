"""Verifica links locais, configuração do harness e estrutura de ADRs sem dependências."""

import argparse
from datetime import date
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
ADR_HEADINGS = (
    "Contexto e problema", "Drivers da decisão", "Opções consideradas", "Decisão",
    "Consequências", "Regras para quem implementa", "Links",
)
FINAL_STATUSES = ("Aceito", "Rejeitado", "Deprecado", "Supersedido")


def normalized_adr(content):
    """Status e Links são as únicas regiões mutáveis de decisões finalizadas."""
    body = re.split(r"^## Links\s*$", content, maxsplit=1, flags=re.MULTILINE)[0]
    return re.sub(r"^- \*\*Status\*\*:.*$", "", body, flags=re.MULTILINE).strip()


def check(root, base=None):
    errors = []
    documents = list(root.glob("*.md"))
    for folder in ("docs", ".claude", ".codex", ".cursor", ".specs"):
        documents.extend((root / folder).rglob("*.md"))
        documents.extend((root / folder).rglob("*.mdc"))
    for path in documents:
        text = path.read_text()
        prose = re.sub(r"```.*?```", "", text, flags=re.DOTALL)
        for match in re.finditer(r"!?\[[^\]\n]*\]\(([^)\n]+)\)", prose):
            target = match.group(1).strip().strip("<>")
            parsed = urlsplit(target)
            if parsed.scheme or not parsed.path:
                continue
            resolved = (path.parent / unquote(parsed.path)).resolve()
            if not resolved.is_relative_to(root.resolve()) or not resolved.exists():
                errors.append(f"{path.relative_to(root)}: link local inválido: {target}")
    for folder in (".claude", ".codex"):
        for path in (root / folder).glob("*.json"):
            try:
                json.loads(path.read_text())
            except (OSError, json.JSONDecodeError) as error:
                errors.append(f"{path.relative_to(root)}: JSON inválido: {error}")
    for path in (root / ".claude/skills").glob("*/SKILL.md"):
        text = path.read_text()
        match = re.match(r"\A---\n(.*?)\n---\n", text, re.DOTALL)
        if not match:
            errors.append(f"{path.relative_to(root)}: frontmatter ausente")
            continue
        for key in ("name", "description"):
            if not re.search(rf"^{key}:\s*\S", match.group(1), re.MULTILINE):
                errors.append(f"{path.relative_to(root)}: campo {key} ausente")
    for source, target in ((".agents/skills", ".claude/skills"),
                           (".codex/project.json", ".claude/project.json")):
        link = root / source
        if not link.is_symlink() or link.resolve() != (root / target).resolve():
            errors.append(f"{source}: deve apontar para {target}")
    index = (root / "docs/decisoes/README.md").read_text()
    for path in (root / "docs/decisoes").glob("[0-9]*.md"):
        text = path.read_text()
        number = path.name.split("-", 1)[0]
        if not re.fullmatch(r"\d{4}-[a-z0-9]+(?:-[a-z0-9]+)*\.md", path.name):
            errors.append(f"{path.name}: nome inválido")
        if not text.startswith(f"# ADR-{number}: "):
            errors.append(f"{path.name}: título não corresponde à numeração")
        for field in ("Data", "Status", "Decisores", "Aprovação", "Escopo"):
            if not re.search(rf"^- \*\*{field}\*\*:\s*\S", text, re.MULTILINE):
                errors.append(f"{path.name}: campo {field} ausente")
        status = re.search(r"^- \*\*Status\*\*:\s*(.+)$", text, re.MULTILINE)
        if status and not re.fullmatch(r"Proposto|Aceito|Rejeitado|Deprecado|Supersedido por .+", status[1]):
            errors.append(f"{path.name}: status inválido")
        stamp = re.search(r"^- \*\*Data\*\*:\s*(.+)$", text, re.MULTILINE)
        if stamp:
            try:
                date.fromisoformat(stamp[1])
            except ValueError:
                errors.append(f"{path.name}: data inválida")
        for heading in ADR_HEADINGS:
            if f"## {heading}\n" not in text:
                errors.append(f"{path.name}: seção {heading} ausente")
        row = next((line for line in index.splitlines() if f"./{path.name}" in line), "")
        if not row or (status and status[1] not in row):
            errors.append(f"{path.name}: índice ausente ou status divergente")
    if base:
        # A base vem do checkout ou do evento de CI, nunca de conteúdo executável.
        subprocess.run(["git", "rev-parse", "--verify", f"{base}^{{commit}}"],
                       cwd=root, check=True, capture_output=True, text=True)
        files = subprocess.run(["git", "ls-tree", "-r", "--name-only", base,
                                "--", "docs/decisoes/"], cwd=root, check=True,
                               capture_output=True, text=True).stdout.splitlines()
        for name in files:
            if not re.fullmatch(r"docs/decisoes/\d{4}-[a-z0-9-]+\.md", name):
                continue
            previous = subprocess.run(["git", "show", f"{base}:{name}"], cwd=root,
                                      check=True, capture_output=True, text=True).stdout
            status = re.search(r"^- \*\*Status\*\*:\s*(.+)$", previous, re.MULTILINE)
            current = root / name
            if not current.exists():
                errors.append(f"{name}: ADR histórico removido")
            elif status and status[1].startswith(FINAL_STATUSES):
                if normalized_adr(previous) != normalized_adr(current.read_text()):
                    errors.append(f"{name}: corpo de ADR finalizado alterado")
    return errors, len(documents)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", help="Commit base para conferir imutabilidade de ADRs")
    args = parser.parse_args()
    try:
        errors, count = check(ROOT, args.base)
    except (OSError, subprocess.CalledProcessError) as error:
        print(f"Falha ao verificar documentação: {error}", file=sys.stderr)
        return 1
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    print(f"Documentação e harness válidos: {count} documentos; links, JSON, skills e ADRs conferidos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
