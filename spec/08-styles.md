# 8. Styles

Styles are optional and presentation-only. A cell references a style by stable ID; style records
are stored in `styles.json`. Unsupported style properties MUST be preserved when round-tripping.

Core properties are `numberFormat`, `font`, `fill`, `border`, `alignment`, and `protection`.
Number formats MUST NOT alter the underlying value. A renderer MAY fall back to a readable default
when a format is unsupported.

Style inheritance is not part of Core 1.0. Each resolved style is self-contained, which keeps
implementations simple and makes serialized output predictable.
