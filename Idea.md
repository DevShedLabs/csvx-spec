# CSVX Idea

> Build an open-source Go engine first, and make Coder merely one consumer of it.

```text
                    ┌─────────────────────┐
                    │     CSVX Engine     │
                    │        (Go)         │
                    ├─────────────────────┤
                    │ Parse / Validate    │
                    │ Formula Engine      │
                    │ Import / Export     │
                    │ Conversion          │
                    │ Recalculation       │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼──────────────────┐
             │                 │                  │
          Coder IDE          CLI              Web/API
             │                 │                  │
        Spreadsheet UI     Automation       Browser UI
```

### The Go package could look like

```text
csvx/
├── cmd/
│   └── csvx/
│
├── workbook/
│   ├── workbook.go
│   ├── sheet.go
│   ├── cell.go
│   ├── column.go
│   └── range.go
│
├── formula/
│   ├── lexer.go
│   ├── parser.go
│   ├── evaluator.go
│   └── functions/
│
├── format/
│   ├── manifest.go
│   ├── schema.go
│   ├── styles.go
│   └── package.go
│
├── importers/
│   ├── csv.go
│   └── xlsx.go
│
├── exporters/
│   ├── csv.go
│   └── xlsx.go
│
├── validation/
└── csvx.go
```

The critical architectural decision would be to have **one canonical internal workbook representation**:

```go
type Workbook struct {
    Version string
    Sheets  []*Sheet
    Styles  StyleRegistry
    Names   map[string]Range
}

type Sheet struct {
    ID      string
    Name    string
    Columns []Column
    Rows    []Row
}
```

Then conversion isn't:

```text
XLSX → CSVX-specific conversion logic
CSVX → XLSX-specific conversion logic
CSV  → XLSX-specific conversion logic
...
```

It's:

```text
           XLSX ─────┐
                     │
           CSV ──────┼──► Workbook IR ───┬──► CSVX
                     │                    ├──► XLSX
          CSVX ──────┘                    ├──► CSV
                                          └──► JSON
```

That's a **much stronger design**.

Your XLSX importer translates Microsoft's workbook model into the CSVX engine's normalized workbook model. The XLSX exporter does the opposite.

So you could eventually have:

```bash
csvx convert financials.xlsx financials.csvx

csvx convert financials.csvx financials.xlsx

csvx convert financials.csvx financials.csv

csvx inspect financials.csvx

csvx validate financials.csvx

csvx recalc financials.csvx
```

And piping:

```bash
csvx convert input.xlsx --format csvx > output.csvx
```

### Go fits this extremely well

Especially because this doesn't need to be a server.

The core should just be a **Go library**:

```go
import "github.com/DevShedLabs/csvx-go"
```

Then Coder could either call a compiled binary or integrate it into whatever service boundary makes sense.

You could additionally compile portions to **WASM** eventually for browser usage:

```text
csvx Go library
     │
     ├── Native Go
     │     ├── CLI
     │     ├── API server
     │     └── desktop apps
     │
     └── WASM
           └── browser
```

That opens up something particularly nice: a web CSVX editor could potentially import/export spreadsheets **entirely client-side**, without uploading the user's spreadsheet anywhere.

### The open-source engine changes the project

I'd actually separate the concepts now:

**CSVX Specification** defines what `.csvx` means.

**CSVX Engine** is the reference Go implementation.

**Coder CSVX Editor** is a UI built on the engine.

Potentially:

```text
csvx.org

csvx-spec
csvx-go
csvx-cli

Coder
  └── consumes csvx-go / csvx-cli
```

And other developers could build:

```text
Electron app
Web spreadsheet
Data pipeline
VS Code extension
Database exporter
Reporting service
CLI tool
SaaS
```

without depending on Coder.

There's also a very good philosophical boundary here:

> **The engine knows nothing about UI.**

It understands workbooks, sheets, cells, types, formulas, styles, imports, exports, validation and calculation.

Coder decides whether that becomes a toolbar, `fx` bar, context menu, command palette command, or something else.

That separation would turn CSVX from a neat Coder feature into a legitimate **open spreadsheet interchange format + engine**. And Go is a particularly good implementation language because you can ship the engine as one small native binary anywhere without dragging a spreadsheet runtime along with it.
