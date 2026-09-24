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
