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
