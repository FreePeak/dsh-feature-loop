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

// React is EXTERNAL, and deliberately so. The DSH web shell already runs a
// React; bundling a second copy would give the dashboard its own reconciler,
// its own context and its own hooks cache — which does not render reliably
// inside someone else's tree. The harness hands us its `require`, and the
// factory below closes over it.
const result = buildSync({
  entryPoints: [join(root, 'web/entry.tsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  globalName: '__flPlugin',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  // The designed shell's CSS rides inside the bundle: the dashboard is a page
  // of the DSH UI now, so there is no second origin to fetch a stylesheet from.
  loader: { '.css': 'text' },
  external: ['react', 'react-dom', 'react-dom/client'],
  // Production React: without this, esbuild leaves NODE_ENV reads that
  // resolve to development React (slower, and dev-only warnings on a page
  // an operator is using during an incident).
  define: { 'process.env.NODE_ENV': '"production"' },
  write: false,
  logLevel: 'info',
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
