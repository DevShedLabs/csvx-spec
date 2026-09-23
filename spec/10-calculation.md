# 10. Calculation

Calculation builds a dependency graph from formula references and evaluates cells in deterministic
topological order. Independent cells MUST produce the same results regardless of worker scheduling.

Arithmetic uses decimal semantics. Division by zero returns `DIV0`; invalid operands return
`VALUE`; missing references return `REF`. Errors propagate through operators and functions unless a
function explicitly defines otherwise.

A calculation result includes a status (`clean`, `changed`, or `error`) and updated cached values.
Implementations MUST invalidate stale caches when dependencies change and SHOULD expose the
calculation timestamp separately from workbook content.
