# Interop round-trip conformance tests

These vectors check something `validator/` cannot: that converting between XLSX and CSVX
preserves meaning, not just shape. A package can be perfectly schema-valid and still have silently
lost a formula, a font color, or turned a decimal into a string — the `cached` value bug described
below passed every schema check while being wrong.

Same format as the other `tests/` categories: format-neutral JSON vectors. A runner loads `input`,
performs the named `operation`, and compares the semantic result against `expected`. The difference
here is `input` points at a real binary/ZIP fixture file, not inline data — round-trip fidelity is
inherently about real files, not abstract values.

## Vector shape

```json
{
  "id": "xlsx-to-csvx-example",
  "operation": "xlsx-to-csvx",
  "input": "../../examples/example.xlsx",
  "expected": {
    "schemaValid": true,
    "samples": [
      {"sheet": "Sheet1", "cell": "A1", "type": "string", "value": "Average salary for a Senior Software Engineer"},
      {"sheet": "Sheet1", "cell": "A1", "style.font.bold": true},
      {"sheet": "Sheet1", "cell": "D2", "type": "decimal", "value": "170000.0"},
      {"sheet": "Sheet1", "cell": "D2", "style.numberFormat": "\"$\"#,##0.00"},
      {"sheet": "Sheet1", "cell": "C11", "formula": "=SUM(D11/B11)"},
      {"sheet": "Sheet1", "cell": "C11", "cached.type": "decimal"}
    ]
  }
}
```

`samples` are point assertions at known A1 coordinates (row 1 is the CSV header, so a `value` there is a column name; data row N is record N-2 — see `spec/03-sheets.md` and `spec/14-xlsx-interoperability.md` 14.7) — specific enough to catch the class of bug
that already shipped here (a decimal formula result cached with `"type": "decimal"` on the schema
side but `"type": "string"` in practice), without trying to assert the entire fixture byte-for-byte.

`namedRanges` (the imported `workbook.json` names, in order) and `warnings` (the `definedName`-feature
warnings recorded in the source metadata, by `name`, in order) are used by `xlsx-named-ranges.json`.

`schemaValid: true` means the runner must also validate the operation's real output against
`../../schemas/*.json` (via `../../validator` or an engine's native equivalent) — a passing interop
test implies a passing schema-shape test, not just the reverse.

`xlsx-cross-sheet.json` (spec 14.11) uses `examples/cross-sheet.xlsx`, a hand-assembled workbook whose
formulas include a needlessly quoted sheet, a cell-like sheet name (`Q1`), a three-dimensional
reference and a reference into another workbook. Its `formulas` are expected formula text, `values`
the cells that keep only a cached result because their formula was dropped, and `warnings` the
`formula` diagnostics by `path`.

## Current status (2026-09-30)

- `xlsx-to-csvx` is implemented (`csvx-go`'s `Convert`) and is the only direction currently
  testable end to end. `xlsx-to-csvx-example.json` is a real, currently-passing vector, run today
  as a Go unit test in `csvx-cli` (`cmd/csvx/convert_test.go`) rather than by a generic JSON-vector
  runner — that generic runner does not exist yet for this category. Building one (so any engine,
  not just `csvx-go`, can consume these vectors without a language-specific harness) is open work.
- `csvx-to-xlsx` is implemented in `csvx-go` (`ExportXLSX`, spec 14.9) and covered by
  `csvx-to-xlsx.json`: each case exports a real fixture (optionally after edits and added names),
  imports the XLSX again, and compares samples, names, sheet names and the export warnings. It runs
  as a Go test in `csvx-go` (`xlsx_export_test.go`); like `xlsx-to-csvx`, no generic cross-engine
  runner exists, and TypeScript reaches it through the `csvx` CLI. The XLSX is checked by our own
  importer, not by Excel; opening the files in a real spreadsheet application is still a manual check.
  Dates round-trip as ISO text and errors as CSVX codes (spec 14.10).
- The fixtures used here (`examples/example.xlsx`, hand-picked cells) are a real spreadsheet, not a
  purpose-built exhaustive one. `csvx-cli`'s planned `gen test.csvx` (see `../../AGENTS.md` rule
  4.4) needs an XLSX counterpart that deliberately exercises every scalar type and style property,
  rather than whatever `example.xlsx` happens to contain. Until that exists, treat this category's
  coverage as representative, not exhaustive.
