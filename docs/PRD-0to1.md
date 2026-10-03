# PRD — the 0→1 product loop

**Package:** `@freepeak/dsh-feature-loop` · **Status:** approved, PR 1 of 8
**Owner:** Linh Doan · **Written:** 2026-10-03
**Supersedes nothing.** [`PRD.md`](PRD.md) is the audit of the de-fork — why the
vendored agent loop was removed and what replaced it. This document is what the
package becomes *next*: the pipeline, its gates, its budgets, and its evidence.

> **Design sources.** Every rule and threshold below carries its page in *The 0→1
> Loop Engineering Playbook (2026 Edition)* (Valenx Press, 335pp), quoted as
> `p<page>`. The book has no chapter called "0→1 pipeline"; the phase model in
> §3 is an **assembly** of Ch5 (Plan-and-Execute), Ch15 (Research), Ch14
> (Coding) and Ch18 (Product), and is labelled as such wherever it goes beyond
> what the book states directly.

---

## 1. Summary

`dsh-feature-loop` is currently a **policy layer**: budget ceilings, cheap-first
routing, stall detectors, a fail-closed review gate and a local judge, hosted on
the DeepSeek Harness's own agent loop. It bounds and observes a *single turn*.
It does not take a user anywhere.

This document turns it into a **0→1 product loop**. The user states a product
goal in one sentence. The loop then runs five phases unattended — research, PRD,
implement, test, ship — and stops at a pull request. Every step leaves an
evidence artifact and a dollar figure; every phase carries its own ceiling.

Nothing about the existing policy layer is removed. It becomes the body of the
new pipeline rather than the whole of it.

---

## 2. Problem

The gap is not loop control. It is that a bounded loop with a good gate still
requires a human to supply the sequence. In practice that means:

1. **The user does the project's work.** Research, scoping, PRD, implementation,
   proof, and the pull request are five separate human-driven sessions, each with
   its own context loss. That is the "demo → product" distance Ch18 measures as
   *"about 10,000 edge cases and a billing system"* — except here the cost is
   not edges, it is **handoffs**.
2. **Nobody knows what a run cost.** `RunRecord` records cost per *run*
   ([runlog.ts:55](file:///Users/linh.doan/work/harvey/freepeak/dsh-feature-loop/src/runlog.ts:55)).
   A five-phase run whose implementation phase burned 80% of the budget is
   indistinguishable from a research phase that burned 80%. You cannot tune what
   you cannot attribute.
3. **Nothing survives the run.** A completed turn leaves a JSONL line. It leaves
   no PRD, no diff rationale, no test output, no PR body. There is no artifact a
   reviewer can read without re-running the loop, and *"you cannot take a failed
   trace and re-run it locally with the same inputs … your debugging will rely on
   guesswork"* (p135).
4. **Autonomy is all-or-nothing.** The approval gate offers `review-risky` and
   `approve-every-step` ([approval-bridge.ts:214](file:///Users/linh.doan/work/harvey/freepeak/dsh-feature-loop/src/approval-bridge.ts:214)).
   A user who will not sit through 200 approve prompts cannot run the loop at
   all, so the loop stays a supervised tool.

---

## 3. The pipeline

### 3.1 Shape

The book supplies the hybrid rule verbatim: *"use Plan-and-Execute at the top
level to outline phases, then use ReAct within each phase to handle the
unpredictable details"* (Walkthrough 4.3, 9/10, p40). So:

- **Phase-level = Plan-and-Execute.** A fixed, validated sequence with explicit
  exit gates. Replanning after a surprising step, not merely after an error
  (Ch5 anti-pattern, p43: *"Trigger a replanning check after every step where the
  output surprises you, not only on explicit errors"*).
- **Within a phase = ReAct, unchanged.** The harness's existing agent loop keeps
  running. **No new agent loop is written.** The plugin keeps hosting on
  `agent/pre-step`, `agent/request` and `tools/pre-execute`, exactly as it does
  today, and adds phase transitions on top.

### 3.2 The state machine

Ch3 PRODUCTION TIP (p25): *"Model every agent as a state machine with explicit
VALID_TRANSITIONS before writing a single LLM call"* — catching, in the book's
words, ~80% of loop bugs without reading an LLM output.

```
RESEARCH ─▶ PRD ─▶ IMPLEMENT ⇄ TEST ─▶ SHIP ─▶ DONE
                 │           │
                 │           └─ test failed, attempt < 3
                 │           └─ attempt ≥ 3 ──▶ BLOCKED
                 └─ guard fired ──▶ STOPPED
```

Three rules make the machine more than decoration:

- `TEST → IMPLEMENT` is **invalid** past attempt 3. Ch14's rule is *"max 3
  attempts, then report the issue rather than looping"* (p185), and the failure
  mode of ignoring it is named: an agent that re-approaches a failing test
  without seeing its own prior edits *"repeat the same fix 70% of the time"*
  (p188). Attempt 3 therefore **carries the full diff of everything changed so
  far** into the prompt, which the book measures as cutting that repetition to
  under 20%.
- Terminal states are terminal. `DONE`, `STOPPED` and `BLOCKED` have no
  outgoing edges, so a run cannot "recover" from a ceiling by continuing.
- `transition(from, to, reason)` is the **only** way the phase changes, and it
  throws on an invalid transition. One choke point, one guard, every caller.

### 3.3 The five phases

| Phase | Work (book source) | Exit gate — observable | Share |
|---|---|---|---|
| `research` | Decompose the goal into 3–8 sub-questions; ≤5 sources each; extract claims with a citation; resolve contradictions by source credibility (9/10 peer-reviewed → 3/10 forum) (Ch15, p194–p205) | `docs/0-research.md` exists **and** contains ≥1 `http(s)://` citation | 10% |
| `prd` | Answer the 4-question Product-Agent Fit Test (Ch18, p240); scope, user flow, explicit non-goals, key metrics (Walkthrough 18.1, p238) | `docs/PRD.md` exists **and** contains the required headings | 10% |
| `implement` | `FEATURE_PROMPT`'s 5 rules verbatim (Ch14, p184, already in [`prompts.ts:57`](file:///Users/linh.doan/work/harvey/freepeak/dsh-feature-loop/src/prompts.ts)); search-and-replace as the default edit, whole-file rewrite only for new files or <200 lines (p182); token-budgeted context selection 30/25/20/15/10 (p183) | ≥1 tracked source file changed | 35% |
| `test` | Write-test-fix, ≤3 attempts, diff carried forward on the last (p177, p188); run **all** tests, never suppress one (p184) | the project's test command exits 0 | 15% |
| `ship` | commit on the loop branch → push → `gh pr create` with PRD + evidence in the body | a PR URL is recorded | 20% |
| — | **buffer**, never spent on work | — | **10%** |

The split is Walkthrough 13.2's allocation (p169: *"10% planning · 60% research
iterations · 20% synthesis · 10% buffer"*) mapped onto our phases. The buffer is
reserved for the terminal report, per *"the final 10% must be reserved for the
forced-answer generation step"* (p34). Every threshold lives in `BOOK_THRESHOLDS`
next to its citation, matching the convention already set in
[signals.ts:80](file:///Users/linh.doan/work/harvey/freepeak/dsh-feature-loop/src/signals.ts:80).

### 3.4 Phases must not borrow

App B #82 (p296): *"If the planning phase exceeds its budget, simplify the plan
rather than stealing from execution. Prevents any single phase from
monopolizing resources."* Each phase therefore gets its own hard `maxSpendUSD`
and `maxSteps` carved from the run's `costBudgetUSD`. Overrun is a **stop for
that phase**, not a transfer.

---

## 4. YOLO: bounded autonomy

Chosen posture, and the reasoning: autonomy without an envelope is not a feature
(it is the $340,000 fintech incident, p8); autonomy *with* an envelope is the
book's Autonomous tier (Ch14, p192) minus its open blast radius.

**YOLO never interrupts.** Under `gateMode: auto` the three-way review verdict
collapses to **allow** or **deny**. There is no `ask`, which is precisely what
makes it YOLO — no prompt can be raised, so none can be missed, and
`approvals.ts`'s timeout/fail-closed machinery is simply not in the path.

Safety comes from the envelope instead:

1. **A throwaway worktree.** App B #22 (p285): *"Code execution tools run in
   Docker containers. File operations happen in a restricted directory."* We run
   in `git worktree add .feature-loop/worktrees/<runId> -b fl/<slug>` — which is
   also this repo's own standing rule in `AGENTS.md`. YOLO refuses to start
   outside a git repository. A runaway run can dirty a throwaway directory, never
   the user's checkout.
2. **A hard deny-list, tested directly.** Not "ask", **deny**:

   | Forbidden | Why |
   |---|---|
   | push to `main`/`master`/any protected branch | the envelope's whole boundary |
   | `push --force` | destroys the history the evidence bundle describes |
   | `gh pr merge` | ship *stops at* the PR; a human merges |
   | `gh release`, `npm publish` | publishing is not reversible |
   | any deploy command | out of scope by decision (§10) |
   | any write whose resolved path escapes the worktree root | App B #22 |
   | writes to `.env*`, `*.pem`, `*.key`, `credentials.*` | `AGENTS.md` secret rule |
   | `git push` to a remote other than the loop branch | — |

   This is the one security-critical table in the change: a frozen list with its
   own test file and no indirection.
3. **Ceilings.** Phase and run budgets (§5). These are the only thing between a
   bad prompt and a bill, so they are built and tested first.
4. **A kill switch.** App B #75 (p295): *"Immediately halt all agent operations
   via a single control … within seconds. Every production agent system needs
   one. Test it quarterly."* The sentinel is `.feature-loop/STOP`, checked on
   every `agent/pre-step` so a stop lands within one step; the dashboard's Stop
   button creates it.

The book also warns what YOLO must not become: approval fatigue is *"strictly
worse than no approval at all … the illusion of oversight while removing the
reality"* (p89). The defence is the deny-list — a genuine boundary — rather than
a gate a user learns to click through.

---

## 5. Budgets

### 5.1 Check before the call, not after

ReAct PRODUCTION TIP (p34): *"check remaining budget **before** each LLM call —
not after. Set the alert threshold at 90% of budget, not 100%."*

**This is a live defect, not a design choice.** In
[`plugin.ts:1254`](file:///Users/linh.doan/work/harvey/freepeak/dsh-feature-loop/src/plugin.ts:1254)
the handler prices prior steps, calls `await next()` — which makes the model
call — and only then computes the verdict. The ceiling for step *N* is evaluated
after step *N* has been paid for. The fix is a cheap pre-call guard at ≥90%
(rejecting, reserving the last 10%), with the full verdict left where it is.

### 5.2 Per-phase and per-run

Each phase has `maxSpendUSD` and `maxSteps`; the run has `costBudgetUSD`,
`maxSteps` and a **wall-clock timeout** the loop currently has no equivalent of
(App B #9 Timeout Guard, p278: a timeout *"fires regardless of internal state"*).
Ceiling verdicts follow Walkthrough 13.2 (p169): per-run overrun **forces
synthesis** — the loop reports what it has; it does not error.

### 5.3 The arithmetic is the design

Ch1 (p8): *"every additional step multiplies API cost, not adds to it."* A
five-phase run is not 5× a one-phase run; it is `Σ(phase steps × cost/step)`.
The `REPORT.md` prints that worst case, so a user who widens `maxSteps` sees the
exposure move **before** running it.

---

## 6. Evidence

### 6.1 Reuse the format that already exists

The repo already contains a hand-built evidence pack at
[`docs/evidence/local-loop-20260930-214354/`](file:///Users/linh.doan/work/harvey/freepeak/dsh-feature-loop/docs/evidence/local-loop-20260930-214354/)
— `REPORT.md`, `artifacts/`, `logs/`, a scoreboard table tying each claim to a
file. The loop now **produces that shape automatically** instead of by hand. No
new format is invented.

```
.feature-loop/runs/<runId>/
  REPORT.md      # goal · phase table with budgets · per-phase outcomes · artifacts · PR link · verdict
  steps.jsonl    # {index, phase, tool, argsKey, error, costUSD, latencyMs, signals, verdict, evidence[]}
  phases.json    # {phase, startedAt, endedAt, steps, costUSD, budgetUSD, outcome, exitGate, artifacts[]}
  artifacts/     # research.md · PRD.md · test-output tail · git diff --stat · pr-url.txt
```

`appendRecord` ([runlog.ts:187](file:///Users/linh.doan/work/harvey/freepeak/dsh-feature-loop/src/runlog.ts:187))
is reused verbatim — single `O_APPEND` line, concurrent-safe, no new dependency.
`RunRecord` is **extended**, never replaced (`phase`, `steps[]`, `phases[]`,
`evidenceDir`, `worktree`, `prUrl`), so `metrics.ts`, `envelope.ts` and
`optimize.ts` keep reading the same file.

### 6.2 The rule that makes it trustworthy

**A step with no artifact cannot be reported as a success.** A write step that
produced no captured artifact is recorded `verified: false`; `phases.json` carries
the count; `REPORT.md` prints *"3 unverified steps"* rather than rounding up to
green.

This is the book's central warning made into a check: *"Engineers who evaluate a
loop agent by checking only the final output miss the 80% of failures that happen
in intermediate steps. A correct final answer with a broken trajectory is a
ticking time bomb in production"* (p23). An evidence bundle that can render green
on an unverified run is that bomb, with a nicer font.

### 6.3 Trajectory, not outcome

Each step line carries tool, args-key, error flag, latency, cost and signals —
the trace shape Ch11 mandates (p126–129). That yields the book's 5-step
diagnosis protocol (p138: outcome → divergence step → root-cause class →
7-day lookback → recommended fix) with **no tracing backend**, honouring p125's
*"Do not use more than one tracing platform."* Single-user local deployment does
not need Langfuse; `steps.jsonl` is the replay artifact, and every number is
readable offline years later.

---

## 7. Ship

Ship means **branch + pull request**, and that is a deliberate scope decision
(§10).

1. `git add -A` scoped to the worktree; `git commit` carrying the task slug.
2. `git push -u origin fl/<slug>`.
3. `gh pr create --body-file` with a body assembled from the PRD, the evidence
   summary and the per-phase budget table — so the PR explains itself.

Every command goes through one injected `run(cmd, args)` seam, so the exact argv
is asserted for all branches with no network and no git. A `gh` failure
**degrades, never swallows** (p154: every error is *recover+log / escalate /
degrade* — there is no fourth option): the commit survives and the run reports
*"PR not opened — the work is committed at `<sha>`"*.

---

## 8. Surface

The existing in-UI **Feature Loop** page
([`web/app.tsx`](file:///Users/linh.doan/work/harvey/freepeak/dsh-feature-loop/web/app.tsx)),
which the user already reaches. Additions:

- a **phase rail** — five stages, current highlighted, each with `spent / share`;
- a **mode toggle** on the Start control (Supervised · **YOLO**);
- a **Stop** button writing the kill-switch sentinel;
- an **Evidence link** per phase.

Every new `DashboardSnapshot` field is **optional**, preserving the module's
standing rule that absence must stay meaningful — a deployment that has measured
nothing serves no key, and the page renders nothing rather than confident zeros.

**Setup** gets `make install`: build → `dsh plugin --profile <name> add -w` →
`--dump-config` verification → **plus the peer-dependency assertion**. The README
warns twice that the plugin installs *inert* when `@deepseek-ai/dsh-llm` /
`dsh-typert-protocol` fail to resolve. An installer that reports success on an
inert plugin teaches the user a lie, so `make install` fails loudly on it.

---

## 9. Acceptance

The floor is the existing suite: **384 unit tests passing**, `tsc --noEmit`
clean, integration 11/11. New machinery adds:

| # | Criterion | Test |
|---|---|---|
| 1 | Every phase has a prompt, a named exit gate and a share; shares sum to 1 | `phases.test.ts` |
| 2 | Valid transitions pass; `TEST→IMPLEMENT` past 3 throws; terminals are terminal | `pipeline.test.ts` |
| 3 | A phase cannot borrow from another; a tiny phase ceiling stops on cost | `budget.test.ts` |
| 4 | The pre-call guard fires at 90% and reserves the final 10% | `budget.test.ts` |
| 5 | One `steps.jsonl` line per step, cost present, unverified steps render unverified | `evidence.test.ts` |
| 6 | A full simulated YOLO run records **zero** asks; all 8 forbidden operations denied; a path escaping the worktree denied; `STOP` flips the verdict | `yolo.test.ts` |
| 7 | Exact argv per ship branch; PR body carries PRD + budgets; `gh` failure degrades to "committed at `<sha>`" | `ship.test.ts` |

Plus one **live end-to-end run** on a scratch DSH profile against a throwaway
repo, recorded in `docs/evidence/` in the existing format, with a verdict line
against each of these criteria.

---

## 9a. Delivery status — read this before trusting §9

Every module, gate, budget, envelope and command in this document is written and
tested. **Three call sites are not**, and the pipeline therefore does not yet
complete a run:

| Written and tested | Not yet written |
|---|---|
| `phases.ts`, `pipeline.ts`, `phase-budget.ts`, `evidence.ts`, `yolo.ts`, `sandbox.ts`, `ship.ts` | the code that fills a `PhaseObservation` from the filesystem and from your test command |
| `evaluateGate`, `transition`, `PhaseAllocator.verdict`, `preCallGuard`, `envelope`, `createSandbox`, `ship`, `renderReport` | the hook that evaluates the gate and calls `transition()` |
| the phase rail on the page; `make install` | the caller that invokes `ship()` at the end of a phase |
| the pre-call budget guard, the kill switch, the worktree refusal | the caller that invokes `createSandbox()` before a run |

Today a `pipeline.enabled` deployment starts in `research`, is bounded by that
phase's own ceiling and wall clock, prices every step, and cannot pass its own
gate — so it stops rather than proceeding on an unverified result. That is the
fail-closed direction and it is deliberate, but it is not a working pipeline.

The safety consequence of the missing sandbox caller is the one to hold onto:
**with no worktree, `gateMode: auto` denies every write.** Containment with
nothing to contain against is not containment, so the envelope refuses rather
than defaulting to open. YOLO is therefore not usable end to end yet — it will
not silently write to your checkout, which is the property that matters while it
is incomplete.

No end-to-end run has been performed. Every claim in this document comes from
unit tests and a typecheck. The evidence pack at
`docs/evidence/local-loop-20260930-214354/` is the hand-built precedent; a
generated one from a real five-phase run is the next artifact to produce.

---

## 10. Non-goals

Deliberately excluded, with reasons:

- **Not a second application.** One surface, the page that exists. A separate
  app is a later decision, not a prerequisite.
- **Not npm publish or deploy.** Ship stops at a PR. Publishing is irreversible
  and belongs behind a human.
- **Not an eval suite.** Ch10's suite (50 cases, four categories, CI gate) is
  the right next product, but it is a different artifact. This change produces
  the raw trajectories that a future REFINE loop consumes.
- **Not a tracing backend.** §6.3.
- **Not an agent-teams implementation.** Still orthogonal — see
  [`PRD.md`](PRD.md) §10.
- **Not replacing the supervised path.** YOLO is a mode; `ask` and `deny` keep
  working exactly as they do today.

---

## 11. Delivery

Eight PRs, each green on `make verify`, on `dsh/zero-to-one`:

1. this PRD · 2. phases + machine · 3. phase budgets + the pre-call fix ·
4. evidence · 5. YOLO envelope + sandbox + kill switch · 6. ship ·
7. surface · 8. installer + docs
