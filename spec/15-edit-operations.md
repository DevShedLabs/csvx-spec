# 15. Edit operations

An engine that edits a workbook MUST implement the operations in this chapter exactly as written,
so that the same edit produces the same package in every engine and app. A consumer app MUST call
the engine for them and MUST NOT carry its own copy (AGENTS.md §5).

Coordinates are A1 coordinates as defined in 03-sheets.md: row 1 is the header row, data records
begin at row 2, and the Nth line of the CSV is row N. Operation arguments use these 1-based row
numbers and these column letters. An operation that is invalid (below) MUST fail without changing
the workbook.

Operations change the workbook model only. After any operation that changes a cell's content or a
formula, the engine recalculates as 10-calculation.md requires; the vectors in `tests/edit/` compare
the model before that recalculation (formulas, metadata, records), not cached values.

## Inserting and deleting rows

`insert-rows(sheet, at, count)` inserts `count` (≥ 1) blank rows before row `at`; rows `at` and
below move down by `count`. `at` MUST be ≥ 2, so the header row is never displaced; `at` one past
the last row appends.

`delete-rows(sheet, rows)` deletes the given set of rows (duplicates ignored); every row MUST be
≥ 2 and exist. Rows below a deleted row move up by the number of deleted rows above them. The
header row can never be deleted.

A new row is blank: every field is empty and it carries no cell metadata. In the same operation:

- **Cell metadata** (`cells`) follows its row to the new row number. Metadata on a deleted row is
  discarded.
- **`rowHeights`** entries follow their rows in the same way, and are discarded with a deleted row.
- **Formulas and ranges** in the workbook are rewritten as in "Reference rewriting" below.
- **Print settings** are rewritten as in "Print settings" below.

## Inserting and deleting columns

`insert-columns(sheet, at, count)` inserts `count` (≥ 1) columns before column `at` (a letter);
columns `at` and to its right move right. `at` one past the last column appends.
`delete-columns(sheet, columns)` deletes the given set of columns; a sheet MUST keep at least one
column.

Each remaining column's `id` is reassigned to its new position's letter, in order (11-import-export.md
fixes `id` to the letter). The rest of a column object (`name`, `type`, `width`, unknown fields)
travels with the column. Every record, and the header row, gains or loses the matching fields.

An inserted column has the empty name, no `type`, and empty fields: an engine invents no placeholder
text for the user to filter out (03-sheets.md).

Cell metadata (including row-1 header metadata) follows its column and is discarded with a deleted
column. Formulas and print settings are rewritten as below.

## Reference rewriting

When rows or columns of sheet S change, every reference that targets S is rewritten in:

- every cell formula of every sheet;
- every `refersTo` of `namedRanges` (02-workbook.md); every reference in one is sheet-qualified, so
  none is unqualified;
- the `formula1` and `formula2` of every cell `validation` rule (09-validation.md) whose value
  begins with `=`. A value that does not begin with `=` (a literal, a comma-separated list) is not
  a formula and is left alone. An unqualified reference in one targets the sheet the cell is on.

A reference targets S if it is qualified with S's name, or is unqualified and sits on S. `$` anchors are preserved:
inserting and deleting treat absolute and relative references alike. Spelling, case and quoting of
untouched parts are preserved. Rewriting acts on the parsed formula; text in string literals is
never touched. References to row 1 are never affected by a row operation.

Let *map* send an index to its new index, or to *deleted*:

- **Single cell.** Apply *map* to the row (for a row operation) or column (for a column
  operation). If it is *deleted*, the whole reference, including its sheet qualifier, is replaced
  by `#REF!` (06-formulas.md).
- **Range `a:b`.** Insert: *map* is applied to each end independently, so an insertion strictly
  inside the range grows it, an insertion at its first row or column moves the whole range, and an
  insertion after its last row or column leaves it unchanged. Delete: if every row or column of
  the range is deleted, the whole range becomes `#REF!`. Otherwise the range shrinks to the
  surviving rows or columns: its new start is the first surviving index at or after `a`, its new
  end the last surviving index at or before `b`, each passed through *map*.

A formula that contains `#REF!` after rewriting stays valid and evaluates to the `REF` error.
A formula's own cell moving does not change what it references.

## Print settings

For the target sheet's `print` object: `area`, `repeatRows` and `repeatColumns` are rewritten as
ranges (a setting whose range is entirely deleted is removed); `rowBreaks` and `columnBreaks`
numbers follow their row or column, and a break on a deleted row or column is removed. Unknown
properties are preserved untouched.

## Sheets

`add-sheet` appends a sheet with a workbook-unique `id` and name, and the metadata sidecar and CSV
that go with it. A new sheet has one column with the empty name (id `A`) and no data rows: its CSV is the
single header line, `""`. Editors display the default grid of 03-sheets.md around it; nothing is padded
into the file.

`rename-sheet(sheet, name)` changes the sheet's `name` only. The name MUST satisfy 03-sheets.md and
be unique in the workbook, otherwise the operation is invalid. The `id` and `path` do not change.
Every sheet-qualified reference to the sheet in the places listed under "Reference rewriting" is
rewritten to the new name, quoted as 06-formulas.md requires for the new name.

`delete-sheet(sheet)` removes the sheet and its resources. A workbook MUST keep at least one sheet.
Every reference qualified with the deleted sheet's name, in the same places, is replaced by `#REF!`.

## Setting cells

`set-cell(sheet, coordinate, text)` replaces a cell's content with what the user typed.

- **Header row** (row 1): the text becomes the column's `name`, which MAY be empty (03-sheets.md).
  Header style metadata is kept; a stale `formula`, `type` or `cached` on the header cell is dropped
  as for any content edit.
- **Formula** (text beginning with `=`): the cell's metadata `formula` is set to the text, and any
  `type` and `cached` describing the old content are dropped. The cell's CSV field is left empty;
  the formula text never goes into the CSV. Recalculation then sets `cached`, and MAY write the
  cache's text into the CSV field, which 03-sheets.md allows as a formula cache.
- **Literal** (anything else): the CSV field becomes the text, and `formula`, `type` and `cached`
  are dropped (05-cell-values.md). If the cell has a `numberFormat` (08-styles.md) and, with the
  per-cell `type` now gone, no declared type, a literal that parses as a number against that
  format's own affixes and grouping is stored as the canonical numeric text (`$7.00` → `7.00`).
  Anything else is stored exactly as typed.

`style` and `validation` are never changed by `set-cell`. A metadata entry left empty is removed.
The sheet MUST be recalculated afterwards (10-calculation.md). A coordinate beyond the sheet's
current extent extends the sheet with blank rows, and with columns that have the empty name, as needed.

`paste(sheet, anchor, rows, from?)` applies a rectangular array of texts, the top-left at `anchor`,
as one `set-cell` per element, with one recalculation at the end. It is atomic: if any element
would be invalid, none is applied.

Without `from`, formula text is stored verbatim. With `from`, the coordinate the rows were copied
from (the top-left of the source), every text beginning with `=` is **translated** by the offset
from `from` to `anchor`: each reference's relative column and relative row move by that many
columns and rows, and a part marked absolute with `$` does not move. This applies to every
reference in the formula, whichever sheet it names, and to both ends of a range independently. A
reference that would land above row 1 or left of column A becomes `#REF!` (a range becomes `#REF!`
if either end would). `#REF!`, names, string literals and everything that is not a reference are
unchanged. Texts that are not formulas are stored as typed.

## Styles

`apply-style(sheet, coordinates, patch)` changes the presentation of each listed cell. `patch` may
contain `numberFormat`, `font`, `fill`, `border`, `alignment`, and any other style property.

For each cell the new style is the cell's current style (an empty style if it has none) merged with
the patch:

- `numberFormat`: an absent key keeps the current value, a string sets it, and `null` removes it.
- `font`, `fill`, `border`, `alignment` and other object-valued groups merge one level deep: each
  key in the patch replaces that key in the group and the other keys are kept, so patching
  `border.bottom` replaces the bottom edge object whole and leaves the other edges as they were.
  A key set to `null` is removed.
- Properties the patch does not mention, including ones the engine does not understand, MUST be
  preserved (08-styles.md).

A group left with no keys is dropped. If the result has no properties, the cell's `style` reference is removed (and a metadata entry left empty is removed). Otherwise the engine
reuses an existing style in `styles.json` whose properties, ignoring `id` and key order, equal the
result, and only when none does adds a new style. A new style gets `id` `s<N>`, where N is one more
than the largest N among existing ids of that form, or `0` if there are none. Within one call, ids
are assigned in the order of `coordinates` as given. Existing styles are never modified or removed
by an edit, so a style shared with other cells is never changed under them.

`clear-style(sheet, coordinates)` removes `style` from each listed cell, removing a metadata entry
left empty. It does not change `styles.json`.

## Print settings

`set-print(sheet, patch)` merges `patch` into the sheet's `print` object: each key in the patch
replaces that key, a key set to `null` is removed (so it takes its default, 03-sheets.md), and keys
not mentioned, including unknown ones, are kept. The result MUST conform to the sheet metadata
schema, but the engine does not check that itself: schema validation is the canonical validator's job
(AGENTS.md §3.3), so a saved package with a bad value is rejected there. If `print` ends up empty it is
removed from the sidecar.

## Not yet specified

Nothing in this chapter is deferred.
