# Conformance tests

Tests are format-neutral JSON vectors. A runner loads `input`, performs the operation named by
`operation`, and compares the semantic result with `expected`.

- `parsing/` package and resource parsing
- `formulas/` formula grammar and function behavior
- `calculations/` dependency and cache behavior, within a sheet and across sheets
- `styles/` preservation of presentation metadata
- `print/` preservation of sheet print settings
- `edit/` editor operations whose result must agree across engines (text case, row/column insert and delete, sheet add/rename/delete, cell, paste, style, print edits; see spec/15)
- `import-csv/` plain CSV → CSVX conversion (see its README)
- `interop/` XLSX to CSVX conversion against real fixtures (see its README)
- `export-csv/` CSV export, import-to-export round trips, and the CSV-via-XLSX corruption check (see its README)
- `values/` how a CSV field resolves to a typed value
- `invalid/` required rejection cases (including named-range validity)

Decimal values are strings intentionally. Test IDs are stable and should be cited in implementation
failure reports.

## Coverage

`coverage.json` records how each normative statement (MUST or SHOULD) in `spec/` is tested, and
`runners.json` records which engine runner executes each vector operation. `node tools/coverage.mjs
--verbose` checks both and lists the known gaps; see `AGENTS.md` rule 3.8.
