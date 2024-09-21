#!/bin/bash

program_exists() {
    for program in $*; do
        command -v $program >/dev/null 2>&1
        [ $? -ne 0 ] && {
            echo "missing command $program"
            return 1
        }
    done

    return 0
}

show_usage() {
    echo "Usage: $0 <version>"
    echo "  version:\tlike 1.6.0"
    exit 1
}

if [ $# -lt 1 ]; then
    echo "error: Please input release version!"
    show_usage
fi

version=$1
program_exists git 7z python
[ $? -ne 0 ] && exit 1

cd "${0%%/*}"

# Determine if git working space clean
if [ -n "$(git status --untracked-files=no --porcelain | grep -v CHANGELOG.md)" ]; then
    echo "git working space not clean"
    exit 1
fi

# remind
echo "Check List:"
read -p "* Is CHANGELOG.md ready to release? [y/N] " -n1 try;
[ "${try##y}" != "" ] && exit 0

printf "\nstart...\n"

# update version
sed -i "s/\".*\"/\"${version}\"/" ./src/version.ts

# FIXME make sure dependencies in node_modules are installed
# build
./build.sh

# prepare to pack
PACK_DIR=./build/pack

# pack directories into ${PACK_DIR}
pack() {
    for dir in $*; do
        cp -vr $dir ${PACK_DIR}/
    done
}

mkdir -p ${PACK_DIR}
rm -rf ./${PACK_DIR}/*

# update changelog
cp -v CHANGELOG.md ${PACK_DIR}/
date=$(date +%Y-%m-%d)
sed -i "s/\[Unreleased\]/\[${version}\] - ${date}/" $PACK_DIR/CHANGELOG.md

pack build/LabelPlus_Ps_Script.jsx \
    build/ps_script_res \
    LICENSE.txt \
    README.md

7z a -t7z build/LabelPlus_PS-Script_${version}.7z ${PACK_DIR}/* -m0=BCJ -m1=LZMA:d=21 -ms -mmt

# git commit, add tag
cp ${PACK_DIR}/CHANGELOG.md ./
TEXT="\n## [Unreleased]\n### Added\n### Changed\n### Fixed\n### Removed\n"
sed "1a\\${TEXT}" CHANGELOG.md -i

git commit -am "release ${version}"
git tag ${version}

cat <<END

=============================
complete!
please check and push new commit & tag, command:
git push
git push origin ${version}
END
