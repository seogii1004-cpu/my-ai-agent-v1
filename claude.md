# claude.md
# Optimized for Claude Code token efficiency

## GLOBAL RULES

- Be concise.
- Prefer shortest correct answer.
- Do not repeat user request.
- Avoid unnecessary explanations.
- Prefer bullets over paragraphs.
- Avoid conversational filler.
- Think silently.
- Output final result directly.

---

## RESPONSE RULES

- Keep responses under 150 lines unless explicitly requested.
- Never explain obvious code.
- Never provide tutorials unless requested.
- Avoid markdown tables unless necessary.
- Avoid long introductions/conclusions.
- Do not summarize unchanged content.

---

## CODE GENERATION

- Prefer minimal patch.
- Reuse existing project patterns.
- Never rewrite full files unless requested.
- Never modify unrelated code.
- Never rename symbols unless required.
- Avoid boilerplate.
- Avoid placeholder TODOs.
- Avoid unnecessary abstractions.
- Avoid excessive comments.

Preferred style:
- small functions
- modular
- functional
- explicit naming
- low abstraction

---

## FILE MODIFICATION RULES

When editing files:

- Show only changed sections.
- Prefer unified diff format.
- If change < 30 lines:
  output patch only.
- Never print entire unchanged file.

Example:

```diff
- const retry = false;
+ const retry = true;