# Reference: Eval-Driven Testing for AI Outputs

Source material reviewed: OpenAI's "Working with evals" guide (https://developers.openai.com/api/docs/guides/evals) and the OpenAI Evals product (https://evals.openai.com/ — this page is JS-rendered and didn't expose readable content via fetch; the API guide above covers the same concepts in depth). Summarized here in original wording for VaultCV's use, not copied from the source.

Note: OpenAI's own guide flags that this specific Evals *platform/API* is being deprecated (read-only Oct 31 2026, shutdown Nov 30 2026), with "Datasets" as its suggested successor. Treat this as a methodology reference, not as a tool to adopt as-is — VaultCV is Claude-based, so the actual implementation should use Claude-side evaluation approaches (e.g. a custom harness, or Anthropic's own eval tooling if/when adopted), applying the same underlying method.

## The core method (three steps)

1. **Describe the task as an eval.** Define what "correct" means for a given input before you test anything — similar in spirit to BDD (write the expected behavior first, then test against it).
2. **Run the eval against test data.** Feed real or representative inputs through the system and capture outputs, then judge each output with a "grader."
3. **Analyze and iterate.** Look at pass/fail and score patterns across the dataset, find where the system underperforms, fix it, and re-run to confirm improvement without regressing elsewhere.

## Grading approaches worth carrying into VaultCV QA

- **Exact/string match grading** — fine for deterministic outputs (e.g. a classification label, a fixed field value). Cheap, but only works when there's one correct answer.
- **Model-graded / rubric grading** — for open-ended or generated text (summaries, AI-written content, workflow narration), use a separate model call or rubric to score the output against criteria like accuracy, completeness, tone, or policy compliance. This is the relevant pattern for VaultCV's AI-generated content (e.g. resume/job-matching output) and for memory-recall correctness where there's no single exact string to match.
- **Dataset-driven regression** — maintain a fixed set of representative test cases (inputs + expected criteria) and re-run the full set whenever a prompt, workflow step, or memory schema changes, to catch silent quality regressions before they ship.

## Applying this to VaultCV

- **Memory-layer testing:** build a small dataset of "store X, then later ask about X" scenarios; grade whether the recalled answer is factually consistent with what was stored, not just whether *something* was returned.
- **Workflow testing:** for each multi-step Claude workflow, define expected intermediate and final outputs for representative inputs, and grade deviations — this is the AI-specific complement to standard E2E/API testing already planned (Playwright, Schemathesis, k6).
- **Regression gate in CI:** treat an eval run like a test suite — wire it into the same GitHub Actions pipeline already recommended in `04_chat_qa_architecture_brainstorming.md`, so prompt/workflow changes get an automatic quality check alongside functional tests.
- **Where this fits the test pyramid:** functional/E2E (Playwright) and API/SQL validation answer "did it work mechanically"; evals answer "was the AI output actually good" — VaultCV needs both, and they should run as separate, complementary suites.
