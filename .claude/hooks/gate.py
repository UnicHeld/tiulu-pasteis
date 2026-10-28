"""Solicita confirmação para padrões destrutivos, sem executar o comando recebido."""

import json
import re
import sys

DANGEROUS_PATTERNS = (
    r"\brm\s+(?=[^\n;&|]*-[^\s]*r)(?=[^\n;&|]*-[^\s]*f)",
    r"\bgit\s+push\b[^\n;&|]*(?:--force(?:-with-lease)?\b|\s-[a-z]*f\b)",
    r"\bgit\s+reset\b[^\n;&|]*--hard\b",
    r"\bgit\s+clean\b[^\n;&|]*\s-[a-z]*f",
    r"\bgit\s+branch\b[^\n;&|]*\s-D\b",
    r"\b(?:DROP|TRUNCATE)\s+(?:TABLE|DATABASE|SCHEMA)\b",
    r"\bdocker\s+compose\b[^\n;&|]*\bdown\b[^\n;&|]*(?:--volumes\b|\s-v\b)",
    r">\s*/dev/sd",
)


def main():
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        return
    if not isinstance(payload, dict):
        return
    tool_input = payload.get("tool_input")
    if not isinstance(tool_input, dict):
        return
    command = tool_input.get("command", "")
    if not isinstance(command, str):
        return
    if any(re.search(pattern, command, re.IGNORECASE) for pattern in DANGEROUS_PATTERNS):
        print(json.dumps({"hookSpecificOutput": {
            "hookEventName": "PreToolUse",
            "permissionDecision": "ask",
            "permissionDecisionReason": (
                "Padrão potencialmente destrutivo detectado. Confira a autorização "
                "existente e solicite aprovação se a operação não estiver autorizada."
            ),
        }}, ensure_ascii=False))


if __name__ == "__main__":
    main()
