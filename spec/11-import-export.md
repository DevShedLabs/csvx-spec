# 11. Import and export

Importers translate external formats into the CSVX data model; exporters translate from CSVX. They
MUST NOT silently discard formulas, errors, styles, or unsupported metadata. Lossy conversions MUST
report warnings with a location and reason.

CSV export is defined in 11.2: the Core default exports each formula cell's calculated value and
reports that formulas were omitted.

## 11.1 CSV import

A plain `.csv` file MUST be convertible to a CSVX workbook by every conforming engine and by
`csvx-cli`. The conversion is deterministic: the same bytes and options always produce the same
package. The CSV is the only input; no other file is consulted.

### Options

| Option | Default | Meaning |
| --- | --- | --- |
| `delimiter` | `,` | Single-character field delimiter (`,`, `;`, tab, `\|`). Never auto-detected. |
| `header` | `true` | The first record is the header row. |
| `infer` | `false` | Declare column types from the data (see "Type inference"). |
| `name` | source file stem, else `Sheet 1` | The sheet name. |

Engines MUST expose all four. Encoding is UTF-8; a leading UTF-8 byte-order mark is removed. Input
that is not valid UTF-8 MUST be rejected, not transcoded by guessing.

### Structure

The result is a single-sheet workbook shaped like `examples/minimal.csvx`, with a sheet `name` per
the option and a stable `id`: the name lowercased, runs of characters outside `[A-Za-z0-9_-]`
replaced by `-`, trimmed of `-`, prefixed `s` if it does not start with a letter, truncated to 64
characters, and `sheet-1` if nothing remains. The workbook `id` is that same value. The sheet's CSV
resource is `sheets/<id>.csv`; its metadata sidecar is written only when it would carry something
(declared column types), and is `sheets/<id>.meta.json`.

Fields are parsed with RFC 4180 rules, accepting both CRLF and LF record terminators. The CSV
resource is written with LF terminators and minimal quoting; field *content*, including embedded
newlines, leading/trailing whitespace, and leading zeros, MUST be preserved exactly.

Per `03-sheets.md` the header is row 1 and holds the column names. Each column gets `id` `A`, `B`,
… in order, and `name` equal to its header text. When `header` is `false` the importer MUST
synthesize a header row of `Column 1`, `Column 2`, … (the spreadsheet-neutral "Column N") and insert
it as row 1, so the source's first record becomes row 2; it MUST report a warning saying data rows
were shifted by one.

Records shorter than the header are padded with empty fields; records longer than the header
extend the sheet with extra columns named `Column N` (N the 1-based column number). An empty header
field is likewise named `Column N`, since a column name MUST be non-empty. Each of these MUST be
reported as a warning with the 1-based source record number (the header, when present, is record 1;
for an empty header field the location is `record 1`). Duplicate header texts are kept as-is
(column ids, not names, are the identity).

Input with no records at all (zero bytes, or only a byte-order mark and blank lines) MUST be
rejected: a sheet needs a header row. Wholly empty lines between records are skipped and are not
counted as records. Inside a quoted field, a CRLF is normalized to LF.

A `name` option that is empty, longer than 255 Unicode scalar values, or contains `:` or a control
character MUST be rejected (`03-sheets.md`).

### Never formulas

Imported text is data. A field beginning with `=`, `+`, `-`, or `@` is **not** a formula and MUST
NOT gain a `formula` entry; it is a `string` (or a number if it matches a literal form, e.g. `-5`).
The importer MUST NOT strip, escape, or alter such a field (CSV-injection mitigation is a concern of
whoever later exports to a spreadsheet application, not of import fidelity).

### Type inference

With `infer` false, no column `type` is declared, and consumers resolve fields by the untyped
literal rules (`04-data-types.md`, "Literal forms").

With `infer` true, each column independently gets a declared `type` as follows, considering the
column's non-empty fields only (empty fields are blank and never block a type):

1. No non-empty fields: no type declared.
2. All fields match `boolean`: `boolean`. Likewise all `date`, all `time`, all `datetime`.
3. All fields match `integer`: `integer`.
4. All fields match `integer` or `decimal`, at least one `decimal`: `decimal`.
5. Otherwise `string`.

Only the literal forms in `04-data-types.md` participate: `1/2/2026`, `$5.00`, `TRUE`, `1,000`, and
`007` are strings, and any one of them makes its whole column `string`. Inference never rewrites
field text, so the CSV resource is identical with or without `infer`. Only the header row is
excluded from inference.

### Diagnostics

Importers return warnings as `{location, reason}` records, with `location` an A1 coordinate or a
1-based source record number (`record 7`), per the first paragraph of this document. An import with
only warnings still succeeds. Malformed CSV (an unterminated quote, a stray quote inside an
unquoted field) MUST be rejected with an error carrying the line number; importers MUST NOT repair
it silently.

### Surfaces

`csvx-cli import` accepts a `.csv` input and writes a `.csvx` (it MUST map each option above to a
flag and print warnings to stderr). Engine libraries expose the same conversion as a function from
CSV bytes plus options to an in-memory workbook, so applications holding only CSV bytes need no
CLI. Engines MUST NOT add options or defaults beyond this list without amending this document.

XLSX, charts, pivots, and macros are outside Core. An implementation MAY support them through the
XLSX interoperability extension defined in `14-xlsx-interoperability.md`, but extension data must
not change Core calculation semantics. The extension SHOULD be implemented early enough to validate
CSVX against real XLSX workbooks; it MUST provide exact-source recovery for unchanged embedded
sources and explicit diagnostics for regenerated exports.
## 11.2 CSV export

An engine MUST be able to export any sheet of a workbook as a CSV file, and `csvx-cli export` MUST do
so when its output has a `.csv` extension. The purpose is clean data extraction: the output is the
sheet's data and nothing else, byte for byte predictable, so that a file can be compared across
conversions to detect corruption.

### Options

Engines MUST expose all five and MUST NOT add options or defaults beyond this list without amending
this document.

| Option | Values | Default | Meaning |
| --- | --- | --- | --- |
| `sheet` | a sheet id or name | the first sheet | Which sheet to export. An unknown sheet MUST be rejected. |
| `header` | boolean | `true` | Write the header row (the column names) first. |
| `delimiter` | one character other than `"`, CR or LF | `,` | The field delimiter. |
| `formulas` | `values` or `text` | `values` | Write a formula cell as its calculated value, or as its formula text including the leading `=`. |
| `display` | boolean | `false` | Write numbers as their number format displays them (`$1,250.00`) instead of their literal form (`1250.00`). |

### Structure

The file is UTF-8 with no byte-order mark. Every record, including the last, ends with LF. A field is
quoted if and only if it contains the delimiter, a double quote, CR, or LF; a quoted field doubles
its quotes. No other field is quoted, and field content, including leading and trailing whitespace,
leading zeros, and a leading `=`, `+`, `-`, or `@`, MUST be written exactly: export neither escapes nor
alters text (neutralizing formula injection is the concern of whoever opens the file in a
spreadsheet application). The same rule is how every CSV resource in a package is written (11.1).

The rows are the header row (when `header` is true) followed by the sheet's records, and the fields
are the sheet's columns in order. Nothing is padded or trimmed, except that the records are extended
with blank ones down to the last row that holds a formula cell, because a formula cell is data (the
`multi-sheet` example has its only formula below its last record).

### Values

A field is the cell's CSV text as stored, except that a formula cell is written from its value, which
an exporter MUST obtain by recalculating the workbook first (10-calculation.md), so a stale or missing
cache never reaches the file. With `formulas` set to `values`, that value is written in its literal
form (04-data-types.md): `true` or `false`, an integer or decimal's text unchanged, a string as is, a
date, time or datetime in its ISO form, an error as `#` followed by its code (`#DIV0`), and a blank as
the empty field. With `formulas` set to `text`, the formula is written.

With `display` true, an integer or decimal in a cell whose style has a `numberFormat` is written as
that format displays it (08-styles.md); every other value is written as above.

### Warnings

CSV carries data only, so an exporter MUST report what it leaves out, as warnings with a feature and a
location. With `formulas` set to `values` and a formula cell on the sheet, there is one warning with
the feature `formula` and the sheet's name as its location, saying how many formulas were exported as
values. If the exported sheet has styled cells, validation rules, column widths, row heights or print
settings, or the workbook declares names, there is one warning with the feature `metadata` and the
sheet's name as its location, saying that CSV holds data only. A sheet that is plain data produces
no warnings.

### Round trip

For a CSV in the canonical form above (LF, minimal quoting, rectangular, with a non-empty header),
importing it with the default options and exporting the sheet with the default options MUST return
the same bytes. For a CSV import warns about (ragged records, empty header fields) the export is the
repaired canonical form the import produced.

### Surfaces

`csvx-cli export <input.csvx> <output.csv>` maps each option to a flag (`--sheet`, `--no-header`,
`--delimiter`, `--formulas`, `--display`), writes the first sheet unless `--sheet` is given, and
prints warnings to stderr. With `--all` and an output that is a directory it writes one `<sheet
name>.csv` per sheet. The vectors are `tests/export-csv/`.

