/**
 * The HITL dashboard page, as one self-contained string.
 *
 * Why a string and not an `.html` asset: `package.json`'s `files` list is a
 * closed published payload and the plugin loads the *built* `lib/index.mjs`,
 * while the test suite runs the very same modules from `src/` under
 * `--experimental-strip-types`. A file asset would need a build copy step and a
 * dual-path read that resolves differently in those two environments; a string
 * is bundled by tsdown automatically and behaves identically in both.
 *
 * Deliberately dependency-free — plain DOM, `EventSource`, `fetch`. This repo
 * has no UI toolchain, and building one to render three lists would be the
 * tail wagging the dog.
 *
 * **The page's own JavaScript must not use template literals or backticks**:
 * this module wraps the page in one, so an inner backtick or `${` would end
 * the string. String concatenation only.
 *
 * @module dsh-feature-loop/dashboard-page
 */

export const DASHBOARD_PAGE = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>feature-loop · HITL approvals</title>
<style>
  :root {
    --bg: #0f1115; --panel: #171a21; --border: #262b36; --text: #d7dce5;
    --muted: #8a93a3; --accent: #4c8dff; --ok: #2ea043; --bad: #d1495b;
    --warn: #d29922;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--text);
    font: 14px/1.5 ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  }
  header {
    display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
    padding: 14px 18px; border-bottom: 1px solid var(--border);
    background: var(--panel); position: sticky; top: 0; z-index: 2;
  }
  h1 { font-size: 16px; margin: 0 14px 0 0; font-weight: 650; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .06em;
       color: var(--muted); margin: 0 0 10px; }
  main { max-width: 980px; margin: 0 auto; padding: 18px; }
  section { margin-bottom: 26px; }
  .dot { width: 9px; height: 9px; border-radius: 50%; display: inline-block;
         background: var(--bad); }
  .dot.on { background: var(--ok); }
  .badge {
    font-size: 11px; padding: 2px 8px; border-radius: 999px;
    border: 1px solid var(--border); color: var(--muted);
  }
  .badge.answer { color: var(--ok); border-color: var(--ok); }
  .card {
    background: var(--panel); border: 1px solid var(--border);
    border-radius: 8px; padding: 12px 14px; margin-bottom: 10px;
  }
  .card .tool { font-weight: 650; font-size: 15px; }
  .card .meta { color: var(--muted); font-size: 12px; margin: 2px 0 8px; }
  .card .reason {
    white-space: pre-wrap; background: #10131a; border: 1px solid var(--border);
    border-radius: 6px; padding: 8px 10px; font-size: 13px; margin-bottom: 10px;
    max-height: 160px; overflow: auto;
  }
  .row { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
  button {
    font: inherit; border-radius: 6px; border: 1px solid var(--border);
    padding: 6px 14px; cursor: pointer; background: #1d2230; color: var(--text);
  }
  button:disabled { opacity: .45; cursor: default; }
  button.allow { background: var(--ok); border-color: var(--ok); color: #fff; }
  button.reject { background: transparent; border-color: var(--bad); color: var(--bad); }
  .empty { color: var(--muted); font-size: 13px; }
  .hint { color: var(--muted); font-size: 12.5px; }
  details summary { cursor: pointer; color: var(--muted); font-size: 12.5px; }
  details .hint { margin-top: 8px; }
  code { background: #10131a; padding: 1px 5px; border-radius: 4px; }
  .run { display: flex; gap: 18px; flex-wrap: wrap; align-items: baseline; }
  .run .k { color: var(--muted); font-size: 11.5px; text-transform: uppercase;
            letter-spacing: .05em; }
  .run .v { font-weight: 650; }
  .meter { width: 160px; height: 6px; background: #10131a; border-radius: 3px;
           overflow: hidden; border: 1px solid var(--border); }
  .meter > i { display: block; height: 100%; background: var(--accent); }
  .feed-item { display: flex; gap: 10px; padding: 5px 0;
               border-bottom: 1px solid #1a1e27; font-size: 13px; }
  .feed-item:last-child { border-bottom: 0; }
  .feed-item .t { color: var(--muted); white-space: nowrap;
                  font-variant-numeric: tabular-nums; }
  .feed-item .kind { color: var(--accent); white-space: nowrap; min-width: 66px; }
  .feed-item .kind.k-approval { color: var(--warn); }
  .feed-item .kind.k-gate { color: var(--bad); }
  .sig { font-size: 12px; margin: 3px 0; }
  .sig.critical { color: var(--bad); } .sig.warning { color: var(--warn); }
  #auth {
    display: none; background: #2a1418; border: 1px solid var(--bad);
    color: #f0c4c9; padding: 12px 14px; border-radius: 8px; margin-bottom: 16px;
  }
</style>
</head>
<body>
<header>
  <h1>feature-loop · HITL approvals</h1>
  <span id="conn" class="dot"></span><span id="conn-label" class="hint">connecting…</span>
  <span id="mode" class="badge"></span>
</header>
<main>
  <div id="auth">The dashboard token is missing or wrong. Open the URL printed by
  <code>make dashboard</code> (it carries <code>?token=…</code>), or the page is
  being served by a different boot than the one that issued the token.</div>

  <section>
    <h2>Pending approvals</h2>
    <div id="pending"></div>
    <details>
      <summary>Nothing here when you expected a request?</summary>
      <div class="hint">Almost always the permission preset: a session started
      under <code>danger-full-access</code> has approval policy <code>never</code>,
      so an <code>ask</code> is refused before any UI — this dashboard, the
      composer panel, everything. Start the session under
      <code>workspace-write</code> (or run the container, which pins it). See
      <code>docs/RUNBOOK-SERVER.md</code> §2.5. Also note
      <code>gateMode: deny</code> refuses outright and never asks.</div>
    </details>
  </section>

  <section>
    <h2>Run state</h2>
    <div id="runs"></div>
    <p class="hint">Spend is not metered on the plugin path (Phase 2b), so
    <code>spent</code> can legitimately read zero; <code>maxSteps</code> is the
    trustworthy ceiling.</p>
  </section>

  <section>
    <h2>Activity</h2>
    <div id="feed"></div>
  </section>
</main>
<script>
(function () {
  'use strict';
  var params = new URLSearchParams(location.search);
  var q = params.get('token');
  if (q) { sessionStorage.setItem('fl-dash-token', q); }
  var TOKEN = q || sessionStorage.getItem('fl-dash-token') || '';
  var last = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined && text !== null) n.textContent = String(text);
    return n;
  }
  function api(path, opts) {
    opts = opts || {};
    opts.headers = Object.assign({}, opts.headers, { 'X-Dashboard-Token': TOKEN });
    return fetch(path, opts);
  }
  function clock(t) {
    var d = new Date(t);
    function p(n) { return (n < 10 ? '0' : '') + n; }
    return p(d.getHours()) + ':' + p(d.getMinutes()) + ':' + p(d.getSeconds());
  }
  function age(ms) {
    if (ms < 1000) return '<1s';
    var s = Math.floor(ms / 1000);
    if (s < 60) return s + 's';
    return Math.floor(s / 60) + 'm' + (s % 60) + 's';
  }
  function setConn(ok, label) {
    var dot = document.getElementById('conn');
    dot.className = ok ? 'dot on' : 'dot';
    document.getElementById('conn-label').textContent = label;
  }

  function decide(id, outcome, button) {
    button.disabled = true;
    api('/api/approvals/' + encodeURIComponent(id), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outcome: outcome })
    }).then(function (r) {
      if (r.status === 401 || r.status === 403) { showAuth(true); return null; }
      return r.json().then(function () {
        if (!r.ok) { load(); }  // 409: someone else settled it — resync.
      });
    }).catch(function () { load(); });
  }

  function showAuth(on) {
    document.getElementById('auth').style.display = on ? 'block' : 'none';
  }

  function renderPending(list) {
    var box = document.getElementById('pending');
    box.textContent = '';
    if (!list || list.length === 0) {
      box.appendChild(el('p', 'empty', 'No pending approval requests.'));
      return;
    }
    list.forEach(function (p) {
      var card = el('div', 'card');
      card.appendChild(el('div', 'tool', p.toolName));
      var meta = (p.runId || 'agentless') +
        (p.callId ? ' · ' + p.callId : '') +
        ' · waiting ' + age(Date.now() - (p.askedAt || Date.now()));
      card.appendChild(el('div', 'meta', meta));
      if (p.reason) card.appendChild(el('div', 'reason', p.reason));
      var row = el('div', 'row');
      var allow = el('button', 'allow', 'Allow once');
      allow.addEventListener('click', function () { decide(p.id, 'allowed-once', allow); });
      var reject = el('button', 'reject', 'Reject');
      reject.addEventListener('click', function () { decide(p.id, 'rejected', reject); });
      row.appendChild(allow);
      row.appendChild(reject);
      card.appendChild(row);
      box.appendChild(card);
    });
  }

  function renderRuns(runs) {
    var box = document.getElementById('runs');
    box.textContent = '';
    if (!runs || runs.length === 0) {
      box.appendChild(el('p', 'empty', 'No run has reported yet.'));
      return;
    }
    runs.forEach(function (r) {
      var card = el('div', 'card');
      var row = el('div', 'run');
      function pair(k, v) {
        var w = el('div');
        w.appendChild(el('div', 'k', k));
        w.appendChild(el('div', 'v', v));
        row.appendChild(w);
      }
      pair('run', r.runId);
      var steps = (r.step === undefined ? '—' : r.step) +
        (r.maxSteps === undefined ? '' : ' / ' + r.maxSteps);
      pair('steps', steps);
      if (r.step !== undefined && r.maxSteps) {
        var meter = el('div', 'meter');
        var fill = el('i');
        fill.style.width = Math.min(100, Math.round(100 * r.step / r.maxSteps)) + '%';
        meter.appendChild(fill);
        row.appendChild(meter);
      }
      var spent = r.spentUSD === undefined ? '—' : '$' + r.spentUSD.toFixed(4);
      if (r.budgetUSD !== undefined) { spent += ' / $' + r.budgetUSD.toFixed(2); }
      pair('spend (unmetered)', spent);
      if (r.unpricedSteps) { pair('unpriced steps', r.unpricedSteps); }
      if (r.route) { pair('route', r.route); }
      if (r.judgeScore !== undefined && r.judgeScore !== null) {
        pair('judge', r.judgeScore + ' / 3');
      }
      card.appendChild(row);
      (r.signals || []).forEach(function (s) {
        card.appendChild(el('div', 'sig ' + s.severity,
          '[' + s.severity + '] ' + s.kind + ' @ step ' + s.step + ' — ' + s.detail));
      });
      box.appendChild(card);
    });
  }

  function renderFeed(feed) {
    var box = document.getElementById('feed');
    box.textContent = '';
    if (!feed || feed.length === 0) {
      box.appendChild(el('p', 'empty', 'Nothing yet.'));
      return;
    }
    feed.slice().reverse().forEach(function (f) {
      var item = el('div', 'feed-item');
      item.appendChild(el('span', 't', clock(f.t)));
      item.appendChild(el('span', 'kind k-' + f.kind, f.kind));
      item.appendChild(el('span', '', f.text));
      box.appendChild(item);
    });
  }

  function render(state) {
    last = state;
    document.getElementById('mode').textContent = state.answers
      ? 'dashboard answers approvals when open'
      : 'observe-only (composer panel answers)';
    document.getElementById('mode').className =
      'badge' + (state.answers ? ' answer' : '');
    renderPending(state.pending);
    renderRuns(state.runs);
    renderFeed(state.feed);
  }

  function load() {
    api('/api/state').then(function (r) {
      if (r.status === 401 || r.status === 403) { showAuth(true); return null; }
      showAuth(false);
      return r.json().then(render);
    }).catch(function () { setConn(false, 'server unreachable'); });
  }

  // Re-render ages so a request that has been waiting a while says so.
  setInterval(function () { if (last) { renderPending(last.pending); } }, 5000);

  // One EventSource: it reconnects on its own; onopen refetches the snapshot so
  // nothing missed while disconnected is lost.
  var es = new EventSource('/api/events?token=' + encodeURIComponent(TOKEN));
  es.onopen = function () { setConn(true, 'live'); showAuth(false); load(); };
  es.onmessage = function (ev) {
    try { showAuth(false); render(JSON.parse(ev.data)); }
    catch (e) { /* a malformed frame must not kill the page; next frame retries */ }
  };
  es.onerror = function () { setConn(false, 'reconnecting…'); };
})();
</script>
</body>
</html>
`
