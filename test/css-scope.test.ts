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

/**
 * Every declaration block whose selector list contains `selector`, joined.
 *
 * A JOIN, not the first match: `html.fl-standalone body` appears twice in this
 * sheet — the page furniture and the page geometry — and the first-match version
 * silently tested the wrong one and passed while asserting nothing.
 */
function rule(css: string, selector: string): string {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(`(?:^|[},])\\s*${escaped}\\b[^{]*\\{([^}]*)\\}`, 'g')
  const blocks: string[] = []
  for (const m of css.matchAll(re)) blocks.push(m[1]!)
  assert.ok(blocks.length > 0, `no rule for \`${selector}\` in shell.css`)
  return blocks.join('; ')
}

/** `prop: value` from a block, whitespace-normalised. */
function decl(block: string, prop: string): string | undefined {
  const match = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`).exec(block)
  return match?.[1].trim().replace(/\s+/g, ' ')
}

test('every selector that reaches a document element carries the marker', () => {
  // The trap this catches: `body.fl-standalone` is the natural way to write a
  // rule for the standalone page's body, and it matches NOTHING, because the
  // marker is on `<html>` and the body is its descendant. There is no diagnostic
  // for a rule that does not match — it just silently does nothing, and the page
  // renders as though the rule were never written. Measured: a stylesheet that
  // plainly declared `body.fl-standalone { container-type: size }` computed
  // `containerType=normal` on the live element.
  //
  // So: a selector whose rightmost compound IS a document element must reach it
  // through `html.<marker>`, and every such rule is listed here. `html.fl-standalone`
  // on its own is the correct shape.
  const dead = selectors(stripComments(shellCss)).filter((sel) =>
    // `.fl-standalone header` and friends are fine — they descend from the marker.
    /^\s*(body|html|head)\b/.test(sel) && !new RegExp(`^\s*html\\.${STANDALONE}\\b`).test(sel),
  )
  assert.deepEqual(
    dead,
    [],
    `these selectors target a document element without reaching it through \`html.${STANDALONE}\`, so they match nothing: ${dead.join(' | ')}`,
  )
  // And the rule the standalone page's geometry depends on is really present,
  // with a definite height on the SAME box as the container — `size` containment
  // sizes a box against nothing else, and the root has no content to size from
  // (measured: `html` at 0px tall, every `cqh` on the page resolving to 0).
  const body = rule(stripComments(shellCss), `html.${STANDALONE} body`)
  assert.equal(decl(body, 'container-type'), 'size')
  assert.equal(decl(body, 'height'), '100dvh')
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
