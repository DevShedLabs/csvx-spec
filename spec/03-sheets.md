# 3. Sheets

A sheet consists of a canonical CSV data file and optional JSON metadata sidecar. The CSV header
row defines the visible columns and occupies row 1 in A1 references. Data records begin at row 2.

```text
sheets/sales.csv
sheets/sales.meta.json
```

The CSV layer is intentionally usable without a CSVX library. CSV values are serialized according
to the sheet's declared column metadata when available; without metadata, they are text. Quoting,
commas, and newlines MUST follow RFC 4180-compatible CSV rules.

The metadata sidecar contains stable identity, column types, formulas, styles, validation, and
explicit cell overrides. It MUST NOT duplicate ordinary CSV values unless needed as a formula cache.
A sidecar MAY represent sparse cell metadata using A1 coordinates. An absent cell is blank; an
explicit blank metadata entry is allowed when style or validation must be attached.

Column types provide defaults and validation hints; an individual cell MAY override a column type.
Sheet names MUST be non-empty, no longer than 255 Unicode scalar values, and MUST NOT contain `:`
or control characters. Sheet IDs MUST be stable and MUST match the package resource names.
