# Technical Proposal for the Claims Intelligence Engine

## Executive summary

This prototype turns a proposed cosmetic claim and its supporting study summary into a structured decision-support record. It deliberately separates scientific submission, automated evidence screening, and accountable human approval. The model recommends whether the evidence supports the exact claim, reports confidence, explains the decisive evidence, and routes uncertain cases to review. PostgreSQL retains the submitted inputs and assessment metadata for traceability.

## Business process understanding

The assignment describes four roles and a staged handoff. A business team proposes candidate claims for a product. Claims managers remove claims that are inapplicable, infeasible, or unsuitable. Scientists formulate and test the product, then submit study results. Evaluators compare the evidence with the exact proposed language and issue the final report.

The engine belongs between scientific submission and evaluator approval. Its purpose is triage and consistency: it can expose missing comparators, mismatched endpoints, unsupported magnitudes, population gaps, or timeframe differences before a reviewer spends time on the case. It must not be presented as regulatory or scientific approval. A conservative decision policy and a human-review status protect that boundary.

## Research and design inputs

The design applies three research themes:

1. Evidence-to-claim alignment. Support depends on the exact endpoint, effect magnitude, population, product/formula identity, usage, comparator, statistical analysis, and timeframe. A positive study is not automatically evidence for broader wording.
2. Reliable model integration. OpenAI Structured Outputs constrain the response to `justified`, `confidence`, and `reasoning`, which avoids brittle parsing. The server still validates the result and treats missing or invalid output as a service failure.
3. Accountable AI operation. Model name, prompt version, raw structured response, input evidence, timestamps, and record identifiers are stored. Low-confidence results are explicitly routed to people instead of silently accepted.

Primary implementation reference: [OpenAI Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs?api-mode=responses). The remaining implementation uses the documented contracts of NestJS, Prisma, PostgreSQL, React, and Vite.

## Technical design and rationale

The repository is a pnpm monorepo with independent `api` and `web` applications. React keeps the assessment flow small and responsive. NestJS provides validation, dependency injection, and a clear controller/service/provider boundary. Prisma expresses the relational contract and makes the write transaction explicit. PostgreSQL is appropriate for durable, queryable audit records and later workflow/reporting requirements.

`POST /api/claims/assess` accepts `claim`, `productFormula`, and `evidence`. The service first creates a submitted Claim. The model adapter sends the material to the OpenAI Responses API with a strict JSON schema. After a valid response, a transaction creates the Assessment and moves the Claim to `ASSESSED` or `REVIEW_REQUIRED`. Confidence below 0.70 triggers review; this threshold is a prototype policy that must be calibrated against labelled evaluator decisions.

The assessment prompt is intentionally conservative. It tells the model not to invent study design details and to evaluate the exact claim rather than general product plausibility. The API key remains server-side. DTO size limits reduce accidental oversized submissions, and errors are returned without exposing credentials.

## Data model

Claim stores the proposed wording, formula description, evidence, workflow status, and timestamps. Assessment stores the claim relation, binary decision, confidence, reasoning, model identifier, prompt version, raw structured output, and timestamp. A Claim supports multiple Assessments so reviewers can compare model or prompt versions without overwriting history.

## Quality strategy

Unit tests verify controller delegation, persistence mapping, justified decisions, and low-confidence review routing. The React test verifies the visible end-to-end interaction at the browser boundary with the network mocked. Build and type checks cover both applications. Production hardening should add contract tests against an ephemeral PostgreSQL instance, prompt regression sets labelled by evaluators, adversarial evidence tests, accessibility checks, and full browser tests.

## Risks and mitigations

- Model error or overconfidence: conservative prompts, strict output schema, calibrated thresholds, regression evaluation, and mandatory human approval.
- Sensitive research data: regional hosting review, encryption, least-privilege access, retention rules, redaction, and an approved enterprise model/data policy.
- Prompt or model drift: version every prompt/model, retain evaluations, compare against a golden dataset, and use staged release gates.
- Evidence quality: require structured study metadata and source attachments in later phases; never infer missing fields.
- Availability and cost: timeouts, bounded input, retry policy for transient failures, idempotency keys, queues, caching where scientifically safe, and observable token/cost metrics.

## Product roadmap

### Phase 1: controlled pilot

Add authenticated roles, claim workflow states, structured study fields, attachment storage, reviewer comments, override reasons, an audit log, idempotent API requests, and a labelled evaluation dataset. Run in shadow mode beside evaluator decisions and calibrate confidence thresholds by claim category.

### Phase 2: evidence workspace

Add PDF ingestion with source citations, formula/version linkage, protocol and endpoint extraction, claim templates, jurisdiction-specific rules, similarity search over approved precedents, reviewer queues, notifications, dashboards, and multilingual evidence support. Every generated rationale should link to the exact source passage.

### Phase 3: governed intelligence platform

Add model/prompt registry, automated regression gates, bias and drift monitoring, fine-grained access controls, data lineage, electronic signatures, retention policies, validated integrations with laboratory and product lifecycle systems, and portfolio-level analytics. Use multiple specialised checks—statistical adequacy, wording alignment, regulatory policy, and safety—then aggregate them under an explainable decision policy.

### Long-term evolution

Move from a single assessment call to a claim lifecycle platform that helps teams design testable claims before studies begin, forecasts evidence gaps, reuses validated precedents, and continuously learns from reviewer overrides. Human accountability remains explicit: automation improves preparation and consistency, while authorised specialists own final approval.
