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
  "sheets": [{"id": "sheet-1", "name": "Sales", "path": "sheets/sheet-1.csv"}],
  "calculation": {"mode": "automatic", "iteration": false}
}
```

`calculation.mode` is `automatic`, `manual`, or `on-load`; the default is `automatic`.
## Named ranges

A workbook MAY declare names in `workbook.json` under `namedRanges`, an array of objects with a
`name` and a `refersTo`:

```json
"namedRanges": [
  {"name": "TaxRate", "refersTo": "=Rates!$B$1"},
  {"name": "Prices", "refersTo": "=Sales!$C$2:$C$100"},
  {"name": "Greeting", "refersTo": "=\"Hello\""}
]
```

- `name` MUST start with a letter or `_`, continue with letters, digits, `_` or `.`, and MUST NOT
  look like a cell reference (`A1`, `$B$2`) or be `TRUE` or `FALSE`. Names are case-insensitive and
  MUST be unique within the workbook, ignoring case. A name MUST NOT be a Core function name.
- `refersTo` is a formula expression beginning with `=` that resolves to a single reference, a
  range, or a constant. Every cell reference in it MUST be sheet-qualified, because a name has no
  home sheet. It MUST NOT itself use a name.
- Names are workbook-scoped; sheet-scoped names are not part of Core 1.0.

A package that breaks these rules (a malformed or reserved name, a duplicate, or a `refersTo` that
does not parse, uses a name, or has an unqualified reference) is invalid. A reader MUST reject it
with the diagnostic code `INVALID_NAMED_RANGE`, naming the offending `name`. `schemas/` can only
check each field's shape, so this is checked by the engine after loading (the vectors are
`tests/invalid/named-range-*.json`).

A formula uses a name wherever it could use the thing it refers to (06-formulas.md). Names are
declarative data: loading a workbook never evaluates them.
