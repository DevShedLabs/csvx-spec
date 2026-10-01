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

A column's `width` (`schemas/sheet-metadata.schema.json`) is in the same character-width unit XLSX
itself uses: the number of "0" characters (in the workbook's normal/default font — Calibri 11 is
the common case) that fit the column, plus internal cell padding. This isn't an arbitrary choice —
it's what every real producer of this field already does (an XLSX import copies the source file's
column widths verbatim, in that unit), so declaring anything else now would make every file already
in the wild nonconformant. A renderer converts to pixels with
`pixels = round(width * 7 + 5)` (the standard Calibri-11 approximation) and back with
`width = (pixels - 5) / 7` when writing a pixel-based resize back to this field; neither direction is
exact (real glyph widths vary slightly by character and by font), but both engines MUST use this
same formula so a width written by one tool round-trips predictably through another. A sheet's
`rowHeights` entries (keyed by 1-based row number) are in points, matching XLSX's own row-height
unit (its default row height is 15pt); a pixel-based renderer converts with `pixels = points * 4/3`
and back with `points = pixels * 3/4`. Neither width nor height may be negative or zero.
