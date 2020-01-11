#!python

#
# flatten jsx to a single file, for example:
#   //@include "xtools.jsx"
# this script would try to find "xtools.jsx" file in "include search path" and replace it
#

import argparse
import sys
import os
import codecs

parser = argparse.ArgumentParser(description='photoshop jsx fatten')
parser.add_argument('inputfile')
parser.add_argument('outputfile')
parser.add_argument('-I', type=str, nargs='*',
                    help='inlcude search path')
args = parser.parse_args()
inputfile = args.inputfile
outputfile = args.outputfile
include_paths = [ ]

if not os.path.isfile(inputfile):
    print('inputfile %s notfound' % inputfile)
    exit(1)

src_dir = os.path.dirname(inputfile)
if src_dir == '':
    include_paths.append('.')
else:
    include_paths.append(src_dir)

if args.I is not None:
    for item in args.I:
        include_paths.append(item)

def search_include_file(filename):
    if filename is None:
        return None

    path = None
    for dir in include_paths:
        tmp = dir + '/' + filename
        if os.path.isfile(tmp):
            path = tmp
            break

    return path

included_path = {}
def flatten(file):
    print('including: ' + file)
    data = open(file, "r", encoding="utf-8").read()
    new  = ''
    line_idx = 0
    for line in data.splitlines():
        line_idx += 1
        if line.startswith("//@include "):
            in_file = line.split('"')[1]
            in_path = search_include_file(in_file)
            if in_path is None:
                print("error: file %s(%s, line %d) notfound.." % (in_file, file, line_idx))
                exit(1)

            if in_file in included_path: # already include, skip
                # print('skip', in_file)
                continue

            included_path[in_file] = True
            new += flatten(in_path)
        else:
            new += line
        new += '\n'

    return new

data = flatten(inputfile)

with open(outputfile, 'w', encoding="utf-8-sig") as f:
    f.writelines(data)
