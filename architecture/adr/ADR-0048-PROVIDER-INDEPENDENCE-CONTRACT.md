# ADR-0048 — Provider Independence Contract

**Status:** Accepted as a non-negotiable implementation constraint  
**Date:** 2026-07-21  
**Scope:** Apex AI 2.0 / Professional Capability Runtime

## Decision

A capability depends on an Apex execution contract, never on a named external provider. The only permitted dependency direction is:

```text
Capability → Apex execution contract → Router → Adapter → normalized response → Delivery
```

Adapters are replaceable infrastructure. They must not leak provider-specific request formats, errors, model names or credentials into capabilities, workflows, products or frontend code.

Capabilities request an execution ability (for example, document analysis, image generation, OCR, transcription or reasoning) and receive a normalized response containing content/artifacts, status, usage metrics, estimated cost, latency, error classification and execution identifier.

## Required behavior

1. The Router selects an eligible adapter by capability contract, quality, cost, latency, availability, policy and budget.
2. A compatible fallback may be selected without changing the capability, workflow, frontend or customer journey.
3. Retries and fallbacks are bounded and idempotent; they must not duplicate billing or create loops.
4. Secrets remain backend-only and are never returned to the client, logs, reports or commits.
5. Every adapter has contract tests and every capability has provider-independent tests.
6. Adding, replacing or retiring an adapter requires compatibility evidence, cost/quality review and an approved configuration or ADR change.

## Current implementation gap

The Apex OS already exposes `ExecutionProvider` as an injectable contract and keeps the initial raster adapter outside the capability specification. The current local runtime still injects one adapter directly and does not yet provide a production router, fallback policy or cost telemetry. Those are explicit next-cycle implementation items, not claims of completion.

## Acceptance proof

The contract is satisfied only when the same capability and frontend flow can execute with two compatible adapters by configuration change alone, with normalized output and unchanged customer experience. Removing one adapter must produce a bounded fallback or a truthful, auditable failure.

This ADR does not authorize new providers, environment changes, secret synchronization or deployment. It refines the provider-neutral governance established by ADR-0047.
