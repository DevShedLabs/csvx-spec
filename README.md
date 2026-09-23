# CSVX Spec

**Spec first, reference implementation second.** That keeps CSVX from accidentally becoming “whatever the Go implementation happens to do.”

I’d treat it more like a small standards project:

```text
CSVX Specification
        │
        ├── File/container format
        ├── Data model
        ├── Type system
        ├── Formula language
        ├── Style model
        ├── Validation
        ├── Calculation semantics
        ├── Compatibility rules
        └── Import/export expectations
                 │
                 ▼
        Conformance Test Suite
                 │
       ┌─────────┼──────────┬─────────┐
       ▼         ▼          ▼         ▼
      Go        Rust      Python      TS
```

The **conformance suite** is almost as important as the spec. You want a Rust implementation and Go implementation to calculate the exact same workbook the same way.

For example, the spec shouldn't merely say:

> `SUM` adds values.

It needs to eventually define things like: whether strings are ignored, how blanks behave, error propagation, integer/decimal coercion, range evaluation, rounding behavior, dates/timezones, circular references, and what happens with malformed formulas.

Otherwise each implementation becomes subtly incompatible.

I'd also separate the specification into normative pieces rather than one giant document:

```text
spec/
├── README.md
├── 01-container.md
├── 02-workbook.md
├── 03-sheets.md
├── 04-data-types.md
├── 05-cell-values.md
├── 06-formulas.md
├── 07-functions.md
├── 08-styles.md
├── 09-validation.md
├── 10-calculation.md
├── 11-import-export.md
├── 12-security.md
└── 13-conformance.md

schemas/
├── manifest.schema.json
├── workbook.schema.json
├── styles.schema.json
└── formulas.schema.json

examples/
├── minimal.csvx
├── formulas.csvx
├── styled.csvx
├── multi-sheet.csvx
└── typed-data.csvx

tests/
├── parsing/
├── formulas/
├── calculations/
├── styles/
└── invalid/
```

And I'd establish **CSVX Core 1.0** as deliberately conservative.

Core 1.0 could require only the things necessary for a useful spreadsheet: ZIP container, CSV sheets, manifest, typed columns/cells, formulas, basic functions, styles/number formatting, multiple sheets, cached calculated values, and deterministic parsing/calculation behavior.

Charts, pivots, images, comments, external references, etc. can become extensions rather than holding up 1.0.

One other thing I'd establish very early is a distinction between **required and optional capabilities**. For example, a server-side Python CSVX library might have no reason to render styles, but it still needs to preserve them during load/save:

```text
MUST       Required for conformance
SHOULD     Recommended behavior
MAY        Optional capability
```

That lets something like:

```python
book = csvx.load("sales.csvx")
book.recalculate()
book.save("sales.csvx")
```

round-trip the workbook without destroying styling it doesn't actually render.

Then **Go becomes the reference implementation**, not the definition:

```text
csvx-spec     ← authority
    ↑
    │ conforms to
    │
csvx-go       ← reference engine
csvx-rs
csvx-py
csvx-ts
```

