#!/usr/bin/env node
/**
 * Add a package to a DSH profile's `dsh.profile.bundles`.
 *
 * `dsh plugin add` installs the package and nothing else. A plugin composes only
 * when it is listed in the profile's bundles array, so an installed-but-unlisted
 * plugin is inert: it appears in `package.json`, is absent from `--dump-config`,
 * and contributes no rows at all. That is what left the `web` profile running
 * without a Feature Loop page while reporting a successful install.
 *
 * Idempotent, and it rewrites only that one array — the file is the user's, and
 * reformatting it would bury the change in a diff nobody asked for.
 *
 * Usage: node scripts/add-bundle.mjs <profilePackageJson> <packageName>
 */
import { readFileSync, writeFileSync } from 'node:fs'

const [file, pkg] = process.argv.slice(2)
if (file === undefined || pkg === undefined) {
  process.stderr.write('usage: add-bundle.mjs <profile-package.json> <package-name>\n')
  process.exit(2)
}

const manifest = JSON.parse(readFileSync(file, 'utf8'))
const bundles = manifest.dsh?.profile?.bundles
if (!Array.isArray(bundles)) {
  process.stderr.write(`${file}: no dsh.profile.bundles array to add to\n`)
  process.exit(1)
}
if (bundles.includes(pkg)) {
  console.log(`already listed: ${pkg}`)
  process.exit(0)
}
// Bundles compose in order, and this plugin is an add-on to the web app rather
// than a layer beneath it, so it goes last.
bundles.push(pkg)
writeFileSync(file, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8')
console.log(`added ${pkg} to dsh.profile.bundles (${bundles.length} bundles)`)
