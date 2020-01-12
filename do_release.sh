#!bash

program_exists() {
    local ret='0'
    command -v $1 >/dev/null 2>&1 || { local ret='1'; }

    # fail on non-zero return value
    if [ "$ret" -ne 0 ]; then
        echo "command $1 notfound, exit..."
        return 1
    fi

    return 0
}

show_usage() {
    echo "Usage: $0 <version>"
    exit 1
}

version=$1

if [ -z $version ]; then
    echo "error: please input release version!"
    show_usage
fi

set -e
program_exists git
program_exists 7z
program_exists tsc
program_exists python

cd "$(dirname "$0")"

# Determine if git working space clean
if [ -n "$(git status --porcelain| grep -v CHANGELOG.md)" ]; then
    echo "git working space not clean"
    exit 1
fi

# remind
echo "Check List:"
echo "* Is CHANGELOG.md ready to release?"
read

echo "start..."

# edit version
sed -i "s/\".*\"/\"${version}\"/" ./src/version.ts

# build
./build.sh

# prepare to pack
PACK_DIR=./build/pack
p() {
    if [ -z $1 ]; then
        return 1
    fi
    cp -v $1 ${PACK_DIR}/
    return $?
}

mkdir -p ${PACK_DIR}
rm -rf ./${PACK_DIR}/*

# edit changelog
cp -v CHANGELOG.md ${PACK_DIR}/
date=`date +%Y-%m-%d`
sed -i "s/\[Unreleased\]/\[${version}\] - ${date}/" $PACK_DIR/CHANGELOG.md

p build/LabelPlus_Ps_Script.jsx
p LICENSE.txt
p README.md
7z a -t7z build/LabelPlus_PS-Script_${version}.7z ${PACK_DIR}/* -m0=BCJ -m1=LZMA:d=21 -ms -mmt

# git commit, add tag
cp ${PACK_DIR}/CHANGELOG.md ./
TEXT="\n## [Unreleased]\n### Added\n### Changed\n### Fixed\n### Removed\n"
sed "1a\\${TEXT}" CHANGELOG.md -i

git commit -am "release ${version}"
git tag ${version}

echo ""
echo "============================="
echo "complete!"
echo "please check and push new commit & tag, command:"
echo "git push"
echo "git push origin ${version}"

