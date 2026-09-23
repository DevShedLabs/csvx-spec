# 1. Container

A `.csvx` file is a ZIP archive. ZIP entries MUST use UTF-8 names and MUST NOT contain absolute
paths, `..` path segments, or duplicate names.

Required entries:

```text
manifest.json
workbook.json
sheets/<sheet-id>.json
```

Optional entries:

```text
styles.json
schemas/*.json
attachments/*
```

`manifest.json` identifies the format and package contents. `workbook.json` contains workbook
metadata and the ordered sheet list. Each sheet is a separate JSON resource so readers can stream
or selectively load large workbooks.

Readers MUST reject missing required entries, duplicate ZIP names, invalid UTF-8, and entries that
exceed implementation resource limits. Writers SHOULD use stable entry ordering and timestamps when
producing reproducible archives.
