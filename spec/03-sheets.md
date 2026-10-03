# 3. Sheets

A sheet consists of a canonical CSV data file and optional JSON metadata sidecar. The CSV header
row defines the visible columns and occupies row 1 in A1 references. Data records begin at row 2.
This holds everywhere A1 coordinates are used — formulas, `cells` keys, `rowHeights` keys, and
print settings — so the Nth line of the CSV file is always row N. The header row is a real row of
the sheet: it can carry style and other cell metadata under row-1 coordinates (`A1`, `B1`, …), and
a header cell's text is the column's `name`.

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

## Default grid

An interactive editor SHOULD present every sheet, including a newly created one, as at least the
grid `A1:Z100` (columns A–Z, rows 1–100), padding the view with blank cells beyond the sheet's
actual data. This is a presentation default only and is not part of the format:

- Padding is never written. A new sheet's CSV and sidecar contain no placeholder header names,
  blank columns, or blank rows, and the sidecar declares no columns that the user has not named.
- An engine MUST NOT pad or trim a sheet on load or save, and `create` and CSV import keep the
  extent of the source data.
- Padded cells are blank and carry no metadata; they are not part of the used range (see Print
  settings). Typing into one adds it to the sheet like any other edit.

## Print settings

A sheet's metadata MAY carry a `print` object describing how the sheet is paginated and printed.
Settings are part of the workbook: an editor MUST write the print settings the user chose back to
the sidecar, and a reader MUST preserve ones it does not understand. Every property is optional;
an absent property takes the default shown. Unknown properties are preserved.

| Property | Type | Default | Meaning |
| --- | --- | --- | --- |
| `orientation` | `portrait` \| `landscape` | `portrait` | Page orientation. |
| `paperSize` | `letter` \| `legal` \| `tabloid` \| `a3` \| `a4` \| `a5` | `letter` | Paper size, before orientation is applied. |
| `margins` | `{top, right, bottom, left}` | `0.75, 0.7, 0.75, 0.7` | Page margins in **inches**, the unit XLSX uses. |
| `scale` | number, 10–400 | `100` | Print scale as a percentage. Ignored when `fitToWidth` or `fitToHeight` is present. |
| `fitToWidth` | integer ≥ 0 | absent | Shrink to fit this many pages across. `0` means "as many as needed". |
| `fitToHeight` | integer ≥ 0 | absent | Shrink to fit this many pages down. `0` means "as many as needed". |
| `area` | A1 range, e.g. `A1:H61` | the used range | The cells to print. |
| `repeatRows` | row range, e.g. `1:2` | none | Rows repeated at the top of every page. |
| `repeatColumns` | column range, e.g. `A:B` | none | Columns repeated at the left of every page. |
| `pageOrder` | `downThenOver` \| `overThenDown` | `downThenOver` | Order in which pages are numbered when the print area spans several pages across and down. |
| `gridlines` | boolean | `false` | Print the default gridlines. Borders declared by styles (see 08-styles.md) always print. |
| `centerHorizontally` | boolean | `false` | Center the printed content between the left and right margins. |
| `columnBreaks` | array of integers | none | 1-based column numbers after which a page break is forced. |
| `rowBreaks` | array of integers | none | 1-based row numbers after which a page break is forced. |

Ranges and row and column numbers here are A1 coordinates as defined at the top of this document,
so they are the row and column numbers an XLSX import carries over unchanged. The **used
range** is the rows and columns up to the last cell that prints something: a value, a formula, a
visible fill, or a visible border. Formatting that draws nothing (a number format or font on an
empty cell) is not part of the used range; this matters because spreadsheets often format
thousands of empty rows.

Pagination is the renderer's responsibility. Given the paper size, orientation, margins, and scale,
a renderer places columns left to right into pages that fit the printable width, and rows top to
bottom into pages that fit the printable height, honoring `columnBreaks`, `rowBreaks`,
`repeatRows`, and `repeatColumns`. Column widths and row heights use the units defined above.
Where `fitToWidth` or `fitToHeight` would require a scale below 10%, a renderer SHOULD clamp to 10%
and paginate the remainder.

