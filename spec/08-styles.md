# 8. Styles

Styles are optional and presentation-only. A cell references a style by stable ID; style records
are stored in `styles.json`. Unsupported style properties MUST be preserved when round-tripping.

Core properties are `numberFormat`, `font`, `fill`, `border`, `alignment`, and `protection`.
Number formats MUST NOT alter the underlying value. A renderer MAY fall back to a readable default
when a format is unsupported.

The reverse direction is symmetric: when an editor resolves a literal that has no declared scalar
type (see 05-cell-values.md), and the cell carries a `numberFormat` the editor already understands,
it MAY parse that literal against that same format's own affixes and grouping — e.g. recognizing
"$7.00" as the decimal `7.00` when the cell's `numberFormat` is `"$"#,##0.00` — rather than falling
back to `string` just because the text contains formatting characters it put there itself in the
first place. This is bounded strictly to formats the editor already supports for *display*; it is
not general, locale-aware currency or number parsing (symbol position, locale-dependent decimal and
grouping separators, multi-currency disambiguation, etc.), which is a substantially larger problem
this version does not attempt to solve. Text that doesn't match the format's own shape falls through
to the normal untyped literal rules, same as if no `numberFormat` were present at all.

Style inheritance is not part of Core 1.0. Each resolved style is self-contained, which keeps
implementations simple and makes serialized output predictable.
