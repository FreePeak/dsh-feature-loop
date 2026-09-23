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

buildSync({
  entryPoints: [join(root, 'web/app.tsx')],
  bundle: true,
  minify: true,
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  // Production React: without this, esbuild leaves NODE_ENV reads that
  // resolve to development React (slower, and dev-only warnings on a page
  // an operator is using during an incident).
  define: { 'process.env.NODE_ENV': '"production"' },
  outfile: join(outDir, 'dashboard.js'),
  logLevel: 'info',
})

// assistant-ui ships precompiled Tailwind v4 output, so no Tailwind toolchain
// is needed — the stylesheet is copied verbatim like any other asset.
copyFileSync(
  join(root, 'node_modules/@assistant-ui/styles/dist/styles/index.css'),
  join(outDir, 'dashboard.css'),
)
copyFileSync(join(root, 'web/shell.css'), join(outDir, 'shell.css'))

const js = readFileSync(join(outDir, 'dashboard.js'), 'utf8')
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
