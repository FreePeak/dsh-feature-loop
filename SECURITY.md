# Security Policy

## Supported versions

This project is pre-1.0. The only supported line is `0.1.x` on the `main`
branch. Fixes land on `main`; there are no maintenance branches, and no
backports to older pre-1.0 versions.

| Version | Supported |
|---|---|
| `0.1.x` (`main`) | Yes |
| Anything else | No |

## Reporting a vulnerability

Report privately through GitHub's private vulnerability reporting: open the
repository's **Security** tab and choose **Report a vulnerability**. That
channel is private between you and the maintainer; a public issue is not a
substitute, because a public issue discloses the problem before there is a fix.

Please include what you need to make the report actionable: the affected
version or commit, the smallest reproduction you have, and what you believe the
impact is. A rough reproduction is more useful than a perfect one that never
arrives.

## What to expect

This is a small project with one maintainer, and the honest expectation is
sized to that:

- **Acknowledgement** within a few days of the report.
- **An assessment** — whether it is a security issue, what the impact is, and
  whether a fix is coming — shortly after that.
- **A fix** as soon as it can be written and tested. There is no response-time
  SLA and no bug bounty.

If you get no acknowledgement after about a week, it is reasonable to assume
the report was missed rather than ignored, and to follow up on the same private
report.

## Security-relevant design

The loop executes model-chosen commands. That is the whole reason the sandbox
and the review gate exist: the model's tool calls are not trusted input. Four
behaviours below are deliberate, and a change that weakens any of them is a
security issue rather than a bug.

### Path confinement

`src/tools.ts` confines every file operation to one sandbox root. Model-supplied
paths go through `resolveInRoot`, which runs two checks rather than one because
one check is not enough:

- A **lexical** check (`path.resolve`) defeats `../..` traversal and absolute
  paths such as `/etc/passwd`.
- A **`fs.realpath`** check defeats symlink escapes. It resolves the *deepest
  existing ancestor* rather than the path itself, because on a write the leaf
  usually does not exist yet while the smuggling symlink already does.

`list_files` deliberately neither follows nor lists symlinks, since a symlink to
a directory outside the root would otherwise let the loop enumerate the outside
tree.

This confinement applies to the standalone tool layer used by the runner and the
CLI. In the DSH plugin path, file operations go through the harness's own tools.

A path that escapes the root — by traversal, absolute path, or symlink — is
meant to throw, not to be sanitised into something inside the root. A bypass of
any of these three is a security issue; report it.

### Fail-closed defaults

The review gate (`src/review.ts`) has two defaults that fail closed, and both
are intentional:

- **An unclassified tool is treated as `irreversible`**, which is
  `always-approve`. Forgetting to classify a tool must not be the way an action
  gets waved through.
- **A missing confidence estimate means ask, not proceed.** When the judge
  returns no score, the gate raises a review with the reason that no confidence
  estimate was available, rather than assuming the step is fine.

Changing either default so that it fails *open* — an unknown tool auto-approved,
or an absent confidence treated as clearing the bar — is a security issue.

### The judge is fail-soft, but never silently passing

The judge (Laya over onegw, or a chat model as fallback) is an optimisation, not
a dependency. If it is slow, unreachable, or returns nonsense, the loop keeps
running on the six deterministic detectors and *records* that the judge was
unavailable. It does not fail closed on a judge outage, because a local model's
downtime should not stop your work.

The other half of that rule matters more: an absent score means "the judge did
not answer", never "the step is fine". `undefined` reaches the router rather
than a substituted zero, and `NO_JUDGE` is always explicitly unavailable. A
change that lets a failed judge call read as a passing verdict is a security
issue.

### Ceilings are enforced before the model call

Step and cost ceilings are checked before the expensive call is made, so a
ceiling is a limit rather than an invoice. A path that spends a call before
consulting the ceiling is a bug worth reporting, not only a cost problem.

## Out of scope

The `demo/` directory is a fixture. It contains a deliberately planted bug (a
nearest-rank off-by-one in `demo/src/latency-window.ts`) and its own test suite,
some of which is expected to fail until the loop fixes the bug. Its code is not
shipped — `package.json` publishes only `lib/` and the generated types. Do not
report the planted bug, or anything else in `demo/`, as a vulnerability.

## Known limits that are not vulnerabilities

These are documented limits, not undisclosed problems. They are listed here so a
report about them can be answered quickly:

- **`run_tests` timeouts kill the direct child, not grandchildren.** A command
  that spawns its own children can outlive the timeout. It is marked
  `ponytail:` in `src/tools.ts`; the upgrade path is a detached spawn plus
  `kill(-pid)`.
- **The price table is an estimate.** The rates configured in `cli.ts` are
  illustrative and exist so the cost ceiling has something to measure against.
  An inaccurate price is a budgeting issue, not a security one.
