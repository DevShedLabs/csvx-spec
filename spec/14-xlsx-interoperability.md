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

