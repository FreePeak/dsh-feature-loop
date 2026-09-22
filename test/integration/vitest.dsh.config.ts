/**
 * vitest config for running the DSH integration spec against the harness sources.
 *
 * `plugin-in-dsh.spec.ts` mounts the plugin into a REAL cordis context, so it
 * needs `@deepseek-ai/dsh-*` resolvable to harness sources. Those are mapped by
 * the harness's own `tsconfig.base.json` (455 path entries), so this config
 * reuses that mapping and sets `root` to the harness checkout — the paths are
 * declared relative to it.
 *
 * Run it from the harness checkout:
 *
 *   cd ~/work/harvey/freepeak/deepseek-harness
 *   npx vitest run --config ~/work/harvey/freepeak/dsh-feature-loop/test/integration/vitest.dsh.config.ts
 *
 * The harness's own `vitest.config.ts` cannot be used directly: its `include`
 * globs only match `packages/star/star/tests`, so a spec living in another
 * repository is never collected.
 */

import { fileURLToPath } from 'node:url'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

const HARNESS = process.env.DSH_HARNESS
  ?? '/Users/linh.doan/work/harvey/freepeak/deepseek-harness'

const specDirectory = fileURLToPath(new URL('.', import.meta.url))

export default defineConfig({
  root: HARNESS,
  plugins: [tsconfigPaths({ projects: [`${HARNESS}/tsconfig.base.json`] })],
  test: {
    // The spec lives outside the harness root, so it is named absolutely.
    include: [`${specDirectory}*.spec.ts`],
    // Forked workers: the harness forces this for Node stability (its own
    // config documents a macOS CJS-lexer abort under worker threads).
    pool: 'forks',
    // No coverage gate: the harness enforces a per-file 100% threshold over its
    // own sources, which must not apply to a spec living in another repository.
    coverage: { enabled: false },
    reporters: ['default'],
  },
})
