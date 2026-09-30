# CSVX Architecture Rules

This file is binding for any agent or contributor working in the CSVX project, in any of its
repositories. It exists because these rules were assumed rather than written down, and the
project drifted from them within its first implementation. Read the "Why this file exists"
section at the bottom if any rule here seems like unnecessary process.

## 1. The topology

There are three distinct kinds of repo in this project. Do not blur them — `csvx-go` blurred
"engine library" and "CLI tool" together for months before anyone noticed, which is exactly the
kind of drift this file exists to prevent.

- **`csvx-spec`** (this repo) is the *only* authority. It contains the normative spec (`spec/`),
  the JSON Schemas (`schemas/`), the format-neutral conformance vectors (`tests/`), the
  hand-authored golden examples (`examples/`), and the reference schema validator (`validator/`).
- **Engine libraries** — `csvx-go`, `csvx-ts`, and any future Python/Rust/PHP/etc. package — are
  *programmable interfaces only*: load, represent, edit, calculate, and write a CSVX workbook as
  data structures. Nothing CLI-shaped belongs in these repos: no argument parsing, no subcommands,
  no user-facing output formatting. Their data models should be *generated* from
  `schemas/*.json` (see rule 3.1), not hand-typed. They implement the spec; they do not define it,
  and they do not each grow their own copy of `export`/`import`/`validate`/etc. — that's `csvx-cli`.
- **`csvx-cli`** is *the one dedicated CSVX command-line tool* — a single Go binary. It owns
  `export`, `import`, `create`, `validate`, `codegen`, and `gen test.csvx` (a schema-exhaustive
  fixture generator). It calls into engine libraries for engine operations rather than
  reimplementing them, and it is the *only* place schema-validation logic should live natively —
  see rule 3.3. If a new operation is needed, it's a `csvx-cli` command, not a new subcommand
  bolted onto an engine repo.
- **`csvx-web`** (and any other consumer app, or a future language binding of the CLI's
  operations) is a *client of an engine and/or the CLI*. It is UI/interaction code only. It must
  never contain its own CSVX parsing, serialization, type inference, formula evaluation, or
  number-formatting logic. If a demo needs to read or write a `.csvx` package, it calls a real
  engine to do it — full stop.

This split (`csvx-go` as pure library, `csvx-cli` as the CLI) happened on 2026-09-30 by extracting
`csvx-go`'s `cmd/csvx` into a new repo that depends on `csvx-go` as an ordinary module. Apply the
same shape to every future engine: a thin, generated, CLI-free library, with `csvx-cli` as the only
place a human or script actually invokes CSVX operations from a terminal.

## 2. Why "just add ajv/write a parser real quick" is not allowed

This is exactly how the project drifted. `csvx-web` was built to "demo and test the engine," but
it hand-rolled its own ZIP reader, CSV parser, cell-type inference, and number formatter instead
of calling `csvx-go` or `csvx-ts`. Every fix made to that reimplementation this session (type
badges, decimal rounding, style application) was patching logic that was never the engine at all
— none of it proved anything about whether the real engine works. A demo that reimplements the
thing it's supposed to demo is not a demo.

Separately, `csvx-go`'s XLSX importer emits `styles.json` as an object map keyed by bare numeric
strings (`{"0": {...}, "1": {...}}`), while every hand-authored golden example
(`examples/styled.csvx/styles.json`) and the schema itself use an array of self-identifying
objects (`[{"id": "currency", ...}]`). The schema was correct. The engine drifted from it, and
nothing caught this because no CI step ever validated the engine's actual output against the
schema it claims to implement.

## 3. Rules for building or changing any engine

1. **Generate the data model from the schema; do not hand-type it.** Structs/interfaces/classes
   for `Manifest`, `Workbook`, `Sheet`, `Style`, and cell metadata must be derived mechanically
   from `schemas/*.json` (e.g. `go-jsonschema`, `quicktype`, `json-schema-to-typescript`, or an
   equivalent for the target language), not hand-written from memory of what the shape "should"
   be. The `styles.json` bug above is a hand-typed struct that disagreed with the schema — that
   class of bug is impossible if the struct is generated from the schema instead of guessed at.
   `csvx-go`'s `internal/schema/generated.go` (fixed 2026-09-30) is the first real instance of
   this; `csvx-cli`'s planned `codegen` command is where this generation step should eventually
   live for every language, rather than being run by hand per engine.
2. **Validate real output against the schema, in CI, every time.** Loading or writing a package
   and never checking the result against `schemas/*.json` is how an engine can drift for months
   unnoticed. Every engine's CI must run `validator/` (or `csvx-cli validate` once it exists)
   against its own generated fixtures on every change.
3. **There is one canonical schema validator — do not let engines reimplement it.** `validator/`
   in this repo (Node/ajv) is the reference implementation today; `csvx-cli`'s planned native `validate`
   command is meant to replace it as the single-binary canonical validator. Either way, there is
   exactly one JSON-Schema-conformance implementation project-wide. An engine library
   (`csvx-go`, `csvx-ts`, ...) must never grow its own copy of schema-validation logic — that is
   precisely the same drift risk as reimplementing the format itself, just one layer up.
4. **Behavior conformance runs through `tests/*.json`, not ad hoc engine-specific tests.** Schema
   validation only proves shape, not behavior — it will not catch a `SUM` formula computing the
   wrong value, or a cached value typed `"string"` when it should be `"decimal"` (a real bug found
   in the current Go-generated fixture). Every engine must have a thin runner that consumes
   `tests/*.json` verbatim, performs the named `operation`, and diffs against `expected`. This
   runner must be part of that engine's CI.
5. **New behavior means spec first, schema second, tests third, implementation last.** Never add
   a field, type, or behavior to an engine that isn't already described in `spec/`, typed in
   `schemas/`, and covered by at least one vector in `tests/`. If it's needed and missing, stop
   and fix `csvx-spec`, in that repo, before writing engine code for it.
6. **Preserve unknown fields.** Per `spec/08-styles.md` and the general preservation rules in
   `skills/csvx/SKILL.md`, an engine must round-trip fields it doesn't understand rather than
   silently dropping them. A generated model with strict/closed types must still have an escape
   hatch (e.g. a captured "extra fields" bag) for this.
7. **The spec is the first source of truth, the CLI is second — and tests must prove that chain,
   not fake it.** A unit test built from a hand-invented minimal fixture (a one-line inline JSON
   string, a three-field struct literal) can pass forever while the engine is broken, because it
   never touches the parts of the spec that are actually wrong. This already happened:
   `csvx-go`'s entire pre-2026-09-30 test suite (`package_test.go`, `package_roundtrip_test.go`)
   used only hand-written synthetic fixtures with no styles, no real XLSX input, and no schema
   check — every test passed the whole time `styles.json` output was non-conformant, because none
   of them ever constructed a style. Concretely, going forward:
   - Prefer the real fixtures in `examples/` and real conversions from real source files (a real
     `.xlsx`, not a synthetic one built inline) over hand-invented minimal JSON, wherever the
     behavior under test can be reached that way.
   - A test that only checks "it parsed" or "the struct fields match" without also validating the
     real serialized output against `schemas/*.json` is incomplete, not passing. Wire schema
     validation into the test itself (call `validator/`, or an engine's native equivalent) rather
     than treating it as a separate manual step someone might forget to run.
   - The CLI is not exempt because it "just calls the library." Test it as a CLI — invoke the built
     binary as a subprocess with real arguments and real files, and check its actual stdout/exit
     code — not just the internal functions its commands happen to call. Argument-parsing unit
     tests (`csvx-cli`'s `main_test.go` before this rule) are necessary but not sufficient on their
     own.

## 4. Rules for csvx-cli

1. `csvx-cli` is the *only* place `export`/`import`/`create`/`validate`/`codegen`/`gen test.csvx`
   logic lives. No engine repo should grow a competing copy of any of these under a different name
   (`csvx-go`'s old `cmd/csvx` did exactly this before the 2026-09-30 split — it's why this rule
   exists).
2. `csvx-cli` calls engine libraries for engine operations (load/edit/calculate/write); it does not
   reimplement them. It may call multiple engines (e.g. shell out to a Python engine's own CLI, or
   bind to a Rust engine via FFI) — the point is that engine logic has exactly one implementation
   per language, and `csvx-cli` orchestrates rather than duplicates.
3. `codegen` is how new/updated engine libraries get their data model. When a schema changes,
   regenerating every engine's model via `csvx-cli codegen` (or that engine's documented generation
   step, until `codegen` covers every language) is part of landing the schema change — not a
   follow-up someone gets to later.
4. `gen test.csvx` must derive its coverage from `schemas/*.json` and `spec/04-data-types.md`
   directly (every scalar type, every style property, multi-sheet, formulas, validation rules), not
   from copying the hand-authored `examples/`, which are illustrative and intentionally small.
5. **`gen test.csvx` needs an XLSX counterpart, and both directions of XLSX interop must be
   round-trip tested — schema-shape validation alone is not enough.** A package can pass every
   check in `validator/` and still have silently lost a formula, a font color, or turned a decimal
   into a string on the way through a converter (this happened — see `csvx-go`'s
   cached-value-typed-as-`"string"` bug, which is schema-legal and semantically wrong). Concretely:
   - `gen test.xlsx` (or equivalent) must produce a purpose-built XLSX fixture exercising every
     scalar type, every style property, multiple sheets, and a representative formula set — not
     rely on whatever a naturally-occurring spreadsheet happens to cover.
   - XLSX→CSVX conversion must be tested against that fixture for both (a) schema conformance
     (`validator/`) and (b) semantic fidelity — specific cell values, formula strings, and style
     properties at known coordinates must match expected values, not just "the file parses."
   - CSVX→XLSX conversion must be tested the same way, in reverse, once it exists as a real
     capability. **It does not yet**: `csvx-go`'s `exportXLSXSource` only recovers an unmodified
     embedded original byte-for-byte; there is no general "export an arbitrary/edited CSVX workbook
     to XLSX" path. Building that is a prerequisite for reverse round-trip testing, not something
     to fake or skip silently — track it as an open gap, don't pretend it's covered.
   - These round-trip checks belong in `tests/interop/` in this repo (format-neutral vectors
     pointing at real fixture files, same pattern as `tests/parsing/`) plus a real executable
     runner — not just documented as an intention. See `tests/interop/README.md`.

## 5. Rules for csvx-web or any other consumer app

1. No parsing, serialization, cell-type inference, formula evaluation, number formatting, or style
   application logic may live in the consumer app. That is engine logic. If the engine isn't
   compiled to WASM or exposed over an API yet, that is the blocking task — the answer is never
   "reimplement a smaller version of it in the app for now."
2. A consumer app may hold UI-only state (selection, scroll position, which cell is being edited,
   toolbar layout) that has no representation in the CSVX format. It may not hold a second opinion
   about what a CSVX value, type, or style means.
3. Before wiring a consumer app to an engine, confirm which engine and how (in-process via WASM,
   over a local API, via native bindings) — this is a real decision with tradeoffs and should be
   made explicitly, not defaulted into.

## 6. CI expectations (aspirational until wired up — treat as required, not optional)

- On every change to `schemas/` or `tests/`, every engine's CI should re-run against the new
  versions and fail loudly on drift, not silently pass because nobody re-ran it.
- On every change to an engine, that engine's own schema-validation and conformance-vector jobs
  must run before merge.
- `examples/*.csvx` are golden fixtures. Any engine claiming to read or write CSVX must be able to
  load every example in `examples/` and re-validate the result against schema.
- `csvx-cli`'s own CI must build/test it, then exercise it against an engine (`csvx-go` today) and
  validate the result — the same loop used manually to verify the 2026-09-30 styles.json fix.

## Why this file exists

This project was designed spec-first on purpose: one schema, many conformant engines (Go now, TS
next, Python/Rust later), with demo apps as thin clients. That design was never wrong. What was
missing was enforcement — nothing ever actually checked that `csvx-go`'s output matched
`schemas/*.json`, and nothing stopped a "demo" app from quietly becoming its own unvalidated
implementation. The rules above are the enforcement that should have existed from the first
commit. Follow them even when it's slower than hand-typing a struct or reimplementing a parser
"just for the demo" — that shortcut is exactly what produced the mess this file is responding to.
