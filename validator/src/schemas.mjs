import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import Ajv2020 from 'ajv/dist/2020.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SCHEMAS_DIR = path.join(__dirname, '..', '..', 'schemas')

export function loadSchemas() {
  const files = readdirSync(SCHEMAS_DIR).filter((name) => name.endsWith('.schema.json'))
  return files.map((name) => JSON.parse(readFileSync(path.join(SCHEMAS_DIR, name), 'utf8')))
}

export function createValidator() {
  const ajv = new Ajv2020({ allErrors: true, strict: false })
  for (const schema of loadSchemas()) ajv.addSchema(schema)
  return {
    validate(schemaId, data) {
      const validateFn = ajv.getSchema(schemaId)
      if (!validateFn) throw new Error(`Unknown schema: ${schemaId}`)
      const valid = validateFn(data)
      return { valid, errors: valid ? [] : (validateFn.errors || []) }
    },
  }
}

export const SCHEMA_IDS = {
  manifest: 'https://csvx.dev/schemas/manifest.schema.json',
  workbook: 'https://csvx.dev/schemas/workbook.schema.json',
  styles: 'https://csvx.dev/schemas/styles.schema.json',
  sheetMetadata: 'https://csvx.dev/schemas/sheet-metadata.schema.json',
  formulaCell: 'https://csvx.dev/schemas/formulas.schema.json',
}
