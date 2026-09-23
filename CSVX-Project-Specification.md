# CSVX Project Specification

**Status:** Draft.  
**Project:** CSVX  
**Initial Implementation:** Go  
**Architecture:** Specification-first, language-agnostic  
**License:** MIT

---

## 1. Project Overview

CSVX is an open spreadsheet interchange format built around simple, portable, human-readable technologies.

The project extends the strengths of CSV with the capabilities expected from modern spreadsheets while avoiding dependence on a specific application, programming language, or proprietary workbook implementation.

At its core:

> **CSV stores tabular data. Structured metadata defines spreadsheet behavior.**

CSVX adds support for concepts such as:

* typed values
* formulas
* calculated values
* multiple sheets
* styles
* number formats
* validation
* workbook metadata
* structured errors
* deterministic calculation

The CSVX project is **specification-first**.

The format is defined independently of any implementation.

Go will provide the first engine and reference implementation, but Go does not define CSVX behavior. Any conforming implementation in Rust, Python, TypeScript, Java, C#, PHP, or another language should be capable of reading, writing, calculating, and validating the same CSVX documents.

---

# 2. Project Goals

CSVX should provide:

1. An open spreadsheet document specification.
2. A human-readable and developer-friendly workbook format.
3. Deterministic behavior across implementations.
4. Reliable round-trip preservation.
5. A portable alternative to application-specific spreadsheet formats.
6. Import/export interoperability with CSV and Microsoft-style XLSX workbooks.
7. A formal conformance suite for independent implementations.
8. A reusable spreadsheet engine that is independent of any user interface.
9. A format that works equally well for desktop applications, web applications, CLI tools, APIs, data pipelines, and developer tooling.

CSVX should be simple enough that developers can understand the format without needing a specialized SDK.

---

# 3. Architecture Principle

The CSVX specification is the authority.

Implementations conform to the specification.

```text
                   CSVX Specification
                          │
                          │ defines
                          ▼
                 Conformance Suite
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
       Go Engine      Rust Engine     Python Engine
          │
          ├── CLI
          ├── Coder
          ├── Web UI
          ├── API
          └── other applications
```

No implementation-specific behavior should become part of CSVX merely because the reference engine implements it.

If implementation behavior and the specification disagree, the specification wins.

---

# 4. Project Components

CSVX should be treated as several related but independently useful projects.

## 4.1 CSVX Specification

The normative definition of:

* package structure
* workbook model
* sheet model
* cell model
* data types
* formulas
* functions
* calculation semantics
* errors
* styles
* validation
* serialization
* compatibility
* security requirements
* conformance requirements

The specification MUST NOT depend on Go or any other implementation language.

---

## 4.2 Schemas

Machine-readable schemas define structural requirements where appropriate.

Example:

```text
schemas/
├── manifest.schema.json
├── workbook.schema.json
├── styles.schema.json
└── formulas.schema.json
```

Schemas supplement the written specification.

They do not replace semantic requirements that cannot reasonably be expressed through schema validation.

---

## 4.3 Conformance Suite

CSVX will provide an executable, implementation-independent conformance suite.

The suite determines whether an engine behaves according to the specification.

It should contain:

```text
conformance/
├── fixtures/
│   ├── valid/
│   ├── invalid/
│   ├── formulas/
│   ├── calculation/
│   └── round-trip/
│
├── expected/
└── runner/
```

Test cases should include both valid and intentionally invalid `.csvx` packages.

---

## 4.4 Reference Engine

The first CSVX engine will be implemented in Go.

Its responsibilities include:

* package reading
* package writing
* workbook parsing
* workbook serialization
* formula parsing
* formula evaluation
* dependency resolution
* calculation
* validation
* CSV import/export
* CSVX import/export
* XLSX import/export

The Go engine is the reference implementation but is **not the specification**.

---

# 5. Language Independence

CSVX MUST NOT expose implementation-specific concepts in the file format.

For example, the specification should define:

```text
decimal
boolean
string
date
datetime
error
```

rather than:

```text
float64
bool
Go time.Time
Python Decimal
JavaScript Number
```

Each engine maps CSVX types to appropriate native types.

Example:

```text
CSVX                  Go             Rust            TypeScript
──────────────────────────────────────────────────────────────
string                string         String          string
boolean               bool           bool            boolean
integer               int64          i64             bigint
decimal               decimal impl   Decimal         decimal impl
```

Native representation is an implementation decision.

Serialized behavior is governed by the CSVX specification.

---

# 6. Package Model

A `.csvx` document is a package containing spreadsheet data and metadata.

The initial package format uses ZIP.

Example:

```text
report.csvx
│
├── manifest.json
├── workbook.json
│
├── sheets/
│   ├── sales.csv
│   └── customers.csv
│
├── styles.json
└── formulas.json
```

The specification defines:

* required files
* optional files
* paths
* encoding
* serialization rules
* unknown-member behavior
* duplicate-member behavior
* malformed-package behavior
* version handling

Implementations MUST preserve compatible information they do not actively use when round-trip preservation is required by the specification.

---

# 7. Canonical Workbook Model

Every implementation should expose or internally represent the same conceptual workbook model.

```text
Workbook
├── Metadata
├── Sheets[]
│   ├── Sheet
│   ├── Columns
│   └── Cells
├── Styles
├── Formulas
├── Named References
└── Calculation State
```

The specification defines the semantics of these objects rather than their programming-language representation.

---

# 8. Sparse Cell Model

CSVX must support sparse workbooks efficiently.

An implementation MUST NOT require allocation of every possible cell between the first and last used coordinates.

Conceptually:

```text
A1 = "Product"
B1 = "Quantity"
D1 = "Total"

A2 = "Widget"
B2 = 10
D2 = 45.00
```

The absence of `C2` must have explicitly defined semantics.

The specification must distinguish where necessary between:

* absent cells
* blank cells
* empty strings
* zero
* null-like values

This distinction must behave consistently across implementations.

---

# 9. Typed Values

CSVX adds explicit typing to otherwise ambiguous CSV data.

Initial core types should include:

```text
string
integer
decimal
boolean
date
datetime
time
error
```

The specification defines:

* serialized representation
* parsing
* coercion
* comparison
* formula behavior
* invalid values

Implementations MUST NOT rely solely on heuristic type inference when explicit type metadata exists.

---

# 10. Formula Language

CSVX defines its own portable formula grammar.

The formula language belongs to the CSVX specification rather than to the Go engine.

Initial grammar should support:

### Literals

```text
42
3.14
"hello"
TRUE
FALSE
```

### Cell References

```text
A1
B27
```

### Ranges

```text
A1:A10
B2:D20
```

### Arithmetic

```text
+
-
*
/
%
```

Exponentiation is not part of Core 1.0.

### Comparison

```text
=
!=
<
>
<=
>=
```

`!=` is the canonical not-equal operator. Operators use standard spreadsheet precedence.

### Functions

CSVX Core initially includes:

```text
SUM
COUNT
IF
ROUND
ABS
```

Additional functions can be introduced through later specification versions.

---

# 11. Formula Semantics

Syntax alone is insufficient for cross-language compatibility.

The specification MUST define deterministic semantics for:

* numeric coercion
* string coercion
* blank cells
* empty strings
* booleans
* range evaluation
* comparison
* rounding
* function arguments
* invalid references
* dependency evaluation
* error propagation

Given the same valid workbook, conforming engines should produce equivalent results.

---

# 12. Calculation Engine

CSVX calculations are deterministic.

The engine must construct dependencies between calculated cells.

Example:

```text
A1 = 10
B1 = 20

C1 = A1 + B1
D1 = C1 * 2
```

Dependency graph:

```text
A1 ─┐
    ├── C1 ─── D1
B1 ─┘
```

Changing `A1` invalidates:

```text
C1
D1
```

but unrelated calculations remain valid.

---

# 13. Cached Values

Formula cells may contain cached results.

Example conceptually:

```text
formula: =A1+B1
cached: 30
```

Cached values allow consumers that do not implement calculation to access the last calculated value.

The specification must define when cached values are:

* valid
* stale
* missing
* invalidated

A conforming calculation engine MUST NOT silently treat a known stale cache as authoritative.

---

# 14. Calculation Errors

CSVX defines portable calculation errors.

Initial errors:

```text
CYCLE
DIV0
VALUE
REF
NAME
```

Conceptually:

```text
#CYCLE!
#DIV0!
#VALUE!
#REF!
#NAME!
```

The exact serialized representation is defined by the specification.

Engines must produce equivalent error categories for equivalent conditions.

---

# 15. Round-Trip Preservation

Round-trip preservation is a core CSVX requirement.

Given:

```text
read → modify → write
```

an implementation should preserve document information unrelated to the modification.

For example, an engine that understands formulas but does not render styles should not discard valid style metadata simply because it does not use it.

The specification will explicitly define:

* required preservation
* optional preservation
* unknown metadata handling
* extension handling

This enables specialized CSVX implementations without unnecessary data loss.

---

# 16. Import and Export Architecture

Import/export is an engine capability rather than part of the core workbook representation.

```text
                  ┌─────────────┐
 XLSX ───────────►│             │──────────► XLSX
                  │             │
 CSV ────────────►│  Workbook   │──────────► CSV
                  │     IR      │
 CSVX ───────────►│             │──────────► CSVX
                  │             │
                  └─────────────┘
```

Converters should translate external formats into the canonical CSVX workbook model.

Exporters translate the workbook model into the destination format.

This prevents format-to-format conversion logic from becoming tightly coupled.

---

# 17. Microsoft Spreadsheet Interoperability

The reference engine should support XLSX import and export.

Import:

```text
XLSX
 ↓
XLSX parser
 ↓
CSVX workbook model
 ↓
CSVX package
```

Export:

```text
CSVX package
 ↓
CSVX workbook model
 ↓
XLSX serializer
 ↓
XLSX
```

Perfect XLSX feature parity is not a requirement.

Unsupported Microsoft-specific features must have documented behavior and must never silently change spreadsheet meaning where that can reasonably be detected.

---

# 18. Engine Boundary

The CSVX engine contains no user interface.

It should not know about:

* Coder
* Electron
* React
* browsers
* toolbars
* formula bars
* menus
* dialogs
* themes

Its responsibility ends at spreadsheet behavior and document transformation.

---

# 19. Go Reference Engine

The initial engine will be written in Go.

Potential package architecture:

```text
csvx-go/
├── cmd/
│   └── csvx/
│
├── package/
├── workbook/
├── formula/
├── calculation/
├── validation/
├── import/
├── export/
└── conformance/
```

The internal Go architecture may evolve independently as long as observable behavior remains conformant with the specification.

---

# 20. CLI

The Go reference implementation should expose a CLI useful for development, automation, and conformance testing.

Potential interface:

```bash
csvx inspect report.csvx

csvx validate report.csvx

csvx recalc report.csvx

csvx convert report.xlsx report.csvx

csvx convert report.csvx report.xlsx

csvx convert report.csvx report.csv
```

The CLI is a consumer of the engine, not part of the CSVX specification.

---

# 21. Coder Integration

Coder will be an early consumer of the CSVX engine.

Existing CSV functionality provides the foundation for spreadsheet presentation.

### CSV

Coder continues to provide normal tabular editing.

### CSVX

Coder may additionally expose:

* formula bar
* formatting controls
* formulas
* calculated columns
* typed values
* number formats
* multiple sheets
* validation
* spreadsheet-specific commands

Coder-specific behavior MUST NOT leak into the CSVX specification.

The relationship should remain:

```text
CSVX Specification
        ↓
CSVX Engine
        ↓
Coder CSVX UI
```

---

# 22. Other Consumers

Because the engine is UI-independent, CSVX can support:

```text
CSVX Engine
├── Coder
├── CLI
├── Web UI
├── Electron applications
├── server APIs
├── conversion services
├── data pipelines
└── third-party applications
```

Other language implementations may provide equivalent capabilities without using the Go engine.

---

# 23. Conformance

An implementation should be considered CSVX-conformant based on observable behavior rather than implementation architecture.

The conformance suite should verify:

* package parsing
* manifest validation
* workbook loading
* typed values
* sparse cells
* formulas
* calculation
* error behavior
* cache invalidation
* round-trip preservation
* invalid package handling

Conformance tests should be portable enough to execute against implementations written in different languages.

---

# 24. Specification Keywords

Normative specification documents should use consistent requirement terminology:

**MUST**
Required for conformance.

**MUST NOT**
Prohibited for conforming implementations.

**SHOULD**
Recommended unless an implementation has a documented reason otherwise.

**SHOULD NOT**
Generally discouraged.

**MAY**
Optional.

These terms should describe externally observable behavior rather than internal implementation architecture whenever possible.

---

# 25. Development Plan

Development should proceed from the format outward rather than from the UI inward.

## Phase 1 — Package and Data Model

Define and implement:

* ZIP reader/writer
* manifest loading
* workbook loading
* sheet loading
* typed values
* sparse cells
* round-trip preservation

Primary objective:

> A CSVX document can be reliably opened, represented, modified, and written without losing unrelated information.

---

## Phase 2 — Formula MVP

Define and implement:

* literals
* cell references
* ranges
* arithmetic
* comparisons
* `SUM`
* `COUNT`
* `IF`
* `ROUND`
* `ABS`

Primary objective:

> Formula parsing and evaluation produce deterministic results defined by the specification.

---

## Phase 3 — Calculation

Define and implement:

* dependency graph
* deterministic evaluation
* stale cache invalidation
* calculation ordering
* error propagation
* `CYCLE`
* `DIV0`
* `VALUE`
* `REF`
* `NAME`

Primary objective:

> Workbook recalculation behaves identically across conforming implementations.

---

## Phase 4 — Conformance

Build:

* executable test runner
* schema validation
* real `.csvx` fixtures
* valid package tests
* invalid package tests
* formula tests
* calculation tests
* round-trip tests

Primary objective:

> An independent implementation can prove compatibility without depending on the Go engine.

---

# 26. Development Rule

Each implementation phase follows:

```text
Specify
   ↓
Create fixtures/tests
   ↓
Implement
   ↓
Run conformance tests
   ↓
Refine specification where ambiguity is discovered
```

Implementation should expose ambiguities in the specification, not silently establish undocumented behavior.

---

# 27. Future Implementations

Once CSVX Core and the Go engine stabilize, independent engines may be developed:

```text
csvx-go
csvx-rs
csvx-py
csvx-ts
```

They should share:

* specification
* schemas
* fixtures
* expected results
* conformance tests

They should not need to reproduce the internal architecture of `csvx-go`.

---

# 28. Repository Direction

A clean long-term project organization could be:

```text
csvx-spec
├── spec/
├── schemas/
├── fixtures/
├── conformance/
└── examples/

csvx-go
├── engine/
├── import/
├── export/
└── cmd/

csvx-rs
csvx-py
csvx-ts
```

The specification repository remains the canonical definition of CSVX.

---

# 29. Core Project Principle

CSVX is not a Go spreadsheet format.

CSVX is not a Coder document format.

CSVX is not an XLSX wrapper.

CSVX is an open, implementation-independent spreadsheet interchange format.

The specification defines the format.

The conformance suite defines measurable compatibility.

The Go engine provides the first production implementation.

Coder provides the first full editor experience.

Other languages and applications should be able to implement CSVX without depending on either Go or Coder.
