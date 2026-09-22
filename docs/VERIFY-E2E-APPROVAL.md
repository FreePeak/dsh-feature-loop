# END-TO-END — a human approved a gated step in the real Web UI

**Status: PASS. Observed in a real browser, on the containerised deployment.**

This closes the last link of the human-in-the-loop objective. Every prior
verification covered something *behind* the panel; this one drives the panel
itself and clicks the button.

---

## What was run

Deployment: the Docker image from `docker/Dockerfile`, started with the gateway
key and a named volume.

```bash
docker run -d --name dsh-feature-loop -v dsh-fl-data:/data \
  -p 127.0.0.1:3090:8099 \
  -e ONEGW_API_KEY=... \
  -e ONEGW_BASE_URL=http://host.docker.internal:8080/v1 \
  dsh-feature-loop:local
```

Driver: Playwright (`playwright-core` 1.63) against **system Chrome** via
`chromium.launch({ channel: 'chrome' })`, with `locale: 'en-US'` so the panel's
button labels match. The harness's own browser specs cannot launch here — they
expect `chromium_headless_shell-1228`, which the cached `chromium-1228` does not
provide (see `E2E-BROWSER-PLAN.md`); `channel: 'chrome'` works.

Flow: dismiss the Internal Testing Notice → "Configure later" on the API-key gate
→ choose the Home directory as the workspace → type the task → press Enter.

Task: *"Create a file named proof.txt in the workspace containing the single word
hello. Then confirm it exists."*

## Result — the panel

The composer was replaced by the approval panel, and its text is **this plugin's
own gate output**:

```
Waiting for approval
REVIEW REQUESTED (policy): write: irreversible needs a confidence estimate and
none was available — asking rather than guessing. A human should review this
before the loop goes further. Do not start work that depends on it; if the step
was not consistent with the goal, stop and report what you have instead.
Reject
Allow once
```

Asserted programmatically:

```
panel carries the feature-loop reason ("REVIEW REQUESTED"): true
Allow once button: 1 | Reject button: 1
```

That reason string exists nowhere in the harness — `grep -rl "REVIEW REQUESTED" $DSH`
returns nothing — so its presence in the panel proves the text came from this
plugin through the real delivery path, not from a coincidental DSH message.

## Result — the click

The script then clicked **Allow once**, acting as the human:

```
>>> CLICKING "Allow once" (acting as the human)
panel still visible: 0
transcript tail: ... Worked | Took 6s | Created proof.txt in the workspace,
containing the single word hello. Confirmed by reading it back — 1 line,
content hello. | 1 turns 3 steps
```

And the write **actually happened** — this is the part that makes it a real
approval rather than a UI animation:

```bash
$ docker exec dsh-feature-loop find / -name proof.txt -not -path '/proc/*'
/root/proof.txt
$ docker exec dsh-feature-loop cat /root/proof.txt
hello
```

Pre-check before the run: `proof.txt` was absent. The tool was blocked by the
gate, the human approved, the tool ran, the file exists with the expected
content.

## The full chain, now observed rather than inferred

| Link | Evidence |
|---|---|
| Gate decides `ask` before dispatch | panel appeared; no write happened first (`proof.txt` absent pre-approval) |
| The reason is this plugin's | `REVIEW REQUESTED (policy): write: irreversible needs a confidence estimate...` |
| DSH routes it to the approval seam | panel rendered by `client-ui-approval` in the composer |
| A human approves | script clicked **Allow once** |
| The approval releases the tool | `/root/proof.txt` created, content `hello` |
| The run continues | model reported the result; 3 steps, 1 turn |

## The reject path — also run, in the browser

A second run of the same flow clicked **Reject** instead. The panel appeared with
the same plugin reason, and:

```
>>> CLICKING "Reject" (acting as the human)
panel still visible: 0
transcript tail: ... I don't have your approval to create the file, so
reject-proof.txt does not exist. Nothing was written to the workspace. | If you'd
like me to proceed, re-run this and approve the write, or tell me a different
target path/name. | 2 steps
```

```bash
$ docker exec dsh-feature-loop ls /root/reject-proof.txt
reject-proof.txt ABSENT — the refusal blocked the write (correct)
$ docker exec dsh-feature-loop cat /root/proof.txt      # the approved run, still there
hello
```

So the two buttons produce two different, correct outcomes on the same prompt:
**Allow once → the file is written; Reject → nothing is written and the model
says so.** The approved artifact is still intact afterwards, so the refusals and
approvals are per-request and do not interfere.

## What this does and does not establish

**Established:** the human-approval loop works end to end in the real Web UI on
the containerised deployment — ask, render, **approve → executes**, **reject →
blocks**, and the run continues in both cases.

**Not established:**

- **A human other than the script clicked.** Clicks were automated; what is
  proven is that both buttons work and carry through, not that a person found the
  UI discoverable. (Though the flow *was* genuinely non-obvious to script: three
  gates — the testing notice, the API-key prompt, the workspace chooser — stand
  between login and a usable composer.)
- **Session-log persistence in this container.** The approved write is the
  evidence here; the durable `approval/asked` + `approval/decided` events that
  `VERIFY-SDK-RUN.md` captured were not found on the volume, so the audit trail
  through the *web* path is unverified.
- **`costBudgetUSD`** still measures zero — only `maxSteps` is trustworthy.

## Reproducing

The driver is intentionally not committed: it hardcodes an onboarding flow that
will drift, and the container port is a local detail. The steps are in
`E2E-BROWSER-PLAN.md` (selectors, launch call, auth) plus the flow above. The
selectors that matter:

| Element | Selector |
|---|---|
| Approval panel | `[data-approval-key]` |
| Allow | `panel.getByRole('button', { name: 'Allow once' })` |
| Reject | `panel.getByRole('button', { name: 'Reject' })` |
| Composer | `[data-composer-input]` |
| Submit | `composer.press('Enter')` |

One trap worth recording: **a composer element exists before a workspace is
chosen, but it is inert.** A run that keys off "is the composer present?" will
type into it, submit nothing, and then wait forever for a panel that was never
requested. Key off the UI's own `Choose a workspace to start` prompt instead.
