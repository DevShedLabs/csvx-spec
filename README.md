# CSVX

CSVX is an open spreadsheet file format and calculation model designed for developer accessibility.
It is intended to be easy to inspect, generate, validate, transform, and implement without relying
on a particular spreadsheet application or user interface.

CSVX treats spreadsheets as structured data rather than opaque application documents. A workbook
has explicit types, formulas, cached calculation results, styles, validation metadata, and stable
identifiers. The format is designed for source control, automation, data pipelines, and independent
implementations.

## Project principles

### The specification is the authority

The CSVX specification defines what a `.csvx` file means. Implementations must conform to the
specification; the behavior of one implementation must not silently become the format definition.

The specification defines:

- The ZIP-based file and resource structure
- The workbook, sheet, column, row, and cell model
- Explicit scalar and error types
- Formula syntax, functions, and calculation semantics
- Styles, number formats, and validation metadata
- Import/export expectations
- Security and compatibility requirements
- Conformance tests and interoperability rules

### Developer-first access

CSVX is designed to work well with tools and code. A developer should be able to inspect a workbook,
understand its values, change it safely, and validate the result without opening a desktop spreadsheet
application.

The format therefore favors:

- UTF-8 JSON resources
- Stable IDs and deterministic behavior
- Explicit types instead of language-specific coercion
- Separate formulas and cached values
- Sparse sheets that do not require storing empty cells
- Machine-readable errors and diagnostics
- Preservation of fields and metadata an implementation does not understand

### One workbook model, many implementations

CSVX defines a canonical workbook model that can be implemented in Go, Rust, Python, TypeScript,
or other languages. Importers and exporters should translate external formats through that model:

```text
XLSX ─────┐
CSV ──────┼──► CSVX workbook model ───┬──► CSVX
JSON ─────┘                           ├──► XLSX
                                      ├──► CSV
                                      └──► JSON
```

The model is independent of any UI. An editor, CLI, service, or library may present it differently,
but calculation and file semantics remain consistent.

## Core 1.0 scope

CSVX Core 1.0 focuses on the capabilities required for a useful, portable spreadsheet:

- ZIP package container
- Multiple sheets
- Typed columns and cells
- Formulas and core functions
- Deterministic recalculation
- Cached calculated values
- Styles and number formatting
- Cell validation metadata
- Safe import and export behavior
- Conformance fixtures

Charts, pivot tables, images, comments, macros, external references, and other application-specific
features are intentionally outside Core 1.0. They may be defined later as versioned extensions.

## Compatibility

CSVX uses the following requirement levels:

```text
MUST       Required for conformance
MUST NOT   Prohibited for conformance
SHOULD     Recommended unless there is a documented reason not to
SHOULD NOT Recommended against unless there is a documented reason
MAY        Optional capability
```

An implementation that does not render styles, for example, may still be conforming if it preserves
styles during load and save. Unsupported metadata must not be discarded merely because the current
implementation does not use it.

## Repository structure

```text
spec/       Normative format and behavior definitions
schemas/    JSON Schemas for package resources
examples/   Small, reviewable workbook fixtures
 tests/     Cross-implementation conformance vectors
```

The examples are stored unpacked so their contents can be reviewed in source control. A `.csvx`
file is the ZIP package assembled from those resources according to the container specification.

## Reference engine

The planned Go engine will provide the first complete implementation of CSVX, including parsing,
validation, formula evaluation, recalculation, and import/export. It is a reference implementation,
not the authority for the format.

The engine should remain independent of any editor or product UI. This allows CSVX to support a CLI,
Coder integration, browser/WASM tooling, data pipelines, and other applications without coupling the
format to one consumer.

## Project direction

CSVX is being developed spec-first:

```text
CSVX specification
        │
        ▼
Conformance test suite
        │
        ├── Go engine
        ├── Rust implementation
        ├── Python implementation
        └── TypeScript implementation
```

The goal is interoperability: different implementations should load, calculate, modify, and save the
same workbook with predictable results.
