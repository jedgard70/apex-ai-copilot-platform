from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List


DOCSEDGARD_ROOT = Path(r"D:\AI Jedgard\skill")
ALLOWED_EXTENSIONS = {".md", ".pdf", ".txt", ".py"}


@dataclass(frozen=True)
class SkillFile:
    relative_path: str
    extension: str


def _repo_root() -> Path:
    return Path(__file__).resolve().parents[3]


def _manifest_path() -> Path:
    return _repo_root() / "skill" / "DOCSEDGARD_SKILL_REINTEGRADA.md"


def _list_skill_files() -> List[SkillFile]:
    if not DOCSEDGARD_ROOT.exists():
        raise FileNotFoundError(f"Pasta não encontrada: {DOCSEDGARD_ROOT}")

    files: List[SkillFile] = []
    for path in DOCSEDGARD_ROOT.rglob("*"):
        if not path.is_file():
            continue
        extension = path.suffix.lower()
        if extension not in ALLOWED_EXTENSIONS:
            continue
        rel = str(path.relative_to(DOCSEDGARD_ROOT))
        files.append(SkillFile(relative_path=rel, extension=extension))
    files.sort(key=lambda item: item.relative_path.lower())
    return files


def _group_counts(files: List[SkillFile]) -> Dict[str, int]:
    return {
        ".md": sum(1 for file in files if file.extension == ".md"),
        ".pdf": sum(1 for file in files if file.extension == ".pdf"),
        ".txt": sum(1 for file in files if file.extension == ".txt"),
        ".py": sum(1 for file in files if file.extension == ".py"),
    }


def _top_folders(files: List[SkillFile], limit: int = 15) -> List[Dict[str, int]]:
    counts: Dict[str, int] = {}
    for file in files:
        folder = file.relative_path.split("\\", 1)[0].split("/", 1)[0]
        counts[folder] = counts.get(folder, 0) + 1
    ordered = sorted(counts.items(), key=lambda item: item[1], reverse=True)
    return [{"folder": folder, "count": count} for folder, count in ordered[:limit]]


def _build_manifest(files: List[SkillFile]) -> str:
    grouped = {
        ".md": [f.relative_path for f in files if f.extension == ".md"],
        ".pdf": [f.relative_path for f in files if f.extension == ".pdf"],
        ".txt": [f.relative_path for f in files if f.extension == ".txt"],
        ".py": [f.relative_path for f in files if f.extension == ".py"],
    }

    lines = [
        "# DOCSEDGARD Skill Reintegrada",
        "",
        f"Fonte: `{DOCSEDGARD_ROOT}`",
        "",
        "## Totais por extensão",
        f"- `.md`: {len(grouped['.md'])}",
        f"- `.pdf`: {len(grouped['.pdf'])}",
        f"- `.txt`: {len(grouped['.txt'])}",
        f"- `.py`: {len(grouped['.py'])}",
        "",
        "## Inventário completo",
        f"Caminhos relativos à raiz `{DOCSEDGARD_ROOT}`:",
        "",
    ]

    for ext in (".md", ".pdf", ".txt", ".py"):
        lines.append(f"### {ext}")
        if not grouped[ext]:
            lines.append("- _(nenhum arquivo)_")
        else:
            for rel in grouped[ext]:
                lines.append(f"- `{rel}`")
        lines.append("")

    return "\n".join(lines)


def dispatch(action: str = "summary", *, term: str = "") -> Dict[str, object]:
    files = _list_skill_files()
    counts = _group_counts(files)
    action_normalized = (action or "summary").strip().lower()

    if action_normalized == "summary":
        return {
            "action": "summary",
            "source": str(DOCSEDGARD_ROOT),
            "manifest": str(_manifest_path()),
            "total": len(files),
            "counts": counts,
            "topFolders": _top_folders(files),
        }

    if action_normalized == "search":
        value = term.strip().lower()
        if not value:
            raise ValueError("Forneça 'term' para search.")
        matches = [file.relative_path for file in files if value in file.relative_path.lower()]
        return {
            "action": "search",
            "term": term,
            "count": len(matches),
            "matches": matches,
        }

    if action_normalized == "sync-manifest":
        manifest = _build_manifest(files)
        path = _manifest_path()
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(manifest, encoding="utf-8")
        return {
            "action": "sync-manifest",
            "manifest": str(path),
            "total": len(files),
            "counts": counts,
        }

    raise ValueError(f"Ação não suportada: {action}")

