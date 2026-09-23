# 13. Conformance

A Core 1.0 implementation is conforming when it:

1. Reads and validates every required package resource.
2. Preserves unknown fields and unsupported presentation metadata when saving.
3. Implements the Core types, formula grammar, functions, and error behavior.
4. Produces the expected results for the published test vectors.
5. Rejects the invalid package and formula cases in the invalid fixtures.
6. Does not perform prohibited external or executable behavior.

The conformance suite uses JSON test vectors with `input`, `expected`, and optional `diagnostics`.
Test comparisons MUST be semantic for JSON object key ordering and exact for decimal strings,
error codes, formulas, and coordinates.

A test runner SHOULD report implementation name, version, supported extensions, and each vector ID.
Passing parsing tests alone is not conformance.
