#!/usr/bin/env node
/**
 * The `dshloop` entry point.
 *
 * A five-line launcher, not a second CLI: it resolves the module next to itself
 * and hands over. Two resolution paths because `dshloop` runs in two shapes —
 * from the repo during development (TypeScript sources, no build step, so
 * `--experimental-strip-types` does the work) and from an installed package
 * where `lib/cli.mjs` is already built.
 *
 * @module dshloop/bin
 */

import { existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const built = join(here, '..', 'lib', 'cli.mjs')
const source = join(here, '..', 'src', 'cli.ts')

// `lib/cli.mjs` wins when it exists: an installed package ships it, and a
// developer who ran `pnpm build` should get the build they just made.
const target = existsSync(built) ? built : source

if (!existsSync(target)) {
  process.stderr.write(
    `dshloop: no CLI to run.\n`
    + `  looked for ${built}\n`
    + `  and for     ${source}\n`
    + `Run \`pnpm build\` in the dsh-feature-loop checkout.\n`,
  )
  process.exit(2)
}

await import(pathToFileURL(target).href)
