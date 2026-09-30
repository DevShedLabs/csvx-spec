# CSVX Validator

JSON Schema validator for `.csvx` packages — checks `manifest.json`, `workbook.json`,
`styles.json`, and every sheet's `.meta.json` against `../schemas/*.json` together, in one pass.
Accepts either a `.csvx` ZIP file or an unpacked package directory.

Every engine (`csvx-go`, `csvx-ts`, future ones) should run this against its own generated
fixtures in CI — see `../AGENTS.md` rule 3.2. This is what should have existed from the start;
its absence is exactly how `csvx-go`'s `styles.json` drifted from the schema unnoticed.

## Usage

```bash
npm install
node bin/csvx-validate.mjs path/to/package.csvx
node bin/csvx-validate.mjs path/to/unpacked-dir
node bin/csvx-validate.mjs ../examples/*.csvx   # validate every example at once
```

Exits `0` if every target is valid, `1` if any target has findings. Repeated findings against the
same resource (e.g. the same schema violation across thousands of cells) are grouped with a count
and a few sample locations rather than printed one line per cell.

## What it does not check

This validates *shape* only — it proves a package matches the JSON Schemas, not that an engine
computed the right formula result or applied the right calculation semantics. Behavioral
conformance is a separate concern covered by `../tests/*.json` (format-neutral operation vectors);
each engine needs its own runner for those. See `../AGENTS.md` for how the two fit together.
