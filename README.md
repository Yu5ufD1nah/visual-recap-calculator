# Calculator Lab

A small calculator and public sandbox for interactive PR Visual Recaps.

- Calculator: addition, subtraction, multiplication, division, decimals, sign, delete and clear.
- Pages hosts the calculator at the project root and recaps at `recaps/pr-N/`.
- A recap comment contains a real browser screenshot and a link to the interactive viewer.
- The viewer supports diagram pan/zoom/selection, changed-file exploration, source links and validated model sections when available.

## Run and test

`npm test` runs arithmetic and state-machine tests. Serve `app/` with any static web server.

The viewer lives in `tools/visual-recap/`: run `npm ci`, `npm test`, `npm run lint`, `npm run build`, then `npx playwright install chromium` and `npm run test:e2e` there.

## Public demo deployment

Repository Settings → Pages → Source must be **GitHub Actions**. The trusted deployment workflow publishes the calculator and accumulated, validated recaps together. No private repository is used as a content source. The hard-coded repository allowlist is specific to this public sandbox.

## Copilot and evidence-only mode

Add the Actions secret `COPILOT_GITHUB_TOKEN` to this repository to enable Copilot-authored insights. GitHub cannot copy an existing secret value from another repository. Do not paste credentials into chat or code.

Without that secret, the demo intentionally produces a labelled **evidence-only** recap: verified file changes and file-diagram nodes, no inferred relationships, contracts or UI behavior. This proves artifact → screenshots → Pages → PR link, not AI insight quality. Once configured, Copilot uses two bounded content-validation attempts with evidence-only recovery for invalid model output. Authentication/process failures remain operational failures.

Generation checks out trusted base code and treats PR patches as data. A separate trusted publisher recollects GitHub evidence, validates provenance, source revision and publication policy, creates browser screenshots and persists the site. A serialized deployer publishes the accumulated site and updates one bot-owned comment per current PR. Forks, bots, drafts, sensitive data, stale snapshots, missing patches and over-budget evidence are not publicly published.

The calculator uses immediate, left-to-right operations rather than algebraic precedence. PR recaps do not replace code review.
