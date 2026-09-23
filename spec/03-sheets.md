# 3. Sheets

A sheet has a stable ID, a display name, dimensions, columns, and sparse cells. Coordinates are
zero-based in the model and use A1 notation only in formulas and human-facing references.

```json
{
  "id": "sheet-1",
  "name": "Sales",
  "columns": [{"id":"A","name":"Item","type":"text"}],
  "rows": 3,
  "cells": {"A1":{"value":"Item"},"A2":{"value":"Coffee"}}
}
```

Empty cells MUST be omitted from `cells` and evaluate as blank. A cell key MUST be a valid A1
coordinate. Implementations MAY use a denser internal representation but MUST preserve equivalent
semantics and explicit cell metadata.

Column types provide defaults and validation hints; an individual cell MAY override a column type.
Sheet names MUST be non-empty, no longer than 255 Unicode scalar values, and MUST NOT contain `:`
or control characters.
