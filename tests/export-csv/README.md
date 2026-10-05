# CSV export vectors

Spec `11-import-export.md` 11.2. Expected CSV text is compared byte for byte.

- `export.json`, operation `csvx-to-csv`: `input` is `{package | workbook, options}`. `package` is a
  fixture under `examples/`; `workbook` is an inline workbook (`sheets` with `columns`, `records`,
  `cells`, optional `styles`). `options` are the five export options. `expected` is `{csv, warnings}`,
  where `warnings` are `[{feature, location}]` (message text is not compared).
- `round-trip.json`, operation `csv-round-trip`: import `input.file` (a CSV under `examples/csv/`) with
  `importOptions`, export the sheet with default options, and expect `expected.csv`. These are the
  canonical forms the import vectors already pin down, so export is held to the same bytes.
- `via-xlsx.json`, operation `csv-via-xlsx`: export a fixture to CSV directly, then export it to
  XLSX, import that, export CSV again, and expect the two files to be identical. This is the check
  for corruption across conversions.
