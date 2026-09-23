# 7. Functions

Core 1.0 functions are `SUM`, `COUNT`, `IF`, `ROUND`, and `ABS`. Additional functions require a
later specification version or a registered extension.

Function names are ASCII case-insensitive. Arguments are evaluated left-to-right. A function MUST
return the same result for the same workbook state and MUST document its treatment of blanks,
strings, dates, and errors.

Numeric aggregators ignore blanks and text supplied as direct arguments. Errors propagate. `COUNT`
counts numeric values only. `IF` evaluates only the selected branch. `ROUND(number, digits)` uses
half-away-from-zero rounding and requires an integer `digits` argument.

Unknown functions produce `NAME`; implementations MAY support extensions under a registered
namespace, but MUST NOT reinterpret a Core function.
