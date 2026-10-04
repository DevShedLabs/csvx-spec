# 14. XLSX interoperability extension

XLSX interoperability is an optional CSVX extension. CSVX Core remains the authority for portable
workbook semantics; XLSX behavior MUST NOT redefine Core values, formulas, calculation, or errors.

## 14.1 Embedded source

An XLSX importer MAY embed the original source document in the package:

```text
source/original.xlsx
source/source.json
```

`source/original.xlsx` MUST be an opaque copy of the source bytes. `source/source.json` MUST include:

- `format`: `xlsx` or `xlsm`
- `filename`
- `sha256`
- `importedAt`
- `importer`
- `authority`: `original` or `csvx`
- `features`: an inventory of detected source features
- `mappings`: source-to-CSVX sheet and cell mappings where available
- `warnings`: lossy or unsupported conversion diagnostics

The source hash MUST be the SHA-256 digest of the embedded source bytes. A reader MUST verify this
hash before offering exact-source recovery.

## 14.2 Exact-source recovery

When `authority` is `original` and the CSVX workbook has not been modified, an exporter SHOULD return
the embedded source bytes unchanged. This is exact-source recovery, not proof that all XLSX semantics
were represented in the CSVX model.

After a supported CSVX edit, `authority` MUST become `csvx`. The exporter MUST NOT silently return
an unchanged embedded source when that would hide the edit.

## 14.3 Feature inventory and diagnostics

An importer MUST inventory features it detects, including sheets, dimensions, values, formulas,
cached results, shared strings, styles, number formats, merged cells, hidden content, validations,
names, relationships, drawings, comments, images, charts, macros, and external references where
applicable. Implementations MAY add feature categories.

Unsupported or lossy features MUST produce diagnostics with a feature category, source location when
known, severity, and reason. An importer MUST preserve unsupported source resources when possible or
report that they cannot be preserved.

## 14.4 Security and policy

Embedded sources MAY contain personal data, hidden content, external links, or macros. Implementations
MUST treat embedded sources as untrusted data and MUST NOT execute macros or external links during
import or export. Macro preservation and removal MUST be explicit policy decisions and MUST be
reported in diagnostics.

## 14.5 Interoperability testing

Implementations SHOULD provide:

1. An exact-source test comparing SHA-256 hashes after import and unchanged export.
2. A semantic comparison test between the source and a regenerated XLSX.
3. A conversion report identifying supported, preserved, transformed, and unsupported features.

These tests validate interoperability; they do not make XLSX the CSVX specification.

## 14.6 Print settings mapping

An importer MUST map these XLSX constructs onto the sheet `print` object (03-sheets.md) and an
exporter MUST map them back:

| `print` property | XLSX source |
| --- | --- |
| `orientation` | `pageSetup/@orientation` |
| `paperSize` | `pageSetup/@paperSize` (1 letter, 3 tabloid, 5 legal, 8 a3, 9 a4, 11 a5) |
| `margins` | `pageMargins/@top,@right,@bottom,@left` |
| `scale` | `pageSetup/@scale` |
| `fitToWidth`, `fitToHeight` | `pageSetup/@fitToWidth,@fitToHeight`, only when `sheetPr/pageSetUpPr/@fitToPage` is true |
| `area` | defined name `_xlnm.Print_Area` scoped to the sheet |
| `repeatRows`, `repeatColumns` | defined name `_xlnm.Print_Titles` scoped to the sheet |
| `pageOrder` | `pageSetup/@pageOrder` (`downThenOver`, `overThenDown`) |
| `gridlines` | `printOptions/@gridLines` |
| `centerHorizontally` | `printOptions/@horizontalCentered` |
| `columnBreaks`, `rowBreaks` | `colBreaks/brk/@id`, `rowBreaks/brk/@id` |

An importer SHOULD omit `margins` that equal the defaults in 03-sheets.md and `scale` of 100, since
nearly every XLSX file states them and they carry no information.

A paper size with no CSVX equivalent is not mapped to `paperSize`; the importer MUST keep the source
value on the `print` object as `xlsxPaperSize` so it round-trips. Headers and footers are not part of
Core 1.0 and are preserved as unknown properties when an importer chooses to carry them.

## 14.7 Worksheet rows and the CSV header

An XLSX worksheet row N is CSVX row N (03-sheets.md), with no offset. An importer MUST therefore
write worksheet row 1 as the CSV header row and worksheet rows 2 and later as data records. Each
header cell's text becomes that column's `name`; a header cell that is empty is named after its column
letter (`A`, `B`, …) because a CSV header cell MUST NOT be empty. Cell metadata for row 1 (style, a
formula and its cached value) is kept under the row-1 coordinate like any other cell's. `rowHeights`
keys are worksheet row numbers unchanged. A worksheet with no cells is imported as a header of `A`
only.


## 14.8 Defined names

An importer MUST map a workbook-scoped XLSX defined name (a `definedName` with no `localSheetId`)
onto `namedRanges` (02-workbook.md) when its formula is a single cell reference, a single range,
or a constant (number, string, or boolean), and its name satisfies the rules in 02-workbook.md.
`refersTo` is `=` followed by the formula, with each sheet qualifier written as 06-formulas.md
requires (XLSX always quotes it) and `$` markers kept.

`_xlnm.Print_Area` and `_xlnm.Print_Titles` are print settings (14.6), not names. Every other
defined name is not imported, and the importer MUST report each as a warning with the feature
`definedName` and a message naming it and giving the reason: sheet-scoped, a formula that is not a
single reference or constant (for example `OFFSET(...)`), a name that breaks the 02-workbook.md
rules, or a built-in `_xlnm.` name with no CSVX equivalent. An exporter writes each `namedRanges`
entry as a workbook-scoped defined name.

## 14.9 CSVX to XLSX export

An exporter writes an XLSX workbook from CSVX content; the CSVX workbook is the authority, never an
embedded source that an edit has made stale (14.2). If `authority` is `original` and the workbook is
unmodified, an exporter SHOULD return the embedded source bytes instead.

**Values.** Each cell's type is its metadata `type`, else its column's, else the untyped literal
rules of 04-data-types.md. `integer` and `decimal` are numbers whose text is written unchanged;
`boolean` is `t="b"`; `string` is a string (shared or inline); `blank` has no value, though its style
is kept; `date`, `time` and `datetime` are numbers in the 1900 date system, with a date or time
number format applied if the cell's style has none. `error` is an XLSX error literal:

| CSVX code | XLSX |
| --- | --- |
| `DIV0` | `#DIV/0!` |
| `VALUE` | `#VALUE!` |
| `REF` | `#REF!` |
| `NAME` | `#NAME?` |
| `NUM` | `#NUM!` |
| `NULL` | `#NULL!` |
| `N/A` | `#N/A` |

`CYCLE` has no XLSX equivalent and is written as `#VALUE!` with a warning. A formula cell is written
as the formula without its leading `=`, with its `cached` value when present. The header row is
written as strings, so row N of the sheet is row N of the worksheet (14.7).

**Styles.** Each style referenced by a cell becomes an XLSX cell format: `numberFormat`, `font`
(`name`, `size`, `bold`, `italic`, `color`), `fill` (`color` as a solid fill), `border` per edge
(with an `xlsxStyle` value restored when present), and `alignment`. A style property XLSX cannot
represent is reported as a warning, not dropped silently.

**Sheets and layout.** `Column.width` and `rowHeights` are written in their own units (03-sheets.md).
The `print` object is written as in 14.6, including the print names. Validation rules are written as
data validations; a `list` rule whose `formula1` does not start with `=` is a literal list. `namedRanges`
are written as workbook-scoped defined names (14.8).

**Sheet names.** XLSX limits a name to 31 characters and forbids `[ ] * ? / \`. An exporter MUST
replace each forbidden character with `_`, shorten to 31 characters, make names unique ignoring case,
rewrite every reference to the sheet in formulas and names, and report a warning for each change.

**Reporting.** An exporter MUST report each loss or transformation as a warning with feature, location
and reason. The vectors are `tests/interop/csvx-to-xlsx.json`: each exports a fixture, imports the
result again, and compares cells, styles, print settings and names.

## 14.10 Importing dates, times, and errors

The importer is the inverse of 14.9 for these values, so a CSVX workbook keeps its CSV text through an
export and import.

**Dates and times.** A numeric cell whose number format is a date or time format is a `date`, `time`
or `datetime`, decided from the format with quoted text and bracketed sections (`"at"`, `[$-409]`,
`[h]`) ignored: a format with a `d` or `y` token and an `h` or `s` token is a `datetime`, a format
with only `d`/`y` a `date`, a format with only `h`/`s` a `time`. The CSV text is the ISO 8601 form
04-data-types.md requires (`2026-09-22`, `14:30:00`, `2026-09-22T14:30:00`), converted from the serial
number in the workbook's date system (1900 unless `workbookPr/@date1904` is true). A serial that does
not convert (negative, not a whole number in a date format, or one day or more in a time format)
is kept as the number.

**Errors.** An error cell's `cached` code and its CSV text use the CSVX code (`DIV0`, written `#DIV0`
in the CSV), by the table in 14.9. An XLSX error literal with no entry in the table keeps its text
without the `#` and `!` or `?` suffix.
