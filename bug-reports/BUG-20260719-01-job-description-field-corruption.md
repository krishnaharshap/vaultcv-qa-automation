# BUG-20260719-01: Job-description field shows garbled/overlapping text on paste

**Severity/Priority:** Medium / P2
**Environment:** app.vaultcv.com, job-add flow, browser/build not yet specified

## Issue Summary
Known, previously tracked issue (carried from prior investigation, still open per `QA_CHARTER.md`). Pasting a long job description into the job-description field produces garbled/overlapping rendered text.

## Steps to Reproduce
1. Navigate to the job-add flow on app.vaultcv.com.
2. Paste a long job description into the job-description field.
3. Observe rendered text.

Note: exact repro steps (JD length threshold, specific browser) are not yet confirmed — this write-up formalizes the known issue into the charter's format, it does not add new reproduction detail.

## Actual Result
Text in the field renders garbled/overlapping.

## Expected Result
Pasted text renders cleanly regardless of length.

## Impact
Confirmed: blocks reliable job-description entry for affected inputs. Hypothesis: likely affects job-matching/scraping-adjacent flows if the field's stored value is also corrupted, not just its rendering — unconfirmed, needs verification against the stored value vs. just the visual rendering.

## Evidence
None captured yet in this project — no screenshot/HAR on file. Flagging as a gap: next occurrence should be captured with a screenshot and the exact pasted text.

## Probable Root Cause
Hypothesis only (not confirmed): likely a text-area/rich-text component issue with paste-event handling on long inputs (e.g. double-render, cursor/selection state bug). No confirmed root cause exists yet.

## Dev Discovery Checklist
- [ ] Confirm whether corruption is visual-only or affects the stored/submitted value.
- [ ] Identify the component rendering the job-description field (native textarea vs. rich-text editor).
- [ ] Determine if there's a length threshold that triggers the issue.
- [ ] Check for related paste-handling logic (custom onPaste handlers, sanitization steps).

## Recommended Fix
Not yet determined — pending root-cause confirmation above.

## Retest Criteria
Paste a job description of at least 2,000 characters into the field across Chrome, Firefox, and Safari; text renders correctly with no overlap/garbling, and the stored value matches the pasted input exactly.

## Preventive Actions
Add `job-match.spec.ts`-style E2E coverage for long-JD paste once selectors are confirmed (see `vaultcv-e2e-design` skill's `job-match.spec.ts` template, which already flags this field as a known-corruption watch point). Consider a rendering/paste eval added to regression coverage once root cause is fixed, so this doesn't silently regress.
