# 5. Cell values

A cell MAY contain `value`, `formula`, `style`, and `validation`. It MUST contain at least one of
`value` or `formula`; a formula cell SHOULD contain a cached `value` produced by the last successful
calculation.

```json
{"formula":"=A2*B2","value":{"type":"decimal","value":"19.95"}}
```

The cached value is advisory. Readers that calculate MUST replace it when the formula is evaluated.
Readers that cannot calculate MUST preserve the formula and cache byte-for-byte where practical.

Blank, empty text, zero, and false are distinct values. A missing cell is blank; an explicit blank
cell is permitted when style or validation metadata must be attached.
