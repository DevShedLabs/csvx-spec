# 9. Validation

Validation is advisory metadata used by editors and importers. It MUST NOT change calculation
semantics. A validation rule may specify `type`, `allowBlank`, `operator`, `formula1`, `formula2`,
and a user-facing error message.

Core validation types are `whole`, `decimal`, `list`, `date`, `textLength`, and `custom`.
Invalid input SHOULD be reported with a stable machine-readable code and MAY be rejected by an
interactive editor. A headless reader MUST preserve invalid values rather than deleting them.

Package validation is separate from cell validation: malformed JSON or an invalid formula is a
package error; a cell failing a user rule is workbook data.
