# 6. Formulas

Formulas are UTF-8 strings beginning with `=`. The Core grammar is intentionally small:

```text
formula  = "=" expression
expression = literal | reference | ref-error | name | function | unary | binary | range | "(" expression ")"
binary   = expression operator expression
operator = "+" | "-" | "*" | "/" | "%" | "=" | "!=" | "<" | "<=" | ">" | ">="
reference = [sheet "!"] cell
cell     = ["$"] column ["$"] row
range    = [sheet "!"] cell ":" cell | sheet "!" cell ":" sheet "!" cell
sheet    = bare-name | "'" quoted-name "'"
ref-error = "#REF!"
name     = identifier

Operators use standard precedence: unary signs, percent, multiplication/division, addition/
subtraction, then comparisons. `!=` is the canonical not-equal operator. Exponentiation is not
part of Core 1.0.
```

References are case-insensitive for matching but MUST retain their original spelling when preserved.
Formula parsing MUST be deterministic and MUST reject trailing tokens, invalid references, and
unsupported syntax.

## Sheet references

A reference or range reads another sheet when it is qualified with that sheet's name:
`=Sales!B2`, `=SUM('Q1 Totals'!B2:B10)`. A formula MAY mix any number of sheets, its own included:
`=SUM(Q1!B2:B10)+SUM(Q2!B2:B10)-Adjust!A1`. A qualifier is the sheet's `name` (02-workbook.md),
never its `id` or `path`.

- **Resolution.** The qualifier is matched against the workbook's sheet names ignoring ASCII case.
  Sheet names are unique under that comparison, so at most one sheet matches. A qualifier that
  matches no sheet is not a parse error: the reference evaluates to `REF`, as does a range
  qualified with it. Qualifying a reference with the formula's own sheet is the same as leaving it
  unqualified.
- **Quoting.** A quoted qualifier is delimited by single quotes, with a single quote inside the
  name written as two (`'Bob''s Data'!A1`). A bare qualifier is an ASCII letter or `_` followed by
  ASCII letters, digits and `_`. A parser MUST accept a quoted qualifier whether or not it needed
  quoting. A writer that composes a qualifier (rename-sheet, 15-edit-operations.md; an importer,
  14-xlsx-interoperability.md) MUST write it bare only when it is a valid bare qualifier, is not
  cell-like (letters followed by digits, such as `Q1` or `FY2026`, optionally with `$`), and is not
  `TRUE` or `FALSE` ignoring case; otherwise it MUST quote it. A qualifier already in a formula
  keeps its spelling until an operation changes it.
- **Ranges.** `Sales!B2:B10` is a range on Sales: the qualifier applies to both ends. Both ends may
  carry it (`Sales!B2:Sales!B10`) when they name the same sheet. A range whose ends name different
  sheets (`Sales!B2:Other!B10`) is a three-dimensional range, which Core 1.0 does not have, and a
  range whose first end is unqualified but whose second is qualified (`B2:Sales!B10`) is
  ambiguous; a parser MUST reject both as invalid syntax. Any function that accepts a range accepts
  a qualified one, and `$` markers behave as on the home sheet.
- **What is read.** A qualified reference reads the cell exactly as that sheet's own formulas
  would: a formula cell yields its calculated value (never a stale `cached` one; 10-calculation.md),
  any other cell its typed value, a coordinate beyond the sheet's extent is blank, and row 1 yields
  the column's header text. Errors in the referenced cell propagate into the formula that reads it.
  Cells on other sheets are read, never changed: a formula has no effect outside its own cell.

## Absolute markers

A `$` before the column letters, the row number, or both marks that part of a reference as
absolute (`$A$1`, `A$1`, `$A1`). It has no effect on evaluation: `=$A$1` reads the same cell as
`=A1`. It MUST be accepted by the parser and preserved in the stored formula text. Row and column
insertion and deletion treat absolute and relative parts alike (15-edit-operations.md).

## Names

An identifier that is not a function call, `TRUE`/`FALSE`, or a cell reference is a **name**
(02-workbook.md, Named ranges). It is syntactically valid whether or not it is declared. Evaluating
it substitutes the name's `refersTo`: a name that refers to a cell reads that cell, a name that
refers to a range may be used wherever a range may (`SUM(Prices)`) and yields its first cell in a
scalar position, and a name that refers to a constant yields that constant. A name that is not
declared evaluates to `NAME`. Matching is case-insensitive. A name whose `refersTo` contains
`#REF!` evaluates to `REF`.

## Reference errors

`#REF!` is the reference-error token. It is a valid expression wherever a reference is, and may
stand in for a whole reference or range (`=A3*#REF!`, `=SUM(#REF!)`). It is the spelling an
engine writes into a formula when an edit destroys the cell a reference pointed to — for example
deleting a row or column that the reference named — and the engine MUST preserve it in the stored
formula text. The token is case-insensitive when parsed.

Evaluating `#REF!` yields the error value `{"type":"error","code":"REF"}`, which propagates under
the normal error rules (10-calculation.md). A formula containing `#REF!` is syntactically valid:
a parser MUST NOT report `NAME` or any other parse error for it. A `#REF!` combined with a range
operator (`A1:#REF!`) is not valid.

Core evaluation uses decimal arithmetic, explicit error values, and no implicit network or file
access. Circular dependencies produce `CYCLE` unless iterative calculation is explicitly enabled.
