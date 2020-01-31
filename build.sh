#!bash

set -e

cd "$(dirname "$0")"

OUTPUT=LabelPlus_Ps_Script.jsx

# clean all
rm -rf ./build
mkdir -p build

# resource packing
./pack_res.py doc_templete/ build/static_res.js

tsc -p . --outDir build/
./flatten_jsx.py build/main.js build/$OUTPUT -I build/ node_modules/ src/

echo "Output File: $OUTPUT"
