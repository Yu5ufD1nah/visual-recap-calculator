# Calculator Lab implementation and acceptance

The owner requested a separate public calculator repository with Visual Recap and GitHub Pages. No WalleAI application code, real PR artifacts or credentials are part of this repository.

## Requirements

- CALC-001: four operations, decimal input, clear, sign and deletion; errors for zero division and non-finite values. Verify with state-machine tests and browser calculations.
- CALC-002: responsive calculator usable on narrow viewports, labelled controls and visible keyboard focus. Verify visually and through browser interaction.
- RECAP-001: eligible same-repository PRs produce source-bound, validated recap data using trusted base code. Drafts, forks and bots are excluded.
- RECAP-002: trusted publisher validates provenance, current head and source evidence; stages the trusted interactive viewer and real browser screenshots.
- RECAP-003: GitHub Pages publishes calculator and recaps; a bot comment provides the preview and working interactive link. A second commit refreshes the same URL/comment.
- RECAP-004: only this public repository is allowed; missing/partial/unsafe evidence, stale revisions and untrusted executable assets are blocked.
- RECAP-005: without a Copilot secret, explicitly selected evidence-only mode discloses that insights are unavailable. Configured Copilot operational failures must not be disguised as model success.

## Plan

Use a dependency-free ES module calculator and Node tests. Reuse the source-grounded React viewer, bounded collector, validator, screening, screenshots and trusted publication pattern, with an exact new repository allowlist. Separate calculator root from recap index. Seed trusted tooling in this new repository, then open a small demonstration PR. Leave the demonstration PR unmerged for human review.

## Acceptance evidence to record

Local arithmetic and viewer checks; exact-head GitHub CI; live calculator interactions; demo PR artifact, publisher, Pages deployment, preview/comment; second-commit stable URL and comment refresh. Copilot-authored insights remain unverified until the new repository secret is supplied. Fixture tests do not establish live Copilot success.
