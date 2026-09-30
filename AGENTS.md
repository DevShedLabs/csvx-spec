# CSVX Architecture Rules

This file is binding for any agent or contributor working in the CSVX project, in any of its
repositories. It exists because these rules were assumed rather than written down, and the
project drifted from them within its first implementation. Read the "Why this file exists"
section at the bottom if any rule here seems like unnecessary process.

## 1. The topology

- **`csvx-spec`** (this repo) is the *only* authority. It contains the normative spec (`spec/`),
  the JSON Schemas (`schemas/`), the format-neutral conformance vectors (`tests/`), the
  hand-authored golden examples (`examples/`), and the schema validator (`validator/`).
- **`csvx-go`**, **`csvx-ts`**, and any future Python/Rust/etc. engine are *implementations of*
  the spec. None of them get to define behavior the spec doesn't already describe. If an engine
  needs to do something the spec is silent on, that silence gets fixed in `csvx-spec` first —
  spec and schema changes are never a side effect of writing engine code.
- **`csvx-web`** (and any other consumer app, CLI, or integration) is a *client of an engine*. It
  is UI/interaction code only. It must never contain its own CSVX parsing, serialization, type
  inference, formula evaluation, or number-formatting logic. If a demo needs to read or write a
  `.csvx` package, it calls a real engine to do it — full stop.

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
   from `schemas/*.json` (e.g. `quicktype`, `json-schema-to-typescript`, or an equivalent for the
   target language), not hand-written from memory of what the shape "should" be. The
   `styles.json` bug above is a hand-typed struct that disagreed with the schema — that class of
   bug is impossible if the struct is generated from the schema instead of guessed at.
2. **Validate real output against the schema, in CI, every time.** Loading or writing a package
   and never checking the result against `schemas/*.json` is how an engine can drift for months
   unnoticed. Every engine's CI must run `validator/` (or an equivalent for that language) against
   its own generated fixtures on every change.
3. **Behavior conformance runs through `tests/*.json`, not ad hoc engine-specific tests.** Schema
   validation only proves shape, not behavior — it will not catch a `SUM` formula computing the
   wrong value, or a cached value typed `"string"` when it should be `"decimal"` (a real bug found
   in the current Go-generated fixture). Every engine must have a thin runner that consumes
   `tests/*.json` verbatim, performs the named `operation`, and diffs against `expected`. This
   runner must be part of that engine's CI.
4. **New behavior means spec first, schema second, tests third, implementation last.** Never add
   a field, type, or behavior to an engine that isn't already described in `spec/`, typed in
   `schemas/`, and covered by at least one vector in `tests/`. If it's needed and missing, stop
   and fix `csvx-spec`, in that repo, before writing engine code for it.
5. **Preserve unknown fields.** Per `spec/08-styles.md` and the general preservation rules in
   `skills/csvx/SKILL.md`, an engine must round-trip fields it doesn't understand rather than
   silently dropping them. A generated model with strict/closed types must still have an escape
   hatch (e.g. a captured "extra fields" bag) for this.

## 4. Rules for csvx-web or any other consumer app

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

## 5. CI expectations (aspirational until wired up — treat as required, not optional)

- On every change to `schemas/` or `tests/`, every engine's CI should re-run against the new
  versions and fail loudly on drift, not silently pass because nobody re-ran it.
- On every change to an engine, that engine's own schema-validation and conformance-vector jobs
  must run before merge.
- `examples/*.csvx` are golden fixtures. Any engine claiming to read or write CSVX must be able to
  load every example in `examples/` and re-validate the result against schema.

## Why this file exists

This project was designed spec-first on purpose: one schema, many conformant engines (Go now, TS
next, Python/Rust later), with demo apps as thin clients. That design was never wrong. What was
missing was enforcement — nothing ever actually checked that `csvx-go`'s output matched
`schemas/*.json`, and nothing stopped a "demo" app from quietly becoming its own unvalidated
implementation. The rules above are the enforcement that should have existed from the first
commit. Follow them even when it's slower than hand-typing a struct or reimplementing a parser
"just for the demo" — that shortcut is exactly what produced the mess this file is responding to.
