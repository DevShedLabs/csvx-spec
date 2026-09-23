# CSVX Core 1.0 Specification

CSVX is a ZIP-based, open spreadsheet format designed for predictable developer access.
This directory contains the normative specification. The Go engine is an implementation,
not the authority.

## Status

This is a working draft. Normative terms **MUST**, **MUST NOT**, **SHOULD**, **SHOULD NOT**,
and **MAY** have their usual RFC 2119 meaning.

## Core principles

- Text is UTF-8 and JSON is RFC 8259 JSON.
- Files are deterministic: ordering, IDs, and calculation results are reproducible.
- Unknown extension fields MUST be preserved when possible and ignored when unsupported.
- A conforming reader MUST NOT execute formulas, links, macros, or embedded code while loading.
- Values and formulas are separate; cached values are never the source of truth.

## Document map

1. [Container](01-container.md)
2. [Workbook](02-workbook.md)
3. [Sheets](03-sheets.md)
4. [Data types](04-data-types.md)
5. [Cell values](05-cell-values.md)
6. [Formulas](06-formulas.md)
7. [Functions](07-functions.md)
8. [Styles](08-styles.md)
9. [Validation](09-validation.md)
10. [Calculation](10-calculation.md)
11. [Import and export](11-import-export.md)
12. [Security](12-security.md)
13. [Conformance](13-conformance.md)

Core 1.0 intentionally excludes charts, pivot tables, images, comments, macros, and external
references. These belong in separately versioned extensions.
