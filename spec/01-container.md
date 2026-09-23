# 1. Container

A `.csvx` file is a ZIP archive. ZIP entries MUST use UTF-8 names and MUST NOT contain absolute
paths, `..` path segments, or duplicate names.

Required entries:

```text
manifest.json
workbook.json
sheets/<sheet-id>.csv
```

Optional entries:

```text
sheets/<sheet-id>.meta.json
styles.json
schemas/*.json
attachments/*
```

CSV is the canonical sheet data layer. A sheet CSV MUST be valid UTF-8 RFC 4180-compatible CSV and
MUST contain a header row. The header row is part of the sheet and occupies row 1 in A1 references.
Workbook and sheet metadata, formulas, styles, and validation live in JSON sidecars so ordinary CSV
tools can still read the tabular data.

`manifest.json` identifies the format and package contents. `workbook.json` contains workbook
metadata and the ordered sheet list. A sheet entry MUST identify its CSV path and MAY identify its
metadata sidecar. A missing sidecar means the sheet has no formulas, styles, validations, or
per-cell overrides beyond workbook column metadata.

Readers MUST reject missing required entries, duplicate ZIP names, invalid UTF-8, and entries that
exceed implementation resource limits. Writers SHOULD use stable entry ordering and timestamps when
producing reproducible archives.

The package MUST NOT require a proprietary binary format or a language-specific serialization format
for its tabular data.
