# 11. Import and export

Importers translate external formats into the CSVX data model; exporters translate from CSVX. They
MUST NOT silently discard formulas, errors, styles, or unsupported metadata. Lossy conversions MUST
report warnings with a location and reason.

CSV export MUST define how formulas are emitted; the Core default is to export calculated display
values and report that formulas were omitted.

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
