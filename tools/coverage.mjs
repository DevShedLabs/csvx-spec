#!/usr/bin/env node
// Spec coverage check. Every normative statement in spec/ (a sentence containing MUST or SHOULD)
// must have an entry in tests/coverage.json saying how it is tested — or why it is not — and every
// vector operation must be declared in tests/runners.json with the engine runner that executes it.
// This is what stops the spec and its tests drifting apart: a new or reworded requirement fails
// the check until someone decides how it is covered.
//
//   node tools/coverage.mjs            check; print a summary and list known gaps
//   node tools/coverage.mjs --strict   also fail while any requirement or runner is a known gap
//   node tools/coverage.mjs --list     print the current requirements as JSON (to build entries)
//
// Requirement ids are `<chapter>:<hash of the sentence>`, so rewording a requirement changes its id
// and forces a re-review; ids never depend on position in the file.

import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const args = new Set(process.argv.slice(2))

function walk(dir, predicate, out = []) {
  for (const entry of readdirSync(dir).sort()) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, predicate, out)
    else if (predicate(full)) out.push(full)
  }
  return out
}

/** The normative sentences of every spec chapter: prose paragraphs, list items and table rows
 * outside code fences, split into sentences, keeping those that contain MUST or SHOULD. */
export function requirements() {
  const found = []
  for (const file of readdirSync(path.join(root, 'spec')).filter((f) => /^\d\d-.*\.md$/.test(f)).sort()) {
    const lines = readFileSync(path.join(root, 'spec', file), 'utf8').split('\n')
    let heading = ''
    let inCode = false
    let paragraph = []
    const blocks = []
    const flush = () => {
      if (paragraph.length) blocks.push([heading, paragraph.join(' ')])
      paragraph = []
    }
    for (const line of lines) {
      if (line.startsWith('```')) {
        flush()
        inCode = !inCode
        continue
      }
      if (inCode) continue
      if (line.startsWith('#')) {
        flush()
        heading = line.replace(/^#+/, '').trim()
        continue
      }
      if (!line.trim()) {
        flush()
        continue
      }
      if (line.startsWith('|')) {
        flush()
        blocks.push([heading, line])
        continue
      }
      paragraph.push(line.trim().replace(/^[-*]\s+/, ''))
    }
    flush()
    for (const [section, block] of blocks) {
      for (const sentence of block.split(/(?<=[.;:])\s+(?=[A-Z`(])/)) {
        if (!/\b(MUST|SHOULD)\b/.test(sentence)) continue
        const text = sentence.replace(/\s+/g, ' ').trim()
        const hash = createHash('sha1').update(text).digest('hex').slice(0, 8)
        found.push({ id: `${file.slice(0, 2)}:${hash}`, file, section, text })
      }
    }
  }
  return found
}

/** Every operation named by a vector under tests/, with the vectors that use it. */
function vectorOperations() {
  const operations = new Map()
  const files = walk(path.join(root, 'tests'), (f) => f.endsWith('.json') && !/coverage\.json$|runners\.json$|[\\/]fixtures[\\/]/.test(f))
  for (const file of files) {
    const vector = JSON.parse(readFileSync(file, 'utf8'))
    const used = new Set([vector.operation, ...(vector.cases ?? []).map((c) => c.operation)].filter(Boolean))
    for (const operation of used) operations.set(operation, [...(operations.get(operation) ?? []), path.relative(root, file)])
  }
  return { operations, files: files.map((f) => path.relative(root, f)) }
}

if (args.has('--list')) {
  console.log(JSON.stringify(requirements(), null, 2))
  process.exit(0)
}

const problems = []
const fail = (message) => problems.push(message)
const manifest = JSON.parse(readFileSync(path.join(root, 'tests', 'coverage.json'), 'utf8'))
const runners = JSON.parse(readFileSync(path.join(root, 'tests', 'runners.json'), 'utf8'))
const current = requirements()
const currentIds = new Set(current.map((r) => r.id))
const entries = manifest.requirements ?? {}

// 1. The manifest and the spec agree on which requirements exist.
for (const r of current) if (!entries[r.id]) fail(`new requirement has no coverage entry: ${r.id} (${r.file}, "${r.section}"): ${r.text}`)
for (const id of Object.keys(entries)) if (!currentIds.has(id)) fail(`coverage entry for a requirement that no longer exists (reworded or removed?): ${id}: ${entries[id].text}`)

// 2. Each entry says exactly one thing about how it is covered, and what it cites exists.
const counts = { covered: 0, elsewhere: 0, gap: 0, untestable: 0 }
const gaps = []
const cited = new Set()
for (const [id, entry] of Object.entries(entries)) {
  const covered = [...(entry.vectors ?? []), ...(entry.schemas ?? []), ...(entry.examples ?? [])]
  const dispositions = [covered.length > 0 ? 'covered' : null, entry.elsewhere ? 'elsewhere' : null, entry.gap ? 'gap' : null, entry.untestable ? 'untestable' : null].filter(Boolean)
  if (dispositions.length !== 1) {
    fail(`${id}: needs exactly one of vectors/schemas/examples, elsewhere, gap, untestable (has ${dispositions.join(', ') || 'none'})`)
    continue
  }
  counts[dispositions[0]]++
  if (dispositions[0] === 'gap') gaps.push(`${id}  ${entry.text.slice(0, 90)}\n      -> ${entry.gap}`)
  for (const v of entry.vectors ?? []) {
    cited.add(v)
    if (!existsSync(path.join(root, v))) fail(`${id}: vector does not exist: ${v}`)
  }
  for (const s of entry.schemas ?? []) if (!existsSync(path.join(root, 'schemas', s))) fail(`${id}: schema does not exist: ${s}`)
  for (const e of entry.examples ?? []) if (!existsSync(path.join(root, 'examples', e))) fail(`${id}: example does not exist: ${e}`)
}

// 3. Every vector is cited by some requirement (or deliberately listed), so none is orphaned.
const { operations, files } = vectorOperations()
const unmapped = manifest.unmappedVectors ?? {}
for (const f of files) if (!cited.has(f) && !unmapped[f]) fail(`vector is not cited by any requirement: ${f}`)
for (const f of Object.keys(unmapped)) if (!files.includes(f)) fail(`unmappedVectors lists a vector that does not exist: ${f}`)

// 4. Every operation used by a vector is declared with a runner (or a stated reason there is none).
const siblings = { go: path.resolve(root, '..', 'csvx-go'), ts: path.resolve(root, '..', 'csvx-ts'), cli: path.resolve(root, '..', 'csvx-cli') }
const requiredEngines = ['go', 'ts']
const runnerGaps = []
for (const [operation, vectors] of operations) {
  const declared = runners.operations?.[operation]
  if (!declared) {
    fail(`operation "${operation}" (${vectors[0]}) is not declared in tests/runners.json`)
    continue
  }
  for (const engine of Object.keys(siblings)) {
    const entry = declared[engine]
    if (!entry && !requiredEngines.includes(engine)) continue
    if (!entry) {
      fail(`operation "${operation}": no entry for engine "${engine}" in tests/runners.json`)
    } else if (typeof entry === 'string') {
      const file = path.join(siblings[engine], entry)
      if (existsSync(siblings[engine])) {
        if (!existsSync(file)) fail(`operation "${operation}": ${engine} runner not found: ${entry}`)
        else if (!readFileSync(file, 'utf8').includes(operation)) fail(`operation "${operation}": ${engine} runner ${entry} never mentions the operation`)
      }
    } else if (entry.gap) {
      runnerGaps.push(`${operation} (${engine}): ${entry.gap}`)
    } else if (!entry.unsupported) {
      fail(`operation "${operation}": ${engine} entry must be a runner file, { "gap": ... } or { "unsupported": ... }`)
    }
  }
}
for (const operation of Object.keys(runners.operations ?? {})) if (!operations.has(operation)) fail(`tests/runners.json declares operation "${operation}" that no vector uses`)

console.log(`requirements: ${current.length}  covered by vectors/schemas/examples: ${counts.covered}  covered by engine or CLI tests: ${counts.elsewhere}  untestable: ${counts.untestable}  known gaps: ${counts.gap}`)
console.log(`vector operations: ${operations.size}  runner gaps: ${runnerGaps.length}`)
if (args.has('--verbose') || args.has('--strict')) {
  if (gaps.length) console.log(`\nKnown requirement gaps:\n  ${gaps.join('\n  ')}`)
  if (runnerGaps.length) console.log(`\nKnown runner gaps:\n  ${runnerGaps.join('\n  ')}`)
}
if (problems.length) {
  console.error(`\ncoverage check FAILED:\n  ${problems.join('\n  ')}`)
  process.exit(1)
}
if (args.has('--strict') && (gaps.length || runnerGaps.length)) {
  console.error(`\ncoverage check (strict) FAILED: ${gaps.length} requirement gap(s), ${runnerGaps.length} runner gap(s) remain`)
  process.exit(1)
}
console.log('coverage check passed')
