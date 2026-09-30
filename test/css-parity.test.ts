/**
 * The check that this plugin's page is styled with the harness's own metrics,
 * not a private set that happens to look similar.
 *
 * Run: `node --experimental-strip-types --test test/css-parity.test.ts`
 *
 * Why this exists. Both plugin stylesheets already bound their COLORS to the
 * host's tokens (`--dsw-alias-*`), and `css-scope.test.ts` already proved they
 * cannot restyle the host. What neither test could see is the half that a
 * reviewer reads as "this does not look like the rest of the app": the page had
 * no gutter and no width cap, the page title wore the uppercase 12px section
 * micro-label, the tab row and the start control were 24px and 32px controls
 * the host does not have, and a bare `button` rule in shell.css was deciding
 * their geometry by cascade — a live instance measured a 32px start button at
 * 40px and a 28px tab at 40px, because a `min-height: 40px` cannot be beaten by
 * a smaller `height`.
 *
 * The numbers below are copied from the harness's own sheets, by file, so a
 * mismatch has a place to go look. If the harness changes a metric, this fails
 * and the fix is to follow the harness — that is the whole contract.
 */
import { strict as assert } from 'node:assert'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { test } from 'node:test'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const shellCss = readFileSync(join(root, 'web/shell.css'), 'utf8')
const pluginCss = readFileSync(join(root, 'web/plugin.css'), 'utf8')
const entry = readFileSync(join(root, 'web/entry.tsx'), 'utf8')

/** Drop `/* … *\/` comments so a rule can be matched by selector alone. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

/** The declaration block of the first rule whose selector list matches exactly. */
function rule(css: string, selector: string): string {
  const stripped = stripComments(css)
  const re = new RegExp(`(?:^|[},])\\s*${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*(?:,[^{]*)?\\{([^}]*)\\}`)
  const match = re.exec(stripped)
  assert.ok(match !== null, `no rule for \`${selector}\` in ${css === shellCss ? 'shell.css' : 'plugin.css'}`)
  return match[1]
}

/** `prop: value` from a block, whitespace-normalised. */
function decl(block: string, prop: string): string | undefined {
  const match = new RegExp(`(?:^|;)\\s*${prop}\\s*:\\s*([^;]+)`).exec(block)
  return match?.[1].trim().replace(/\s+/g, ' ')
}

test('the page is a centred column with the harness page gutter', () => {
  // ui-plugin-manager/src/client/PluginManagerPage.module.css `.page`:
  // `padding: 0 clamp(24px, 4vw, 48px) 48px` and `> * { max-width: 960px }`.
  const page = rule(pluginCss, '.fl-page')
  assert.equal(decl(page, 'padding'), '0 clamp(24px, 4vw, 48px) 48px')
  const child = rule(pluginCss, '.fl-page > *')
  assert.equal(decl(child, 'max-width'), '960px')
  // The page is the scroll container. A second scroller below it gave the page
  // two scrollbars and let the header scroll away from its content.
  assert.equal(decl(page, 'overflow'), 'auto')
  assert.equal(decl(rule(pluginCss, '.fl-dashboard'), 'overflow'), undefined)
})

test('the page title uses the harness page-title ramp, not a section micro-label', () => {
  // PluginManagerPage `.pageTitle`: 20px / weight 500 / 28px line, and — unlike
  // `.section-head h2` — no uppercase. The uppercase came from shell.css's bare
  // `h2` rule matching the title's element; that rule is now scoped to
  // `.section-head` (asserted below), and the title states its own transform.
  const title = rule(pluginCss, '.fl-title')
  assert.equal(decl(title, 'font-size'), 'calc(20px + var(--dsh-content-font-delta, 0px))')
  assert.equal(decl(title, 'font-weight'), '500')
  assert.equal(decl(title, 'line-height'), 'calc(28px + var(--dsh-content-font-delta, 0px))')
  assert.equal(decl(title, 'text-transform'), 'none')
})

test('the section micro-label stays uppercase, and only on section heads', () => {
  // ui-theme's own micro-labels are 12px uppercase; that style belongs to a
  // section head and to nothing else.
  assert.match(rule(shellCss, ':where(.fl-page, .fl-standalone) .section-head h2'), /text-transform:\s*uppercase/)
  assert.doesNotMatch(
    shellCss,
    /:where\(\.fl-page, \.fl-standalone\)\s+h2\b/,
    'a bare `h2` scope rule matches the page title too, and sheet order decides the winner',
  )
})

test('the tabs are the harness segmented control', () => {
  // ui-primitives/src/SegmentedControl.module.css: 28px tall, 13px/20px,
  // weight 500, radius-sm, on the translucent track, selection lifted by
  // bg-layer-1 under --dsw-elevation-soft.
  const tabs = rule(pluginCss, '.fl-tabs')
  assert.equal(decl(tabs, 'display'), 'inline-flex')
  assert.equal(decl(tabs, 'padding'), '4px')
  assert.equal(decl(tabs, 'border-radius'), 'var(--dsw-radius-md)')
  assert.equal(decl(tabs, 'background'), 'var(--dsw-alias-interactive-bg-hover)')

  const tab = rule(pluginCss, '.fl-tabs button')
  assert.equal(decl(tab, 'height'), '28px')
  assert.equal(decl(tab, 'font-size'), '13px')
  assert.equal(decl(tab, 'line-height'), '20px')
  assert.equal(decl(tab, 'font-weight'), '500')
  assert.equal(decl(tab, 'border-radius'), 'var(--dsw-radius-sm)')

  const active = rule(pluginCss, '.fl-tabs button[data-active="true"]')
  assert.equal(decl(active, 'background'), 'var(--dsw-alias-bg-layer-1)')
  assert.equal(decl(active, 'box-shadow'), 'var(--dsw-elevation-soft)')
})

test('inputs and buttons use the harness control metrics', () => {
  // ui-primitives/src/Input.module.css: 32px on the field, 0.5px border-l4,
  // radius-md, bg-layer-1, focus on state-business-primary.
  // ui-primitives/src/Button.module.css (`md`): 36px, 14px/22px, radius-md,
  // no border, 0.4 disabled opacity.
  const input = rule(pluginCss, '.fl-start-input')
  assert.equal(decl(input, 'height'), '36px')
  assert.equal(decl(input, 'border'), '0.5px solid var(--dsw-alias-border-l4)')
  assert.equal(decl(input, 'border-radius'), 'var(--dsw-radius-md)')
  assert.equal(decl(input, 'background'), 'var(--dsw-alias-bg-layer-1)')

  const button = rule(pluginCss, '.fl-start-button')
  assert.equal(decl(button, 'height'), '36px')
  assert.equal(decl(button, 'border'), 'none')
  assert.equal(decl(button, 'border-radius'), 'var(--dsw-radius-md)')
  assert.equal(decl(button, 'background'), 'var(--dsw-alias-button-primary-fill)')

  // Every focus ring on the page takes the harness colour and width, not a
  // hand-picked accent: ui-theme/src/styles/focus.css publishes both.
  for (const sheet of [pluginCss, shellCss]) {
    for (const match of stripComments(sheet).matchAll(/outline:\s*2px solid ([^;]+);/g)) {
      assert.equal(
        match[1]!.trim(),
        'var(--dsw-alias-state-business-primary)',
        'a focus ring must ride the host focus colour',
      )
    }
  }
})

test('no bare button rule can decide the geometry of the page controls', () => {
  // The regression: shell.css carried `:where(.fl-page, …) button { min-height:
  // 40px; padding: 9px 18px; border-radius: 999px }`, written for two decision
  // buttons and silently governing every button on the page. A `min-height`
  // wins over any smaller `height`, so the 32px start button measured 40px.
  // `css-scope.test.ts` cannot catch this — `:where(.fl-page) button` IS
  // anchored — so the assertion is about the rule's presence, not its scope.
  assert.doesNotMatch(
    stripComments(shellCss),
    /:where\([^)]*\)\s*button\s*\{[^}]*min-height/,
    'a min-height on a page-wide `button` rule overrides every control height',
  )
  // The two decision buttons it was written for keep their own metrics.
  const decide = rule(shellCss, '.allow,\n.reject')
  assert.equal(decl(decide, 'height'), '36px')
  assert.equal(decl(decide, 'border-radius'), 'var(--dsw-radius-md)')
})

test('the page follows the host type scale, and its controls the host keeps fixed', () => {
  // ui-theme writes --dsh-content-font-size (12–17) on `body` and derives
  // -secondary and -delta from it. Prose rides those; a control does not,
  // because the host's own Button/Input sheets pin their font-size in px.
  assert.equal(
    decl(rule(pluginCss, '.fl-page'), 'font-size'),
    'var(--dsh-content-font-size, 14px)',
  )
  assert.equal(
    decl(rule(pluginCss, '.fl-sub'), 'font-size'),
    undefined,
    '.fl-sub is page prose: it must inherit .fl-page\'s size, not pin its own',
  )
  for (const secondary of ['.fl-start-note', '.fl-hint', '.fl-section-title', '.fl-badge', '.fl-notice']) {
    assert.equal(
      decl(rule(pluginCss, secondary), 'font-size'),
      'var(--dsh-content-font-size-secondary, 13px)',
      `${secondary} is body text and must track the host's secondary step`,
    )
  }
})

test('every custom property these sheets read is declared somewhere', () => {
  // `--chrome` was read by `.pane-head` and declared nowhere, so the color-mix
  // was invalid and the whole declaration fell through to transparent. A
  // `var(--x)` with no declaration is invisible in review and silent in the
  // browser; this turns it into a failure.
  const sheets = [shellCss, pluginCss].map(stripComments)
  const declared = new Set<string>()
  for (const css of sheets) {
    for (const match of css.matchAll(/(--[a-z0-9-]+)\s*:/gi)) declared.add(match[1]!.toLowerCase())
  }
  // Tokens the HOST publishes; the plugin reads them and must not redeclare.
  const hostOwned = new Set([
    '--dsw-alias-bg-base', '--dsw-alias-bg-layer-1', '--dsw-alias-bg-layer-2',
    '--dsw-alias-bg-layer-3', '--dsw-alias-border-l1', '--dsw-alias-border-l2',
    '--dsw-alias-border-l3', '--dsw-alias-border-l4', '--dsw-alias-label-primary',
    '--dsw-alias-label-primary-foreground', '--dsw-alias-label-secondary',
    '--dsw-alias-label-tertiary', '--dsw-alias-label-dimmed', '--dsw-alias-link',
    '--dsw-alias-brand-primary', '--dsw-alias-button-primary-fill',
    '--dsw-alias-button-primary-hover', '--dsw-alias-button-ghost-active-fill',
    '--dsw-alias-button-ghost-active-border', '--dsw-alias-interactive-bg-hover',
    '--dsw-alias-interactive-bg-active', '--dsw-alias-state-success-primary',
    '--dsw-alias-state-error-primary', '--dsw-alias-state-warn-primary',
    '--dsw-alias-state-business-primary', '--dsw-alias-scrollbar-bg-l1',
    '--dsw-alias-scrollbar-bg-l2', '--dsw-alias-scrollbar-hover-l1',
    '--dsw-alias-scrollbar-hover-l2', '--dsw-radius-xs', '--dsw-radius-sm',
    '--dsw-radius-md', '--dsw-radius-lg', '--dsw-radius-xl', '--dsw-radius-panel',
    '--dsw-elevation-soft', '--dsw-elevation-panel', '--dsw-elevation-prominent',
    '--dsw-focus-ring-color', '--dsw-focus-ring-width', '--dsw-font-family',
    '--dsh-scrollbar-thumb', '--dsh-scrollbar-thumb-hover',
    '--dsh-scrollbar-thumb-border', '--dsh-scrollbar-track-margin',
    '--dsh-scrollbar-width', '--dsh-content-font-size',
    '--dsh-content-font-size-secondary', '--dsh-content-font-delta',
    '--dsh-frame-top-clearance',
  ])
  const missing = new Set<string>()
  for (const css of sheets) {
    for (const match of css.matchAll(/var\(\s*(--[a-z0-9-]+)/gi)) {
      const name = match[1]!.toLowerCase()
      if (declared.has(name) || hostOwned.has(name)) continue
      missing.add(name)
    }
  }
  assert.deepEqual([...missing], [], 'undeclared custom properties: declare them or use a host token')
})

test('no hardcoded colour is left in the two page stylesheets', () => {
  // One survived the token pass: `.sig.warning { color: #F0F0F0 }`, a light
  // value that happens to be invisible on the dark surface. Anything literal in
  // a paint property here is a colour that will not follow the theme.
  //
  // Two kinds of literal are not findings, and both need an explanation or the
  // test is useless:
  //   1. the fallback argument of `var(--token, #hex)` — the standalone page
  //      has no host to inherit the token from, so it needs a real value;
  //   2. an alpha in a `box-shadow` — a shadow is not a surface colour, and
  //      the harness's own elevation tokens hardcode theirs the same way
  //      (`ui-theme/…/gradient-shadow-text.css`: `rgba(0, 0, 0, 0.03)`).
  //
  // A literal in a paint property is a finding. A literal in a SHADOW is not.
  for (const [name, css] of [['shell.css', shellCss], ['plugin.css', pluginCss]] as const) {
    const body = stripComments(css)
    const hits: string[] = []
    for (const match of body.matchAll(/#[0-9a-f]{3,8}\b|\brgba?\([^)]*\)|\bhsla?\([^)]*\)/gi)) {
      const at = match.index!
      // A `var()` fallback is preceded by the token name and a comma.
      if (/var\(\s*--[a-z0-9-]+\s*,\s*$/.test(body.slice(0, at))) continue
      // Inside the shadow list of the property being declared, and not inside
      // that list's `color-mix` arguments (which are colours, and ARE checked
      // — that is how `--chrome` was caught before it was bound).
      const lineStart = body.lastIndexOf(';', at) + 1
      const property = body.slice(lineStart, at)
      if (/box-shadow\s*:[^;]*$/.test(property) && !/color-mix\([^)]*$/.test(property)) continue
      hits.push(`${name}: ${body.slice(Math.max(0, at - 40), at + match[0].length).replace(/\s+/g, ' ').trim()}`)
    }
    assert.deepEqual(hits, [], `hardcoded colours left in ${name}`)
  }
})

test('no page-height rule is measured in viewport units', () => {
  // A `vh` in a page-height rule is wrong on this page for one specific reason:
  // the page is the CENTRE COLUMN, not the window. The window also carries the
  // host's sidebar (56px collapsed, 280px open), the frame's top clearance, and
  // the window's own chrome — so `vh` overstates the space the page has by a
  // margin that grows as the window narrows, which is exactly backwards.
  //
  // Measured on a live instance at 480x560: `.hitl-thread-root` declared
  // `min-height: min(70vh, 720px)`, resolved to 334px, and sat with 176px above
  // the fold — the approval card, the reason a person is on the page, below it.
  // With the floor expressed in `cqh` the same window shows 60% of the page's
  // own height and the rest of the page scrolls to the rest.
  //
  // `100vh` in a STICKY offset (`top: calc(var(--header-h) + …)`) is a different
  // thing and stays: it positions a sticky column against the window, which is
  // what sticky means. So the assertion is on height, not on every `vh`.
  const heightVh = /(?:^|[;{])\s*(?:min-|max-)?height\s*:\s*[^;}]*?\d*\.?\d+v(?:h|min|max)\b/g
  for (const [name, css] of [['shell.css', shellCss], ['plugin.css', pluginCss]] as const) {
    const body = stripComments(css)
    const hits: string[] = []
    for (const match of body.matchAll(heightVh)) {
      hits.push(`${name}: ${body.slice(Math.max(0, match.index! - 10), match.index! + match[0].length).replace(/\s+/g, ' ').trim()}`)
    }
    assert.deepEqual(hits, [], `viewport units in a height: the page is the column, not the window\n  ${hits.join('\n  ')}`)
  }
  // And the thread's floor must actually be the container-relative one.
  assert.match(
    rule(shellCss, '.hitl-thread-root'),
    /min-height:\s*min\(\d+px, \d+cqh\)/,
    'the thread floor must be a container-height query, in both axes of its min()',
  )
  // A size container is what publishes `cqh` at all: `inline-size` alone leaves
  // the height query invalid and the whole declaration is dropped.
  assert.match(
    rule(shellCss, '.fl-page'),
    /container-type:\s*size/,
    'a `cqh` floor needs container-type: size — inline-size publishes no height',
  )
})

test('a control is not inset by more padding than it has width for', () => {
  // Measured on a live instance at a 440px window (a 384px page, 331px of
  // content): the composer's textarea was 23px wide, with a 36px send button
  // beside it. The width went to FOUR nested layers of horizontal padding on
  // the way down — the thread viewport's 32px, the sticky footer's 24px, the
  // composer card's 24px, the textarea's own 8px — so 88px went to padding
  // before a character was typed. The harness's own composer stacks TWO layers
  // (its card's 32px and its editor's 4px) and is still 341px wide in the same
  // column.
  //
  // This asserts the shape, not the number: a horizontal-padding declaration on
  // a LAYOUT box that also holds a control is the thing to look for, because
  // every one of them is a subtraction from the control's width at every width,
  // and the subtraction is invisible until the column is narrow. The messages
  // carry the thread's edge inset themselves (they are the only content that
  // needs it), so the viewport and the footer must not.
  // `0 0 14px` and `16px 16px 0` both pass; `0 12px 14px` and `16px` do not.
  // The shorthand's left and right values are what matter, and they are the
  // second and fourth tokens for a four-value form, the first and third for a
  // three-value form, the first and last for two, and the single value for one.
  // A three-value shorthand is `top horizontal bottom`, so `16px 0 0` is 16px
  // of TOP padding and no horizontal inset at all — which is what the thread
  // viewport wants, and the two-value and four-value forms have to agree.
  const sides = (padding: string): [number, number] => {
    const parts = padding.trim().split(/\s+/)
    const num = (t: string | undefined) => (t === undefined ? 0 : Number.parseFloat(t) || 0)
    switch (parts.length) {
      case 1: return [num(parts[0]), num(parts[0])]
      case 2: return [num(parts[0]), num(parts[0])]
      case 3: return [num(parts[1]), num(parts[1])]
      default: return [num(parts[0]), num(parts[1])]
    }
  }
  for (const [box, why] of [
    ['.hitl-thread-viewport', 'it holds the sticky composer, which insets itself'],
    ['.hitl-thread-footer', 'it is a wrapper around the composer card'],
  ] as const) {
    const pad = decl(rule(shellCss, box), 'padding')
    const [left, right] = sides(pad ?? '0')
    assert.ok(
      left === 0 && right === 0,
      `${box} carries horizontal padding (${pad}) — ${why}, so every descendant pays it again`,
    )
  }
  // The field itself must not inset: the card it lives in already does.
  const field = rule(shellCss, '.hitl-composer-input')
  assert.equal(
    decl(field, 'padding'),
    '0',
    'the composer field must take the card\'s inset, not add a second one',
  )
})

test('a pane that holds a list keeps its own height cap below 760px', () => {
  // The `max-width: 759px` block releases `.sidebar`/`.rail` to `position:
  // static; height: auto; overflow: visible` — sticky is meaningless once the
  // page is one scroll. It also released the PANES inside them, and a pane is
  // `overflow: hidden` with no cap, so it grew to its content: the activity feed
  // was 941px tall (11 entries) inside a 744px page, and reaching it meant
  // scrolling 1483px past the approval thread. The panes are lists; a list
  // scrolls inside its card, which is what they do in the wider layouts too.
  // A nested block means a non-greedy `\n\}` match stops at the FIRST closing
  // brace, so the assertions below would read only the rules before the
  // `.sidebar, .rail` group and never see the pane rules at all. Match to the
  // rule that ends the block instead: the query's own closing brace, after the
  // pane declaration.
  const narrow = /@container fl-dashboard \(max-width: 759px\)\s*\{([\s\S]*?overflow:\s*hidden;[\s\S]*?\n  \})/.exec(shellCss)
  assert.ok(narrow !== null, 'the sub-760px layout block should exist')
  const block = narrow[1]!
  // A cap expressed in viewport units is the defect being fixed; cqh is the
  // same rule the thread floor and the sticky columns use. Asserted on the
  // block rather than the file, so a `vh` cap elsewhere in the sheet is not
  // mistaken for this one and a removal is not missed.
  const cap = /\.sidebar \.pane-activity,[\s\S]*?max-height\s*:\s*([^;]+);/.exec(block)
  assert.ok(cap !== null, 'the activity pane must keep a height cap once the column is released')
  assert.match(cap[1]!, /cqh/, `the pane cap must measure the page, not the window (got ${cap[1]})`)
  assert.doesNotMatch(cap[1]!, /\dv(?:h|min|max)\b/, 'a pane cap in viewport units is the original bug')
  // And the runs pane shares the cap — one list may not be bounded while the
  // other grows, which is how the page ends up 1483px taller than the thread.
  const runs = /\.rail \.pane-runs[\s\S]*?max-height\s*:\s*([^;]+);/.exec(block)
  assert.ok(runs !== null, 'the runs pane must keep a height cap too')
  assert.match(runs[1]!, /cqh/, `the runs cap must measure the page, not the window (got ${runs[1]})`)
})

test('no card is drawn outside the container it sits in', () => {
  // The viewport's horizontal padding came off (the sticky composer is a child
  // of it and insets itself), which left the thread's edge inset to the
  // messages. Both obvious ways to give it back are wrong, and both were tried:
  //   - `padding: 0 16px` took 32px out of the message's CONTENT, so the text
  //     sat 16px inside a border the card draws itself;
  //   - `margin: 0 16px 14px` on `width: 100%` put the card's border 16px
  //     OUTSIDE its container — measured at 1280: viewport right edge 1226,
  //     welcome right edge 1242, over the thread's own border.
  // `max-width` + `auto` sides is what both centres the message under the
  // thread's `--thread-max-width` and clamps it to the container when that is
  // narrower, so the values are pinned rather than pattern-matched: `width:
  // 100%` defeats the clamp and a fixed side margin moves the box outward, and
  // a loose `margin: … auto` pattern matches either side of a duplicated
  // declaration instead of catching it.
  assert.equal(decl(rule(shellCss, '.hitl-assistant-msg'), 'width'), undefined,
    'width: 100% of a full-width block ignores the clamp the auto sides rely on')
  assert.equal(decl(rule(shellCss, '.hitl-assistant-msg'), 'padding'), undefined,
    'a message must not pad its content box; the edge inset is the box itself')
  assert.equal(decl(rule(shellCss, '.hitl-assistant-msg'), 'margin'), '0 auto 14px')
  assert.equal(decl(rule(shellCss, '.hitl-assistant-msg'), 'max-width'), 'var(--thread-max-width)')

  assert.equal(decl(rule(shellCss, '.hitl-user-msg'), 'width'), undefined)
  assert.equal(decl(rule(shellCss, '.hitl-user-msg'), 'padding'), undefined)

  // The welcome plate is the one child that is not a message, and it has no
  // border to prove the overflow visually — so the same shape is pinned.
  const welcome = rule(shellCss, '.hitl-welcome')
  assert.equal(decl(welcome, 'width'), undefined, 'the welcome plate must clamp, not fill')
  assert.equal(decl(welcome, 'max-width'), 'var(--thread-max-width)')
  assert.equal(decl(welcome, 'margin'), '24px auto')
})

test('the page uses the harness scrollbar skin rather than a second one', () => {
  // ui-theme/src/styles/scrollbar.css styles every ::-webkit-scrollbar* in the
  // document. shell.css drew its own 8px accent-gradient thumb with its own
  // hover, so the same scroll read as a different widget next to the host's.
  const rebound = new RegExp(`--dsh-scrollbar-thumb:\\s*var\\(--dsw-alias-scrollbar-bg-l\\d\\)`)
  assert.match(shellCss, rebound, 'rebind the thumb pair to an l-token instead of restyling the bar')
  assert.doesNotMatch(
    stripComments(shellCss),
    /\.scroll-beauty::?-webkit-scrollbar/,
    'a ::-webkit-scrollbar rule here competes with the host sheet for every scroll region',
  )
})

test('the mounted page is the one these rules style', () => {
  // The scope roots are the whole mechanism; a rename un-styles the page
  // silently rather than loudly. (css-scope.test.ts covers .fl-page too — this
  // asserts the two roots are still applied in the SAME stylesheet, which is
  // what keeps the cascade between them predictable.)
  assert.match(entry, /className="fl-page"/)
  assert.match(pluginCss, /\.fl-page\b/)
  assert.match(shellCss, /\.fl-page\b/)
})
