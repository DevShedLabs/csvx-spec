#!/bin/sh
# Checks for the specification repo itself, usable on demand and as the pre-push hook
# (git config core.hooksPath .githooks). Interim stand-in for CI, like the engines' check.sh.
set -e
cd "$(dirname "$0")/.."

echo "check: every JSON file under schemas/ and tests/ parses..."
node -e '
const fs=require("fs"),path=require("path");
let bad=0;
(function walk(d){for(const e of fs.readdirSync(d)){const f=path.join(d,e);
  if(fs.statSync(f).isDirectory()){if(e!=="node_modules")walk(f)}
  else if(f.endsWith(".json")){try{JSON.parse(fs.readFileSync(f,"utf8"))}catch(x){console.error(f+": "+x.message);bad=1}}}})("schemas");
(function walk(d){for(const e of fs.readdirSync(d)){const f=path.join(d,e);
  if(fs.statSync(f).isDirectory())walk(f);
  else if(f.endsWith(".json")){try{JSON.parse(fs.readFileSync(f,"utf8"))}catch(x){console.error(f+": "+x.message);bad=1}}}})("tests");
process.exit(bad)'

if [ -d validator/node_modules ]; then
	echo "check: examples validate against the schemas..."
	node validator/bin/csvx-validate.mjs examples/*.csvx
else
	echo "check: validator/node_modules missing - skipping example validation (run 'npm install' in validator/)" >&2
fi

echo "check: spec coverage (tools/coverage.mjs)..."
node tools/coverage.mjs

echo "check: all checks passed"
