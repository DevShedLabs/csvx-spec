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

## Fonts

`font` is an object with these keys, all optional:

| Key | Value | Default | Meaning |
| --- | --- | --- | --- |
| `name` | string | renderer's | Font family name. |
| `size` | number > 0 | `11` | Font size in points, XLSX's own unit. A JSON number, never a string (`11`, `10.5`). |
| `bold` | boolean | `false` | Bold weight. |
| `italic` | boolean | `false` | Italic. |
| `underline` | boolean | `false` | Underline. |
| `color` | string | renderer's | A CSS hex color (`#RRGGBB`). |

An absent key takes its default, so a writer may omit a key that equals it. A pixel-based
renderer converts a size with `pixels = points * 4/3`, as for row heights (03-sheets.md). Unknown
keys in `font` MUST be preserved (above).

A font size does not change a row's height. A row's height is its `rowHeights` entry, or 15 points
when it has none (03-sheets.md), and that stored height is what printing and export use. Whether an
editor grows a row to fit a larger font is its own behavior; an editor that does so SHOULD write the
resulting height to `rowHeights` so the file, not the editor, holds it.

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
