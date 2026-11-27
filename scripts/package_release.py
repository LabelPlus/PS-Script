#!/usr/bin/env python3
"""Build a release without creating commits or tags. Requires npm ci first.

The release version comes only from CHANGELOG.md: the first section below
[Unreleased]. src/version.ts holds a placeholder and is filled in at build time.
"""
import argparse
from pathlib import Path
import re
import subprocess
import shutil
import sys

ROOT = Path(__file__).resolve().parent.parent
SEMVER = r"(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)"
SECTION = re.compile(r"^## \[([^\]]+)\][^\n]*$", re.MULTILINE)


class ReleaseError(Exception):
    pass


def changelog_release(changelog):
    """Return (version, notes) for the newest released CHANGELOG section."""
    sections = list(SECTION.finditer(changelog))
    names = [s[1] for s in sections]
    duplicates = sorted({n for n in names if names.count(n) > 1})
    if duplicates:
        raise ReleaseError("CHANGELOG.md has duplicate sections: " + ", ".join(duplicates))

    def body(index):
        end = sections[index + 1].start() if index + 1 < len(sections) else len(changelog)
        return changelog[sections[index].end():end]

    def has_entries(text):
        return any(line.strip() and not line.startswith("#") for line in text.splitlines())

    released = [i for i, s in enumerate(sections) if s[1] != "Unreleased"]
    if not released:
        raise ReleaseError("CHANGELOG.md has no released section")
    for i, s in enumerate(sections):
        if s[1] == "Unreleased" and has_entries(body(i)):
            raise ReleaseError("[Unreleased] has entries; move them into a version section first")

    index = released[0]
    version = sections[index][1]
    if not re.fullmatch(SEMVER, version):
        raise ReleaseError(f"newest CHANGELOG section [{version}] is not a version like 1.8.2")
    if not has_entries(body(index)):
        raise ReleaseError(f"CHANGELOG section [{version}] is empty")
    end = sections[index + 1].start() if index + 1 < len(sections) else len(changelog)
    return version, changelog[sections[index].start():end].strip()


def build(version, notes, changelog):
    if shutil.which("7z") is None:
        raise ReleaseError("7z is required to create the release archive")

    version_file = ROOT / "src/version.ts"
    original = version_file.read_bytes()
    updated, count = re.subn(r'(VERSION:\s*string\s*=\s*)"[^"]*"',
                             lambda m: m[1] + f'"{version}"', original.decode("utf-8"))
    if count != 1:
        raise ReleaseError("expected exactly one VERSION declaration in src/version.ts")
    try:
        version_file.write_text(updated, encoding="utf-8")
        subprocess.run(["bash", "./build.sh"], cwd=ROOT, check=True)
    finally:
        version_file.write_bytes(original)

    build_dir = ROOT / "build"
    (build_dir / "release-notes.md").write_text(notes + "\n", encoding="utf-8")
    pack = build_dir / "pack"
    pack.mkdir()
    for source in (build_dir / "LabelPlus_Ps_Script.jsx", ROOT / "psd-to-labelplus-text.jsx",
                   ROOT / "LICENSE.txt", ROOT / "README.md"):
        shutil.copy2(source, pack / source.name)
    templates = build_dir / "ps_script_res"
    if not any(p.is_file() for p in templates.rglob("*")):
        raise RuntimeError("No document templates were built")
    shutil.copytree(templates, pack / templates.name)
    (pack / "CHANGELOG.md").write_text(changelog, encoding="utf-8")
    archive = build_dir / f"LabelPlus_PS-Script_{version}.7z"
    subprocess.run(["7z", "a", "-t7z", str(archive), ".",
                    "-m0=BCJ", "-m1=LZMA:d=21", "-ms", "-mmt"], cwd=pack, check=True)
    print(f"Release archive: {archive}")


def main():
    parser = argparse.ArgumentParser(description=__doc__,
                                     formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("tag", nargs="?",
                        help="Release tag, e.g. 1.8.2 or v1.8.2; must match CHANGELOG.md")
    parser.add_argument("--print-version", action="store_true",
                        help="Check CHANGELOG.md, print the release version and exit")
    args = parser.parse_args()

    changelog = (ROOT / "CHANGELOG.md").read_text(encoding="utf-8")
    try:
        version, notes = changelog_release(changelog)
        if args.tag is not None and args.tag.removeprefix("v") != version:
            raise ReleaseError(f"tag {args.tag} does not match newest CHANGELOG section [{version}]")
        if args.print_version:
            print(version)
            return
        build(version, notes, changelog)
    except ReleaseError as e:
        sys.exit(f"error: {e}")


if __name__ == "__main__":
    main()
