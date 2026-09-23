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
