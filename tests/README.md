# Conformance tests

Tests are format-neutral JSON vectors. A runner loads `input`, performs the operation named by
`operation`, and compares the semantic result with `expected`.

- `parsing/` package and resource parsing
- `formulas/` formula grammar and function behavior
- `calculations/` dependency and cache behavior
- `styles/` preservation of presentation metadata
- `print/` preservation of sheet print settings
- `edit/` editor operations whose result must agree across engines (text case)
- `import-csv/` plain CSV → CSVX conversion (see its README)
- `invalid/` required rejection cases

Decimal values are strings intentionally. Test IDs are stable and should be cited in implementation
failure reports.
