# 12. Security

CSVX readers MUST treat workbook content as untrusted data. They MUST NOT execute macros, scripts,
external links, formulas with side effects, or embedded files automatically.

Readers SHOULD enforce configurable limits for archive size, compression ratio, entry count, JSON
depth, cell count, formula length, and formula dependency count. ZIP extraction MUST defend against
path traversal and resource exhaustion.

External references are not Core. A conforming Core implementation MUST reject or quarantine them,
not fetch them. Error messages SHOULD avoid exposing local filesystem paths or secrets.
