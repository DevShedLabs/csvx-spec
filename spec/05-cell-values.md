# 5. Cell values

A cell metadata entry MAY contain `formula`, `cached`, `style`, and `validation`. A formula cell
MUST contain `formula`; it MAY contain a `cached` value produced by the last successful calculation.
Ordinary non-formula values belong in the sheet CSV. An explicit blank metadata entry is permitted
when style or validation must be attached.

```json
{"formula":"=A2*B2","cached":{"type":"decimal","value":"19.95"}}
```

The cached value is advisory. Readers that calculate MUST replace it when the formula is evaluated.
Readers that cannot calculate MUST preserve the formula and cache byte-for-byte where practical.

Blank, empty text, zero, and false are distinct values. A missing cell is blank; an explicit blank
cell is permitted when style or validation metadata must be attached.

A cell metadata entry MAY also contain `type`, overriding its column's declared type for that one
cell. `type`, `formula`, and `cached` all describe a cell's current *content*, not the cell as a
slot — an editor that replaces a cell's content (a new literal value, or one formula replacing
another) MUST drop any `type` and `cached` that described the old content, the same way it MUST
drop a stale `formula`. `style` and `validation` describe the cell's presentation and constraints
rather than its content and are unaffected by a content edit. A reader with no declared type at all
for a cell (no column type, no `type` override) MUST resolve its CSV text using the same literal
rules as an untyped CSV value (see 04-data-types.md): blank, boolean, integer, or decimal by literal
shape, otherwise string. This is not free-form inference — a declared type always wins outright and
is never second-guessed.
