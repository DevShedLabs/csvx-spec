# Examples

The examples are unpacked CSVX package fixtures kept reviewable in source control. Each workbook uses
CSV as its canonical data layer. Formula, type, style, validation, and cached-value metadata lives in
matching `.meta.json` sidecars when CSV cannot represent it.

A package writer should place the resources into a ZIP archive with the paths described in
`spec/01-container.md`. Each example directory is a named fixture. The `.csvx` extension is reserved
for the generated ZIP package and is not committed yet.
