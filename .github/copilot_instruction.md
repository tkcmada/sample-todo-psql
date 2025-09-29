# Copilot Instruction Updates

## Documentation Workflow Requirements
- Capture each change under `docs/CRs/<yyyymmdd>_<title>/`, ensuring the folder contains:
  - `requirements.md`
  - `design.md`
  - `todo.md`
- Mirror the current requirements and design into `docs/latest/requirements.md` and `docs/latest/design.md` whenever they change.
- After pushing a pull request, verify the CI pipeline results and resolve any failures promptly.
- Conduct a retrospective for each change and document improvement points in `docs/CRs/<yyyymmdd>_<title>/retrospective.md`.
- Share improvement proposals with the user to keep this instruction file evolving.

## Suggested Refinements for Future Iterations
- Clarify naming expectations for `<title>` (e.g., kebab-case vs. snake_case) to prevent inconsistent folder names.
- Add explicit guidance on how to handle minor tweaks that do not require updates to every document listed above.
- Provide a checklist template for retrospectives so contributors capture consistent insights.
- Document the communication channel and timing for delivering the improvement proposals to the user.
- Reference any automation (scripts or CI checks) that can validate the documentation structure automatically.
