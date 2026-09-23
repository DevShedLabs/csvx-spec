# 2. Workbook

A workbook contains an ordered set of sheets, optional named ranges, calculation settings, and
style references.

Required fields are `id`, `version`, and `sheets`. IDs are stable opaque strings matching
`^[A-Za-z][A-Za-z0-9_-]{0,63}$`. Sheet IDs and names MUST be unique within a workbook.

The core workbook object is:

```json
{
  "id": "book-1",
  "version": "1.0",
  "sheets": [{"id": "sheet-1", "name": "Sales", "path": "sheets/sheet-1.json"}],
  "calculation": {"mode": "automatic", "iteration": false}
}
```

`calculation.mode` is `automatic`, `manual`, or `on-load`; the default is `automatic`.
Named ranges are workbook-scoped and MUST resolve to a range or a constant expression.
