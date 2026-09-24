# 11. Import and export

Importers translate external formats into the CSVX data model; exporters translate from CSVX. They
MUST NOT silently discard formulas, errors, styles, or unsupported metadata. Lossy conversions MUST
report warnings with a location and reason.

CSV import defaults to UTF-8, comma delimiter, one header row only when explicitly requested, and
text values unless type inference is enabled. CSV export MUST define how formulas are emitted; the
Core default is to export calculated display values and report that formulas were omitted.

XLSX, charts, pivots, and macros are outside Core. An implementation MAY support them through the
XLSX interoperability extension defined in `14-xlsx-interoperability.md`, but extension data must
not change Core calculation semantics. The extension SHOULD be implemented early enough to validate
CSVX against real XLSX workbooks; it MUST provide exact-source recovery for unchanged embedded
sources and explicit diagnostics for regenerated exports.
