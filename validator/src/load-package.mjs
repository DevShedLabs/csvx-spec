import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import path from 'node:path'
import AdmZip from 'adm-zip'

function readEntries(pkgPath) {
  const isDir = statSync(pkgPath).isDirectory()
  if (isDir) {
    return {
      list: () => listFilesRecursive(pkgPath).map((absolute) => path.relative(pkgPath, absolute).split(path.sep).join('/')),
      read: (entryName) => {
        const full = path.join(pkgPath, ...entryName.split('/'))
        return existsSync(full) ? readFileSync(full, 'utf8') : null
      },
    }
  }
  const zip = new AdmZip(pkgPath)
  const entries = zip.getEntries()
  return {
    list: () => entries.map((entry) => entry.entryName),
    read: (entryName) => {
      const entry = zip.getEntry(entryName)
      return entry ? entry.getData().toString('utf8') : null
    },
  }
}

function listFilesRecursive(dir) {
  const out = []
  for (const name of readdirSync(dir)) {
    const full = path.join(dir, name)
    if (statSync(full).isDirectory()) out.push(...listFilesRecursive(full))
    else out.push(full)
  }
  return out
}

function readJSON(entries, name) {
  const raw = entries.read(name)
  if (raw === null) return { data: null, raw: null }
  try {
    return { data: JSON.parse(raw), raw }
  } catch (error) {
    return { data: null, raw, parseError: error.message }
  }
}

/**
 * Loads a .csvx package (ZIP file or unpacked directory) into its raw JSON resources,
 * without interpreting or reshaping them. This is deliberately dumb: it hands back exactly
 * what's on disk so the validator can check it against the schemas as-is.
 */
export function loadPackage(pkgPath) {
  const entries = readEntries(pkgPath)
  const fileList = entries.list()
  const resources = { path: pkgPath, files: fileList }

  const manifest = readJSON(entries, 'manifest.json')
  resources.manifest = manifest

  if (manifest.data?.workbook) {
    resources.workbook = readJSON(entries, manifest.data.workbook)
  } else {
    resources.workbook = { data: null, raw: null }
  }

  const stylesPath = resources.workbook.data?.styles || 'styles.json'
  if (fileList.includes(stylesPath)) {
    resources.styles = readJSON(entries, stylesPath)
  }

  resources.sheetMetas = []
  for (const sheet of resources.workbook.data?.sheets || []) {
    if (sheet.metadata) {
      resources.sheetMetas.push({ sheetId: sheet.id, metadataPath: sheet.metadata, ...readJSON(entries, sheet.metadata) })
    }
  }

  return resources
}
