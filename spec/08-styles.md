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

## Borders

`border` describes the cell's own edges, not an outline drawn around its content. It has up to four
edge objects — `top`, `right`, `bottom`, `left` — each with an optional `style` (`none`, `thin`,
`medium`, `thick`, `dashed`, `dotted`, `double`) and an optional `color` (a CSS hex color). An
absent edge, or an edge with `style: "none"`, has no explicit border; a renderer MAY still draw its
own gridlines there.

```json
{ "id": "s1", "border": { "bottom": { "style": "thin", "color": "#000000" } } }
```

A top-level `border.color` and `border.style` are shorthand for "all four edges", and an explicit
edge object overrides the shorthand for that edge. Writers SHOULD emit per-edge objects.

A border belongs to the edge between two cells, so adjacent cells that disagree about their shared
edge are resolved by the renderer (the RECOMMENDED rule is that the later cell in reading order —
right or bottom neighbor — wins). Border color MUST NOT be rendered as an inset outline, box-shadow,
or any other effect that draws inside the cell's content area: printing and export depend on the
border sitting on the cell edge. Unsupported border properties (e.g. `diagonal`) MUST be preserved
when round-tripping.

Style inheritance is not part of Core 1.0. Each resolved style is self-contained, which keeps
implementations simple and makes serialized output predictable.
