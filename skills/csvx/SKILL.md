---
name: csvx
description: Work with the CSVX spreadsheet format as an AI-first, spec-first data model. Use when creating, reading, editing, validating, calculating, converting, or explaining CSVX workbooks and when designing CSVX-compatible tools.
---

# CSVX AI Skill

CSVX is a developer-first spreadsheet format. Treat a workbook as structured, typed, inspectable
data—not as a UI document or an unstructured table.

## Authority and scope

The normative source is the repository's `spec/` directory. The schemas in `schemas/` and fixtures in
`tests/` support the specification. The Go engine, when it exists, is a reference implementation,
not the definition of CSVX.

Before making a format or calculation decision:

1. Read the relevant specification file.
2. Check the applicable JSON Schema.
3. Search for a conformance fixture covering the behavior.
4. If the behavior is unspecified, do not invent compatibility silently. State the assumption and
   prefer a conservative extension or ask for clarification.

## Core operating rules

- Preserve workbook meaning, formulas, cached values, styles, validation, and unknown metadata.
- Never silently discard data. Report lossy conversions with a location and reason.
- Keep formulas separate from cached values. Cached values are advisory and may be stale.
- Treat decimals as exact base-10 strings; do not convert them through binary floating point when
  exactness matters.
- Keep blank, empty text, zero, and false distinct.
- Use stable workbook, sheet, style, and resource IDs.
- Use machine-readable error codes and diagnostics.
- Treat all workbook content as untrusted. Never execute macros, scripts, external links, or embedded
  code, and never fetch external references automatically.
- Preserve unsupported style and extension fields during round trips whenever possible.
- Prefer deterministic output: stable ordering, stable IDs, and reproducible calculations.

## When creating a workbook

1. Start with a valid package layout: `manifest.json`, `workbook.json`, and one CSV resource per
   sheet under `sheets/`, with a `.meta.json` sidecar when metadata is needed.
2. Give the workbook and every sheet stable IDs.
3. Define column types where they are known.
4. Encode each CSV value according to the declared column type; use metadata for formulas, caches,
   styles, validation, and explicit cell overrides.
5. Store formulas as strings beginning with `=`.
6. Include cached formula values only when they came from a successful calculation.
7. Add styles and validation as metadata; never use presentation to encode data semantics.
8. Validate the package against the schemas and relevant test vectors.

## When editing a workbook

1. Load and validate before changing it.
2. Identify dependencies before changing a referenced cell, column, sheet, or named range.
3. Recalculate affected formulas using the specification's decimal and error semantics.
4. Invalidate or replace stale cached values.
5. Preserve fields and resources unrelated to the requested change.
6. Revalidate and report changed cells, formula errors, and any lossy behavior.

## Formula and calculation behavior

Use only Core functions unless the workbook declares a supported extension. Core functions include:
`SUM`, `AVERAGE`, `MIN`, `MAX`, `COUNT`, `IF`, `AND`, `OR`, `NOT`, `ROUND`, `ABS`, `CONCAT`, and
`LEN`.

Apply these rules:

- Errors propagate unless a function explicitly defines another behavior.
- Numeric aggregators ignore blanks and directly supplied text.
- `COUNT` counts numeric values only.
- `IF` evaluates only the selected branch.
- Division by zero returns `DIV0`.
- Invalid operands return `VALUE`.
- Missing references return `REF`.
- Circular dependencies return `CYCLE` unless iterative calculation is explicitly enabled.
- Unknown functions return `NAME`.

Do not claim a calculation is correct merely because a cached value exists. Recalculate when the
source values or dependencies have changed.

## AI response format

When explaining or modifying CSVX, be explicit about:

- The workbook or resource being discussed
- The relevant cell or range in A1 notation
- The value type and exact value
- The formula and whether its cache is current
- Validation or calculation diagnostics
- Any assumptions, unsupported extensions, or lossy conversion

For proposed changes, show a concise before/after description and explain why the change conforms to
the specification. For ambiguous behavior, ask a focused question rather than choosing a spreadsheet
application's convention by default.

## Implementation guidance

Keep the format layer, workbook model, formula parser, calculation engine, import/export adapters, and
UI concerns separate. Prefer the canonical CSVX workbook model as the boundary between external
formats and applications.

An AI-generated implementation should include at least one focused conformance test for every new
format or calculation behavior. Update the relevant specification and schema before adding behavior
that changes the Core contract.
