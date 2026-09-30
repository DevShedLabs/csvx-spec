import { loadPackage } from './load-package.mjs'
import { createValidator, SCHEMA_IDS } from './schemas.mjs'

function checkResource(validator, schemaId, resourceName, resource, findings) {
  if (!resource || resource.data === null) {
    if (resource?.parseError) findings.push({ resource: resourceName, message: `invalid JSON: ${resource.parseError}` })
    return
  }
  const { valid, errors } = validator.validate(schemaId, resource.data)
  if (!valid) {
    for (const error of errors) {
      findings.push({ resource: resourceName, instancePath: error.instancePath || '(root)', message: error.message, params: error.params })
    }
  }
}

/**
 * Validates a .csvx package (ZIP file or unpacked directory) against the CSVX JSON Schemas.
 * Returns { valid, findings } — findings is empty when valid is true.
 */
export function validatePackage(pkgPath) {
  const validator = createValidator()
  const pkg = loadPackage(pkgPath)
  const findings = []

  if (!pkg.manifest.data) {
    findings.push({ resource: 'manifest.json', message: pkg.manifest.parseError ? `invalid JSON: ${pkg.manifest.parseError}` : 'missing' })
  } else {
    checkResource(validator, SCHEMA_IDS.manifest, 'manifest.json', pkg.manifest, findings)
  }

  if (!pkg.workbook.data) {
    findings.push({ resource: pkg.manifest.data?.workbook || 'workbook.json', message: pkg.workbook.parseError ? `invalid JSON: ${pkg.workbook.parseError}` : 'missing' })
  } else {
    checkResource(validator, SCHEMA_IDS.workbook, pkg.manifest.data?.workbook || 'workbook.json', pkg.workbook, findings)
  }

  if (pkg.styles) {
    checkResource(validator, SCHEMA_IDS.styles, pkg.workbook.data?.styles || 'styles.json', pkg.styles, findings)
  }

  for (const sheetMeta of pkg.sheetMetas) {
    checkResource(validator, SCHEMA_IDS.sheetMetadata, sheetMeta.metadataPath, sheetMeta, findings)
  }

  return { valid: findings.length === 0, findings, files: pkg.files }
}
