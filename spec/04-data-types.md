# 4. Data types

Core scalar types are `blank`, `boolean`, `integer`, `decimal`, `string`, `date`, `time`,
`datetime`, and `error`. `string` is the canonical serialized name; implementations MAY call it
`text` internally.

JSON representation is explicit to avoid language-specific coercion:

```json
{"type":"integer","value":42}
{"type":"decimal","value":"19.95"}
{"type":"date","value":"2026-09-22"}
{"type":"datetime","value":"2026-09-22T12:30:00Z"}
{"type":"error","code":"DIV0","message":"Division by zero"}
```

All values MUST use an object with a `type` member. `blank` uses no `value` member. `error` MUST
use a stable `code` member and MAY include a diagnostic `message`; messages are not used for
semantic comparison. A string uses `{"type":"string","value":"..."}`.

Decimals MUST be encoded as base-10 strings. Dates and datetimes use RFC 3339 forms; a datetime
without an offset is invalid. Implementations MUST NOT silently convert invalid values to string.

Core error codes are `NULL`, `DIV0`, `VALUE`, `REF`, `NAME`, `NUM`, `N/A`, and `CYCLE`.

## Literal forms

A CSV field serializes a scalar as text. These are the canonical text forms, and the only forms any
engine recognizes without a declared format (see `08-styles.md` for the number-format exception).
Matching is exact and case-sensitive; there is no locale handling, no thousands separators, no
currency symbols, and no surrounding-whitespace trimming.

| Type | Literal form |
| --- | --- |
| `blank` | the empty string |
| `boolean` | `true` or `false` |
| `integer` | `-?(0\|[1-9][0-9]*)` — no leading zeros, no `+` sign, and `-0` is not an integer |
| `decimal` | `-?(0\|[1-9][0-9]*)\.[0-9]+` — a `.` is required and so is at least one fractional digit; no exponent |
| `date` | `YYYY-MM-DD`, a real calendar date |
| `time` | `HH:MM:SS`, 24-hour, `00:00:00`–`23:59:59` |
| `datetime` | RFC 3339 `YYYY-MM-DDTHH:MM:SS[.fraction](Z\|±HH:MM)` — the offset is required |
| `string` | anything |

The **untyped literal rules** used by `05-cell-values.md` resolve a field to the first match among
`blank`, `boolean`, `integer`, `decimal`, otherwise `string`. They never produce `date`, `time`, or
`datetime`; those need a declared type or CSV import inference (`11-import-export.md`). Text that
merely looks like a number but is not a literal form — `007`, `+5`, `1e3`, `1,000`, `$5` — is a
`string`, which keeps identifiers such as ZIP codes and phone numbers intact.

A decimal's text is preserved exactly (`19.50` stays `"19.50"`); engines MUST NOT normalize it.
