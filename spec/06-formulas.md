# 6. Formulas

Formulas are UTF-8 strings beginning with `=`. The Core grammar is intentionally small:

```text
formula  = "=" expression
expression = literal | reference | function | unary | binary | range | "(" expression ")"
binary   = expression operator expression
operator = "+" | "-" | "*" | "/" | "^" | "=" | "<>" | "<" | "<=" | ">" | ">="
reference = [sheet "!"] cell
range    = reference ":" reference
```

References are case-insensitive for matching but MUST retain their original spelling when preserved.
Quoted sheet names use single quotes with doubled single quotes for escaping. Formula parsing MUST
be deterministic and MUST reject trailing tokens, invalid references, and unsupported syntax.

Core evaluation uses decimal arithmetic, explicit error values, and no implicit network or file
access. Circular dependencies produce `CYCLE` unless iterative calculation is explicitly enabled.
