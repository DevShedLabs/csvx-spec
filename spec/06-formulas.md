# 6. Formulas

Formulas are UTF-8 strings beginning with `=`. The Core grammar is intentionally small:

```text
formula  = "=" expression
expression = literal | reference | ref-error | function | unary | binary | range | "(" expression ")"
binary   = expression operator expression
operator = "+" | "-" | "*" | "/" | "%" | "=" | "!=" | "<" | "<=" | ">" | ">="
reference = [sheet "!"] cell
cell     = ["$"] column ["$"] row
range    = reference ":" reference
ref-error = "#REF!"

Operators use standard precedence: unary signs, percent, multiplication/division, addition/
subtraction, then comparisons. `!=` is the canonical not-equal operator. Exponentiation is not
part of Core 1.0.
```

References are case-insensitive for matching but MUST retain their original spelling when preserved.
Quoted sheet names use single quotes with doubled single quotes for escaping. Formula parsing MUST
be deterministic and MUST reject trailing tokens, invalid references, and unsupported syntax.

## Absolute markers

A `$` before the column letters, the row number, or both marks that part of a reference as
absolute (`$A$1`, `A$1`, `$A1`). It has no effect on evaluation: `=$A$1` reads the same cell as
`=A1`. It MUST be accepted by the parser and preserved in the stored formula text. Row and column
insertion and deletion treat absolute and relative parts alike (15-edit-operations.md).

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
