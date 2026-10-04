#!/usr/bin/env node
/**
 * Build the dashboard's vendored assistant-ui bundle.
 *
 * Input:  web/app.tsx (React shell + assistant-ui runtime + approval card)
 * Output: assets/assistant-ui/{dashboard.js,dashboard.css,shell.css,MANIFEST.txt}
 *
 * Vendored, not built at install or at runtime: the published payload
 * (`package.json` `files`) ships the artifacts, the dashboard serves them
 * from its own origin, and nothing builds in the container or on CI beyond
 * this script. Rebuild with `make dashboard-bundle` after touching `web/` or
 * the assistant-ui dependencies, and commit the result.
 *
 * Why vendored at all, given assistant-ui is a normal npm dependency: the
 * page that can authorise a tool call must run code served from its own
 * origin under a `default-src 'none'` CSP, and the published package is a
 * plugin payload rather than a bundler target. A committed artifact keeps
 * that property auditable — you can read exactly what the page runs.
 */
import { createHash } from 'node:crypto'
import { buildSync } from 'esbuild'
import { copyFileSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'assets/assistant-ui')
mkdirSync(outDir, { recursive: true })

// assistant-ui ships precompiled Tailwind v4 output, so no Tailwind toolchain
// is needed — the stylesheet is consumed verbatim. It MUST be refreshed before
// the bundle runs, because the entry inlines it: copy afterwards and the
// artifact silently carries the previous build's CSS.
copyFileSync(
  join(root, 'node_modules/@assistant-ui/styles/dist/styles/index.css'),
  join(outDir, 'dashboard.css'),
)
copyFileSync(join(root, 'web/shell.css'), join(outDir, 'shell.css'))

/**
 * One esbuild pass, shared by both targets.
 *
 * The two entries differ in ONE thing that matters — whether React is external
 * — and keeping the rest in a single literal is what stops `platform`, `target`
 * or `jsx` drifting between a page inside the harness and a page in its own
 * browser. The host page must NOT bundle React (a second reconciler inside the
 * harness's tree does not render reliably); the loopback page has no other
 * React, so it must.
 */
const BASE = {
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  // The designed shell's CSS rides inside the bundle: the dashboard is a page
  // of the DSH UI now, so there is no second origin to fetch a stylesheet from.
  loader: { '.css': 'text' },
  // Production React: without this, esbuild leaves NODE_ENV reads that
  // resolve to development React (slower, and dev-only warnings on a page
  // an operator is using during an incident).
  define: { 'process.env.NODE_ENV': '"production"' },
  logLevel: 'info',
}

/**
 * React is EXTERNAL for the host entry, and deliberately so. The DSH web shell
 * already runs a React; bundling a second copy would give the dashboard its own
 * reconciler, its own context and its own hooks cache — which does not render
 * reliably inside someone else's tree. The harness hands us its `require`, and
 * the factory below closes over it.
 */
const result = buildSync({
  ...BASE,
  entryPoints: [join(root, 'web/entry.tsx')],
  globalName: '__flPlugin',
  external: ['react', 'react-dom', 'react-dom/client'],
  write: false,
})

/**
 * The standalone page's bundle: `assets/assistant-ui/dashboard.js`, served by the
 * opt-in loopback server (`dashboard.standalone: true`) and mounted by the page
 * shell's `#root`.
 *
 * It had no builder between `633c1e2` (which repointed this file at
 * `web/entry.tsx` and dropped the `outfile` line, keeping the artefact for the
 * standalone opt-in) and now — so the loopback page served a component set
 * frozen at `3973e3a`, with no metrics pane and no proposals pane. Written to
 * disk directly rather than through `outputFiles`, because unlike the host
 * entry this one is LOADED as a plain script tag and must not be wrapped in the
 * `__ModuleLoader__` factory: there is no module loader in a bare browser.
 */
const standalone = buildSync({
  ...BASE,
  entryPoints: [join(root, 'web/standalone.tsx')],
  // No `globalName`: nothing reads this bundle's exports. The IIFE mounts
  // itself through `createRoot`, exactly as the pre-fold `web/app.tsx` did.
  outfile: join(outDir, 'dashboard.js'),
})

// The harness loads a client file that REGISTERS itself through the published
// `window.__ModuleLoader__` protocol — the same shape the harness's own
// in-repo fixtures use, and what the previous hand-written `client.js` did.
// The bundle is wrapped in that factory, with the host's `require` in scope
// for the externals above.
const [output] = result.outputFiles
writeFileSync(join(root, 'client.js'), [
  'window.__ModuleLoader__.load({',
  "  id: '@freepeak/dsh-feature-loop',",
  '  factory(require) {',
  output.text.replace(/^var __flPlugin = /, '__flPlugin = '),
  '    return __flPlugin.default || __flPlugin;',
  '  },',
  '});',
  '',
].join('\n'))

// assistant-ui ships precompiled Tailwind v4 output, so no Tailwind toolchain
// is needed — the stylesheet is copied verbatim like any other asset.
copyFileSync(
  join(root, 'node_modules/@assistant-ui/styles/dist/styles/index.css'),
  join(outDir, 'dashboard.css'),
)
copyFileSync(join(root, 'web/shell.css'), join(outDir, 'shell.css'))

const js = readFileSync(join(root, 'client.js'), 'utf8')
const kb = (path) => `${String(Math.round(statSync(path).size / 1024))} KB`
/**
 * A content hash, for the staleness check in `test/assistant-ui.test.ts`.
 *
 * Added because the size it replaced could not see the failure it was added
 * for: commit `c57f2d8` changed `web/app.tsx`'s rendering (a brief that was
 * never enabled was showing a red "unavailable" line on every card) and
 * shipped WITHOUT a rebuild, and `client.js` changed by two lines inside a
 * 462 kB bundle — which rounds to the same kB, so the size check passed and
 * the committed artefact did not contain the fix.
 *
 * It is a hash of the SOURCE the bundle is built from, not of the artefact:
 * the question is "does this bundle correspond to these sources", and hashing
 * the artefact could only tell you it is not self-inconsistent. Eight lines of
 * git, no dependency, and it fails on the first character of any change.
 */
const SOURCE_INPUTS = [
  // BOTH entries, because both produce a committed artefact and the staleness
  // check below is the only thing that notices when either drifts from source.
  // `web/standalone.tsx` was missing from this list for the whole of §1cf, which
  // is how the loopback page's bundle froze without a failure.
  'web/entry.tsx', 'web/standalone.tsx', 'web/app.tsx', 'web/plugin.css',
  'web/shell.css', 'web/start-target.ts',
]
/** One hash over every source input, in a fixed order. */
const sha256OfInputs = () => createHash('sha256')
  .update(SOURCE_INPUTS.map((f) => readFileSync(join(root, f))).join('\u0000'))
  .digest('hex')
  .slice(0, 16)

/**
 * The load-bearing assertion of this build.
 *
 * `assistant-cloud` is a dependency of `@assistant-ui/react` and ships
 * engagement/run reporters. It tree-shakes out of this bundle today, but
 * "today" is the whole problem: a future import could put a phone-home on
 * the page that approves tool calls, and nothing else in the repo would
 * notice. So the build refuses to produce an artifact that carries it.
 */
const FORBIDDEN = [
  'CloudEngagementReporter',
  'CloudRunReporter',
  'assistant-cloud',
  'posthog',
  'telemetry',
]
const found = FORBIDDEN.filter((needle) => js.includes(needle))
if (found.length > 0) {
  throw new Error(
    `dashboard bundle carries telemetry/cloud code (${found.join(', ')}) — `
    + 'the approval page must not phone home. Check what pulled it in.',
  )
}

const pkg = (name) => JSON.parse(
  readFileSync(join(root, 'node_modules', name, 'package.json'), 'utf8'),
).version

writeFileSync(
  join(outDir, 'MANIFEST.txt'),
  [
    `built: ${new Date().toISOString()}`,
    'entry: web/entry.tsx (dashboard + settings, mounted as a DSH UI page)',
    `client.js: ${kb(join(root, 'client.js'))}`,
    // The sources this bundle is built FROM, hashed. A staleness check reads
    // this line; see `sha256` above for why it is a hash and not a size.
    `sources-sha256: ${sha256OfInputs()}`,
    `react: ${pkg('react')}`,
    `react-dom: ${pkg('react-dom')}`,
    `assistant-ui/react: ${pkg('@assistant-ui/react')}`,
    `assistant-ui/styles: ${pkg('@assistant-ui/styles')}`,
    `dashboard.js: ${kb(join(outDir, 'dashboard.js'))}`,
    `dashboard.css: ${kb(join(outDir, 'dashboard.css'))}`,
    'checked: no assistant-cloud / telemetry code in dashboard.js',
    'library: assistant-ui primitives + our own approval card (src/approval-bridge.ts)',
  ].join('\n') + '\n',
)
console.log('dashboard bundle written to assets/assistant-ui/ (no telemetry found)')
