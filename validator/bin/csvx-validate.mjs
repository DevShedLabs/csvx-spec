#!/usr/bin/env node
import { validatePackage } from '../src/validate.mjs'

function printGroupedFindings(findings) {
  const groups = new Map()
  for (const finding of findings) {
    const key = `${finding.resource}\u0000${finding.message}`
    if (!groups.has(key)) groups.set(key, { resource: finding.resource, message: finding.message, paths: [] })
    groups.get(key).paths.push(finding.instancePath)
  }
  for (const group of groups.values()) {
    if (group.paths.length <= 1 || group.paths.every((p) => p === undefined)) {
      console.log(`  ${group.resource}: ${group.paths[0] ?? ''} ${group.message}`.trimEnd())
    } else {
      const sample = group.paths.slice(0, 3).join(', ')
      const more = group.paths.length > 3 ? ` (+${group.paths.length - 3} more)` : ''
      console.log(`  ${group.resource}: ${group.message} — ${group.paths.length} occurrences, e.g. ${sample}${more}`)
    }
  }
}

const targets = process.argv.slice(2)
if (targets.length === 0) {
  console.error('Usage: csvx-validate <package.csvx | package-dir> [more...]')
  process.exit(2)
}

let anyInvalid = false
for (const target of targets) {
  let result
  try {
    result = validatePackage(target)
  } catch (error) {
    console.log(`✗ ${target}`)
    console.log(`  could not load package: ${error.message}`)
    anyInvalid = true
    continue
  }
  if (result.valid) {
    console.log(`✓ ${target}`)
  } else {
    anyInvalid = true
    console.log(`✗ ${target}`)
    printGroupedFindings(result.findings)
  }
}

process.exit(anyInvalid ? 1 : 0)
