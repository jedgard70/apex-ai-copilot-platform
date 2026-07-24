# ADR-0047 — AI Execution Governance

**Status:** Accepted with operational constraints  
**Date:** 2026-07-21  
**Scope:** Apex AI 2.0 / Apex Intelligence execution layer

## Context

Apex AI 2.0 is the identity presented to the customer. The technology used to execute a capability is an internal platform decision and must not leak into the product contract or user experience.

A long-lived platform must be able to add, replace, degrade or retire execution adapters without moving domain knowledge, capability contracts, workflows, policies or delivery contracts.

## Decision

The Apex Intelligence execution layer will be provider-neutral and capability-first.

Execution adapters are plugins behind a stable internal contract. The router selects an eligible adapter and model according to:

- capability type and output contract;
- minimum quality and safety threshold;
- cost and organization budget;
- latency and availability;
- data policy and residency;
- customer and organization priority;
- validated fallback route.

No provider name is part of the Apex product identity.

## Operational allowlist

This ADR does not revoke repository safety policies. The current operational allowlist remains authoritative for this workspace. New adapters may not be activated merely because this ADR exists.

Adding an adapter requires:

1. security and secret-handling review;
2. capability benchmark and quality evidence;
3. cost, quota and margin analysis;
4. fallback and rollback plan;
5. explicit operational authorization;
6. update of the provider evaluation matrix.

## Required execution telemetry

Every execution or attempted execution must preserve a safe usage event containing, when applicable:

- organization and customer reference;
- product, capability and workflow;
- route and adapter class;
- model or version identifier;
- usage units;
- estimated and realized cost;
- latency;
- success or failure;
- retry and fallback information;
- quality evidence reference;
- revenue and margin attribution reference.

Secrets, raw credentials, sensitive prompts and customer documents are excluded from telemetry.

## Economic policy

The router must prefer the least expensive eligible route that satisfies the capability quality and safety contract. A cheaper route is not eligible when it violates a hard quality, privacy, compliance or availability gate.

The platform must support:

- per-execution cost ceilings;
- organization daily and monthly budgets;
- duplicate and loop protection;
- cache and idempotency where safe;
- fallback without duplicate billing;
- alerts and controlled degradation;
- margin evaluation by service and organization.

## Consequences

Positive:

- Apex can evolve execution technology without changing the customer-facing product;
- capability contracts remain portable;
- cost, quality and availability become measurable routing inputs;
- fallback and margin controls become first-class concerns.

Trade-offs:

- every new adapter requires evidence and governance;
- routing requires reliable telemetry and versioned rates;
- quality benchmarks must be maintained per capability;
- operational allowlist changes remain a separate controlled decision.

## Implementation boundary

This ADR defines the contract and governance. It does not authorize a new provider integration, change secrets, alter deployment variables or replace the current workspace allowlist.
