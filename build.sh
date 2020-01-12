#!bash

set -e

cd "$(dirname "$0")"

OUTPUT=LabelPlus_Ps_Script.jsx

rm -rf ./build/*
tsc -p . --outDir build/
./flatten_jsx.py build/main.js build/$OUTPUT -I build/ src/

echo "Output File: $OUTPUT"
