# CSV import vectors

Operation `csv-to-csvx` (spec `11-import-export.md` §11.1). `input` is `{file, options}` with `file`
a real CSV under `examples/csv/` (resolved relative to the repo root). The runner converts, then
checks `expected`:

- `schemaValid` — the produced package passes `validator/`.
- `sheet` — `{id, name}` of the single sheet.
- `columns` — `[{id, name, type?}]` in order; an absent `type` means none is declared.
- `csv` — the exact CSV resource text, LF terminated.
- `cells` — point assertions `{cell, type, value}` by *untyped-literal or declared-type resolution*.
- `noFormulas` — true: no cell metadata carries `formula`.
- `warnings` — `[{location}]` (reason text is not compared).

`error` instead of the above means the import MUST fail; `line` is the 1-based line of the fault.
