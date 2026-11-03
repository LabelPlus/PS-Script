#!/usr/bin/env python3
"""Build a release without creating commits or tags. Requires npm ci first."""
import argparse
from pathlib import Path
import re
import subprocess
import shutil

ROOT = Path(__file__).resolve().parent.parent


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("tag", help="Release tag, e.g. 1.7.5 or v1.7.5")
    args = parser.parse_args()
    if not re.fullmatch(r"v?(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)", args.tag):
        parser.error("tag must be a stable version such as 1.7.5 or v1.7.5")
    version = args.tag.removeprefix("v")
    changelog = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")
    sections = list(re.finditer(r"^## \[([^\]]+)\][^\n]*$", changelog, re.MULTILINE))
    section = next((s for s in sections if s[1] == version), None)
    if section is None:
        parser.error("CHANGELOG.md has no section matching the release version")
    end = next((s.start() for s in sections if s.start() > section.start()), len(changelog))
    notes = changelog[section.end():end].strip()
    if not any(line.strip() and not line.startswith("#") for line in notes.splitlines()):
        parser.error("release notes are empty; update CHANGELOG.md first")
    notes = changelog[section.start():end].strip()
    if shutil.which("7z") is None:
        parser.error("7z is required to create the release archive")

    version_file = ROOT / "src/version.ts"
    original = version_file.read_bytes()
    updated, count = re.subn(r'(VERSION:\s*string\s*=\s*)"[^"]*"',
                             lambda m: m[1] + f'"{version}"', original.decode("utf-8"))
    if count != 1:
        parser.error("expected exactly one VERSION declaration in src/version.ts")
    try:
        version_file.write_text(updated, encoding="utf-8")
        subprocess.run(["bash", "./build.sh"], cwd=ROOT, check=True)
    finally:
        version_file.write_bytes(original)

    build = ROOT / "build"
    (build / "release-notes.md").write_text(notes + "\n", encoding="utf-8")
    pack = build / "pack"
    pack.mkdir()
    for source in (build / "LabelPlus_Ps_Script.jsx", ROOT / "psd-to-labelplus-text.jsx",
                   ROOT / "LICENSE.txt", ROOT / "README.md"):
        shutil.copy2(source, pack / source.name)
    templates = build / "ps_script_res"
    if not any(p.is_file() for p in templates.rglob("*")):
        raise RuntimeError("No document templates were built")
    shutil.copytree(templates, pack / templates.name)
    (pack / "CHANGELOG.md").write_text(changelog, encoding="utf-8")
    archive = build / f"LabelPlus_PS-Script_{version}.7z"
    subprocess.run(["7z", "a", "-t7z", str(archive), ".",
                    "-m0=BCJ", "-m1=LZMA:d=21", "-ms", "-mmt"], cwd=pack, check=True)
    print(f"Release archive: {archive}")


if __name__ == "__main__":
    main()
