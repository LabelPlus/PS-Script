#!/bin/bash -e

cd "${0%%/*}"

TSC_OUTPUT=build/app.js
PS_JSX_OUTPUT=build/LabelPlus_Ps_Script.jsx

rm -rf ./build/*
mkdir -p build/
tsc -p . --out $TSC_OUTPUT
cat src/copyleft_header.js $TSC_OUTPUT > $PS_JSX_OUTPUT
./flatten_jsx.py $PS_JSX_OUTPUT $PS_JSX_OUTPUT -I build/ src/

cp -r doc_template/ build/ps_script_res

echo "Output File: $PS_JSX_OUTPUT"
