/**
 * The check that this plugin's stylesheet cannot restyle the host UI.
 *
 * Run: `node --experimental-strip-types --test test/css-scope.test.ts`
 *
 * Why this exists. The dashboard was a standalone page on its own origin, where
 * a stylesheet full of bare `body`/`header`/`main`/`button` rules was correct —
 * nothing else lived in that document. It was then folded into the DSH UI as a
 * main-column slot, and the same file kept riding along inside the client
 * bundle and landing in the HOST's `<head>`. Every bare rule below then applied
 * to the harness itself: its `<main>` picked up `max-width: 1480px`, its
 * `<header>` became a sticky bar, and every `<button>` in the product grew a
 * 999px radius and a 40px min-height. The plugin is a guest; a guest styles
 * itself.
 *
 * The rule this enforces: a selector is only allowed to match something if it
 * is anchored to a class. A bare type selector (`button`, `h2`, `body`, `main`,
 * `header`, `code`, `details`) matches whatever the HOST happens to render, and
 * the host is not ours to restyle. `:where(...)` is the scope prefix because it
 * carries zero specificity, so scoping a rule does not also change how it
 * cascades against the plugin's own rules.
 */
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

import { DASHBOARD_PAGE } from '../src/dashboard-page.ts'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const shellCss = readFileSync(join(root, 'web/shell.css'), 'utf8')

/** The class that marks the standalone page's own `<html>`. */
const STANDALONE = 'fl-standalone'
/** The page root the plugin mounts inside the host UI. */
const PAGE_ROOT = 'fl-page'

/** Drop `/* … *\/` comments without touching string contents. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

/** Every `{ … }` block's selector list, recursing through conditional at-rules. */
function selectors(css: string): string[] {
  const found: string[] = []
  let depth = 0
  let start = 0
  for (let i = 0; i < css.length; i++) {
    const c = css[i]
    if (c === '{') {
      const prelude = css.slice(start, i).trim()
      if (depth === 0) {
        if (prelude.startsWith('@')) {
          // A conditional at-rule (@media/@container/@supports/@layer) wraps
          // real rules, so descend into it; an unknown one is skipped.
          start = i + 1
          depth++
          continue
        }
        found.push(prelude)
      }
      depth++
    } else if (c === '}') {
      depth--
      if (depth === 0) start = i + 1
    }
  }
  return found
}

/** Split a selector list on top-level commas only. */
function splitList(list: string): string[] {
  const parts: string[] = []
  let depth = 0
  let buf = ''
  for (const c of list) {
    if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    if (c === ',' && depth === 0) { parts.push(buf.trim()); buf = '' } else buf += c
  }
  if (buf.trim() !== '') parts.push(buf.trim())
  return parts
}

/**
 * The leftmost compound selector of one complex selector — the part that
 * decides what the rule can match. `button:hover` → `button`; `body.x` → `body`.
 */
function leftmostCompound(selector: string): string {
  let depth = 0
  for (let i = 0; i < selector.length; i++) {
    const c = selector[i]
    if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    else if (depth === 0 && (c === ' ' || c === '>' || c === '+' || c === '~')) {
      return selector.slice(0, i)
    }
  }
  return selector
}

const BARE_TYPE = /^[a-z][a-z0-9-]*$/i

test('no rule in shell.css can match a host element it does not own', () => {
  const unscoped: string[] = []
  for (const list of selectors(stripComments(shellCss))) {
    if (list === '') continue
    for (const selector of splitList(list)) {
      const head = leftmostCompound(selector)
      if (!BARE_TYPE.test(head)) continue
      // A bare type selector matches the host's own markup. Unacceptable unless
      // the rule is deliberately scoped, which the selector would then show.
      unscoped.push(selector)
    }
  }
  assert.deepEqual(
    unscoped,
    [],
    'these selectors match whatever the host renders; anchor each to '
    + `\`${PAGE_ROOT}\` / \`${STANDALONE}\` (use \`:where(...)\` so specificity is unchanged):\n  `
    + unscoped.join('\n  '),
  )
})

test('the plugin page root exists in the UI it mounts into', () => {
  // The scope anchor is only load-bearing if the rendered root really carries
  // it; a renamed class would silently un-style the whole dashboard.
  assert.match(
    readFileSync(join(root, 'web/entry.tsx'), 'utf8'),
    /className="fl-page"/,
    'entry.tsx must mount the .fl-page scope root',
  )
  assert.match(
    readFileSync(join(root, 'web/app.tsx'), 'utf8'),
    /className="dashboard-shell"/,
    'app.tsx must mount the .dashboard-shell dashboard root',
  )
})

test('the standalone page marks its own document, or it loses its page furniture', () => {
  // shell.css reaches `body`/`header`/`main` only through this class now. If
  // the standalone template stops carrying it, that page renders unstyled
  // rather than loudly broken — so assert the marker is really there.
  assert.match(
    DASHBOARD_PAGE,
    new RegExp(`<html[^>]*class="[^"]*\\b${STANDALONE}\\b`),
    `DASHBOARD_PAGE must put \`${STANDALONE}\` on <html>`,
  )
  // And the page furniture it styles must still be there to be styled.
  assert.match(DASHBOARD_PAGE, /<body>|<header>|<main>/)
})

test('the theme tokens are declared on the scope roots, not on the host body', () => {
  // The 15 alias custom properties (--bg, --text, --muted, …) are generic
  // enough to shadow a host token of the same name. They belong to the plugin
  // roots and nowhere else.
  const tokenBlock = /--bg:\s*var\(--dsw-alias-bg-base/.exec(shellCss)
  assert.ok(tokenBlock !== null, 'the alias block should still exist')
  const owner = shellCss.slice(0, tokenBlock.index)
  const selector = owner.slice(owner.lastIndexOf('}') + 1).trim()
  assert.ok(
    selector.includes(PAGE_ROOT) && selector.includes(STANDALONE),
    `the alias block must be scoped to \`${PAGE_ROOT}\` / \`${STANDALONE}\`, got: ${selector}`,
  )
})
