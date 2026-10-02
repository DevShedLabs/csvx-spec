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

## Text case

An editor that offers case conversion MUST use these rules, so every engine and app agrees on the
result. A conversion has a **mode**: `upper`, `lower`, or `title`, and applies to one cell's text
(the CSV field, or the column name for a header cell). A header cell's text is a column name, so
it always resolves to `string`: its column's declared type describes the data below it and never
makes the header ineligible (the conversion input is marked `header`).

A cell is **eligible** only if it has no `formula` and its resolved value is `string` (a declared
`string` type, or no declared type and the text matches no other literal form — see
`04-data-types.md`). Formula cells and cells resolving to any other type, including `blank`, MUST be
left exactly as they are: `true`, `2026-09-22`, and `19.95` are not changed. Ineligible cells are
skipped, not errors. Style, validation, and every other metadata field are untouched; the
conversion changes text only.

Case mapping is per code point, using the Unicode default (locale-independent) mapping. A code
point whose mapping is not exactly one code point (`ß` → `SS`, `İ` → `i̇`) MUST be left unchanged,
which keeps the result identical in every implementation. Final-sigma and other context-sensitive
rules are not applied: `Σ` lowercases to `σ`.

- `upper` maps every code point to uppercase; `lower` maps every code point to lowercase.
- `title` lowercases the text, then uppercases the first code point of each word. A **word** is a
  maximal run of Unicode letters (`L`), numbers (`N`), and marks (`M`), in which an apostrophe
  (`'` or `’`) that is directly between two letters is part of the word. Every other character
  separates words and is unchanged. A word whose first character is not a letter (`3rd`) keeps it.
  `mary-jane O'NEIL` → `Mary-Jane O'neil`; `don't` → `Don't`.
