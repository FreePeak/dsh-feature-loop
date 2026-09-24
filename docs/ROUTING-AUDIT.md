# Routing decision

**Decision: keep `src/routing.ts` as a policy layer and continue using DSH
model selection as the mechanism.**

## Why the layers are distinct

`ModelLadder` owns feature-loop policy that DSH does not know about:

- a spec-level ordered ladder;
- sticky escalation within a turn;
- escalation after a configured number of steps;
- escalation after consecutive failed steps;
- escalation from observed per-step cost;
- a `RouteDecision` carrying the rung and reason for the feed/history;
- a standalone-runner implementation that has no DSH Agent factory.

DSH `model-selection` owns the request mechanism: the mutable per-agent route,
prompt assembly, and durable route-switch notices. The plugin already uses that
mechanism at the supported `agent/request` boundary. It does not fork the agent
loop or write private selection state.

## Why collapsing now would be a regression

Collapsing the policy into model selection would either:

1. remove the standalone runner's routing behavior;
2. duplicate failure/cost/step policy into DSH selection, widening the package's
   maintenance surface; or
3. lose the reason/rung evidence used by notices and optimization history.

The current code already documents this relationship in `src/routing.ts` and
keeps the policy pure and independently testable.

## Current evidence

- `test/budget.test.ts` covers empty ladders, max-rung validation, step,
  failure, and cost escalation.
- `test/plugin-tool-outcomes.test.ts` covers the live request override and
  provider/reasoning preservation.
- `test/plugin-tool-outcomes.test.ts` and the real DSH integration suite cover
  the AgentLoop request boundary.
- The isolated live run used the configured OneGW execution route and recorded
  non-zero spend.

## Revisit condition

Revisit this decision only if DSH model selection grows first-class policy
hooks for step/failure/cost escalation **and** the standalone runner is retired
or given an equivalent adapter. Until then, the current one-seam design is
smaller and safer than either a fork or duplicated policy.
