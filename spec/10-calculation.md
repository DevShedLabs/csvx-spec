# 10. Calculation

Calculation builds a dependency graph from formula references and evaluates cells in deterministic
topological order. The graph has an edge for every cell a formula reads: each cell inside a
range, and cells on other sheets (`Sheet!A1`), so a reference to another sheet's formula cell sees
its calculated value and a cycle that crosses sheets is `CYCLE` like any other. A name contributes the edges of the references in its `refersTo`. A reference to a
sheet that does not exist is `REF` (06-formulas.md, Sheet references). Independent cells MUST produce the same results regardless of worker scheduling.

Arithmetic uses decimal semantics. Division by zero returns `DIV0`; invalid operands return
`VALUE`; missing references return `REF`. Errors propagate through operators and functions unless a
function explicitly defines otherwise.

A calculation result includes a status (`clean`, `changed`, or `error`) and updated cached values.
A formula cell's calculated value is written to its CSV field in its literal form (04-data-types.md),
so `true` and `false` are lower case and an error is `#` and its code.
Implementations MUST invalidate stale caches when dependencies change, on any sheet: a change to a
cell recalculates every formula cell that depends on it directly or through other formulas, in
every sheet of the workbook, not only the sheet that was edited. Implementations SHOULD expose the
calculation timestamp separately from workbook content.
