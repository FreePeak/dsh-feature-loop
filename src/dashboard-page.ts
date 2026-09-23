/**
 * The HITL dashboard page shell, as one self-contained string.
 *
 * The shell does three things and nothing else: it declares the vendored
 * stylesheets, it bootstraps the auth token plus the first snapshot into
 * `window` globals, and it appends the vendored React bundle. Every pixel
 * after that is rendered by `web/app.tsx`.
 *
 * Why the shell is still a string while the app is a vendored file:
 * `package.json`'s `files` list is a closed published payload and the test
 * suite runs the very same modules from `src/` under
 * `--experimental-strip-types`, so anything that must work identically in
 * both environments is easier as a string (bundled by tsdown automatically)
 * than as an asset with a dual-path read. The React bundle is the opposite
 * case: it is a build artifact, so it lives in `assets/` where you can read
 * exactly what the page will run.
 *
 * **This module's inline script must not use template literals or backticks**:
 * the whole page is wrapped in one here, so an inner backtick or `${` would
 * end the string. String concatenation only.
 *
 * @module dsh-feature-loop/dashboard-page
 */

export const DASHBOARD_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>feature-loop · HITL approvals</title>
<link rel="stylesheet" nonce="__CSP_NONCE__" href="/assets/shell.css">
<link rel="stylesheet" nonce="__CSP_NONCE__" href="/assets/dashboard.css">
</head>
<body>
<a class="skip-link" href="#approvals">Skip to approvals</a>
<header>
  <div class="brand">
    <h1>feature-loop</h1>
    <span class="sep" aria-hidden="true">·</span>
    <span class="product">HITL approvals</span>
  </div>
  <div class="header-meta">
    <span class="conn-wrap">
      <span id="conn" class="dot"></span>
      <span id="conn-label" class="hint">connecting…</span>
    </span>
    <span id="mode" class="badge"></span>
    <span id="pending-count" class="badge badge-pending" role="status" aria-live="polite" data-count="0"></span>
  </div>
</header>
<main>
  <div id="auth">The dashboard token is missing or wrong. Open the URL printed by
  <code>make dashboard</code> (it carries <code>?token=…</code>), or the page is
  being served by a different boot than the one that issued the token.</div>
  <div id="root"><p class="empty">Loading…</p></div>
  <details class="help">
    <summary>Nothing here when you expected a request?</summary>
    <div class="hint">Almost always the permission preset: a session started
    under <code>danger-full-access</code> has approval policy <code>never</code>,
    so an <code>ask</code> is refused before any UI — this dashboard, the
    composer panel, everything. Start the session under
    <code>workspace-write</code> (or run the container, which pins it). See
    <code>docs/RUNBOOK-SERVER.md</code> §2.5. Also note
    <code>gateMode: deny</code> refuses outright and never asks.</div>
  </details>
</main>
<script nonce="__CSP_NONCE__">
(function () {
  'use strict';
  // Bootstrap only: fetch the first snapshot, stash it with the token, then
  // load the app. Doing the first read here rather than in React means a
  // wrong token surfaces as a visible message instead of a blank page.
  var params = new URLSearchParams(location.search);
  var q = params.get('token');
  if (q) { sessionStorage.setItem('fl-dash-token', q); }
  var TOKEN = q || sessionStorage.getItem('fl-dash-token') || '';
  function setConn(ok, label) {
    var dot = document.getElementById('conn');
    if (dot) dot.className = ok ? 'dot on' : 'dot';
    var el = document.getElementById('conn-label');
    if (el) el.textContent = label;
  }
  function showAuth(on) {
    document.getElementById('auth').style.display = on ? 'block' : 'none';
  }
  var xhr = new XMLHttpRequest();
  xhr.open('GET', '/api/state?token=' + encodeURIComponent(TOKEN));
  xhr.onload = function () {
    if (xhr.status === 401 || xhr.status === 403) { showAuth(true); return; }
    if (xhr.status !== 200) { setConn(false, 'server unreachable'); return; }
    showAuth(false);
    var snapshot;
    try { snapshot = JSON.parse(xhr.responseText); }
    catch (e) { setConn(false, 'server unreachable'); return; }
    window.__FL_DASHBOARD_SNAPSHOT__ = snapshot;
    window.__FL_DASHBOARD_TOKEN__ = TOKEN;
    var mode = document.getElementById('mode');
    if (mode) {
      mode.textContent = snapshot.answers
        ? 'dashboard answers approvals when open'
        : 'observe-only (composer panel answers)';
      mode.className = 'badge' + (snapshot.answers ? ' answer' : '');
    }
    var pc = document.getElementById('pending-count');
    if (pc) {
      pc.textContent = snapshot.pending && snapshot.pending.length
        ? snapshot.pending.length + ' pending'
        : 'idle';
      pc.setAttribute('data-count', String(snapshot.pending ? snapshot.pending.length : 0));
    }
    var s = document.createElement('script');
    s.src = '/assets/dashboard.js';
    s.setAttribute('nonce', '__CSP_NONCE__');
    s.onerror = function () { setConn(false, 'bundle failed to load'); };
    document.body.appendChild(s);
    setConn(true, 'live');
  };
  xhr.onerror = function () { setConn(false, 'server unreachable'); };
  xhr.send();
})();
</script>
</body>
</html>
`
