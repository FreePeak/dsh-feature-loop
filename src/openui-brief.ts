/**
 * The OpenUI language for model-authored review briefs: one allowlisted
 * component library, its system prompt, and a normalizer that turns OpenUI
 * Lang into a plain JSON node tree the dashboard page renders with the DOM.
 *
 * The security story is two independent gates, and neither of them is the
 * rendering code. First, the parser itself drops anything outside the schema:
 * a model that emits `Button("Approve", "act1")` gets an
 * `unknown-component` error and no node — there is nothing for the renderer
 * to mishandle. Second, `normalizeBrief` switches on the component name
 * against the same allowlist, so a name that somehow reached the tree as a
 * different shape still cannot render.
 *
 * The tree carries **strings only**. Reactive refs (`$tone`) arrive as
 * objects and are dropped, never coerced; truncating a string to fit a cap is
 * not done either — a brief that does not fit fails whole, and the dashboard
 * shows "brief unavailable" rather than a box that looks complete but is not.
 * No HTML passes through this module at all: `BriefNode` is data, and the
 * page builds DOM with `textContent`, so there is no escaping to get wrong.
 *
 * Why OpenUI rather than prose or a fixed template: the brief is the one part
 * of the dashboard that is genuinely model-authored, and a typed component
 * language is the controlled way to let a model choose structure. The model
 * is told the exact language by `briefSystemPrompt()`, generated from the
 * same library the parser enforces — one source of truth, no hand-maintained
 * prompt that can drift from what parses.
 *
 * @module dsh-feature-loop/openui-brief
 */

import { createLibrary, createParser, defineComponent } from '@openuidev/lang-core'
import type { ElementNode } from '@openuidev/lang-core'
import { z } from 'zod'

/** One normalized brief node: data only, no HTML, strings only. */
export type BriefNode =
  | { kind: 'heading', text: string }
  | { kind: 'paragraph', text: string }
  | { kind: 'callout', tone: 'info' | 'warning' | 'danger', text: string }
  | { kind: 'table', columns: string[], rows: string[][] }
  | { kind: 'code', language: string, code: string }

/** How deep a brief tree may nest before it fails whole. */
const MAX_DEPTH = 6
/** How many nodes a brief may hold before it fails whole. */
const MAX_NODES = 200
/** Longest string any single field may carry. */
const MAX_STRING = 2000

const Stack = defineComponent({
  name: 'Stack',
  description: 'Vertical stack of child elements; every program\'s root.',
  props: z.object({ children: z.array(z.any()).describe('child elements, in display order') }),
  // Headless library: no React renderer — parsing and prompting only.
  component: undefined as unknown,
})
const CardHeader = defineComponent({
  name: 'CardHeader',
  description: 'The brief heading: the tool call in one line.',
  props: z.object({ title: z.string().describe('the heading text') }),
  // Headless library: no React renderer — parsing and prompting only.
  component: undefined as unknown,
})
const TextContent = defineComponent({
  name: 'TextContent',
  description: 'One paragraph of explanation.',
  props: z.object({ text: z.string().describe('the paragraph text') }),
  // Headless library: no React renderer — parsing and prompting only.
  component: undefined as unknown,
})
const Callout = defineComponent({
  name: 'Callout',
  description: 'A tone-styled risk or attention box.',
  props: z.object({
    tone: z.string().describe('one of: info, warning, danger'),
    text: z.string().describe('the callout text'),
  }),
  // Headless library: no React renderer — parsing and prompting only.
  component: undefined as unknown,
})
const Table = defineComponent({
  name: 'Table',
  description: 'A small data table, e.g. run position against ceilings.',
  props: z.object({
    columns: z.array(z.string()).describe('header labels, one per column'),
    rows: z.array(z.array(z.string())).describe('one string array per row'),
  }),
  // Headless library: no React renderer — parsing and prompting only.
  component: undefined as unknown,
})
const CodeBlock = defineComponent({
  name: 'CodeBlock',
  description: 'A short quoted fragment: a command, a path, a reason line.',
  props: z.object({
    language: z.string().describe('language label, or "text"'),
    code: z.string().describe('the quoted text'),
  }),
  // Headless library: no React renderer — parsing and prompting only.
  component: undefined as unknown,
})

const library = createLibrary({
  components: [Stack, CardHeader, TextContent, Callout, Table, CodeBlock],
  root: 'Stack',
})

/** The parser, built once: the schema is the allowlist. */
const parser = createParser(library.toJSONSchema())

/**
 * The system prompt for the model that authors briefs, generated from the
 * same library the parser enforces — the model can only be told about
 * components that parse.
 *
 * @returns the prompt text.
 */
export function briefSystemPrompt(): string {
  return library.prompt({
    preamble: 'You explain a pending tool-call approval to the human who must allow or reject it. '
      + 'Be terse: a heading, one risk callout, and at most a few short paragraphs. '
      + 'Never emit components outside this library. Never include buttons, forms, links, or scripts — '
      + 'the approval decision is made with the dashboard\'s own Allow/Reject buttons, not by your output.',
    additionalRules: [
      'Every program must define root = Stack(...) containing the whole brief.',
      'Tone must be one of: info, warning, danger.',
    ],
  })
}

interface WalkState {
  depth: number
  count: number
}

/** Read a required string prop, rejecting anything that is not one. */
function takeString(props: Record<string, unknown>, name: string): string | undefined {
  const value = props[name]
  if (typeof value !== 'string' || value === '') return undefined
  return value.length <= MAX_STRING ? value : undefined
}

/** Read a string array of bounded length, rejecting anything else. */
function takeStringArray(value: unknown, maxItems: number): string[] | undefined {
  if (!Array.isArray(value) || value.length > maxItems) return undefined
  const out: string[] = []
  for (const item of value) {
    if (typeof item !== 'string' || item.length > MAX_STRING) return undefined
    out.push(item)
  }
  return out
}

/**
 * Convert one parsed element into brief nodes.
 *
 * Returns `undefined` for anything outside the allowlist or malformed —
 * dropped, never coerced — so the caller can fail the whole brief rather
 * than render a guess.
 */
function walk(node: ElementNode, state: WalkState): BriefNode[] | undefined {
  state.count += 1
  if (state.count > MAX_NODES || state.depth > MAX_DEPTH) return undefined
  const props = node.props
  switch (node.typeName) {
    case 'Stack': {
      const children = props.children
      if (!Array.isArray(children)) return undefined
      const out: BriefNode[] = []
      state.depth += 1
      for (const child of children) {
        if (child === null || typeof child !== 'object' || !('typeName' in child)) continue
        const nodes = walk(child as ElementNode, state)
        if (nodes === undefined) {
          state.depth -= 1
          return undefined
        }
        out.push(...nodes)
      }
      state.depth -= 1
      return out
    }
    case 'CardHeader': {
      const text = takeString(props, 'title')
      return text === undefined ? undefined : [{ kind: 'heading', text }]
    }
    case 'TextContent': {
      const text = takeString(props, 'text')
      return text === undefined ? undefined : [{ kind: 'paragraph', text }]
    }
    case 'Callout': {
      const tone = takeString(props, 'tone')
      const text = takeString(props, 'text')
      if (tone !== 'info' && tone !== 'warning' && tone !== 'danger') return undefined
      return text === undefined ? undefined : [{ kind: 'callout', tone, text }]
    }
    case 'Table': {
      const columns = takeStringArray(props.columns, 12)
      const rawRows = props.rows
      if (columns === undefined || !Array.isArray(rawRows) || rawRows.length > 30) return undefined
      const rows: string[][] = []
      for (const row of rawRows) {
        const cells = takeStringArray(row, 12)
        if (cells === undefined) return undefined
        rows.push(cells)
      }
      return columns.length === 0 ? undefined : [{ kind: 'table', columns, rows }]
    }
    case 'CodeBlock': {
      const language = takeString(props, 'language')
      const code = takeString(props, 'code')
      if (language === undefined || code === undefined) return undefined
      return [{ kind: 'code', language, code }]
    }
    default:
      // Second gate: the parser should already have dropped this as
      // `unknown-component`, but the renderer never trusts the parser alone.
      return undefined
  }
}

/**
 * Normalize model-authored OpenUI Lang into renderable brief nodes.
 *
 * Fails whole on a truncated stream (`meta.incomplete` — never render half a
 * tree), on a root that is not the allowlisted `Stack`, and on any node that
 * does not normalize cleanly. An empty but valid program also fails: the
 * page must show "brief unavailable", not an empty box that reads as "no
 * risks". Parser errors are returned for the operator's log, not the page.
 *
 * @param code - the model's OpenUI Lang output.
 * @returns the nodes, or the reason the brief is unusable.
 */
export function normalizeBrief(code: string): { nodes: BriefNode[] } | { error: string, details?: string[] } {
  let parsed
  try {
    parsed = parser.parse(code)
  } catch (error: unknown) {
    return { error: 'brief failed to parse', details: [error instanceof Error ? error.message : String(error)] }
  }
  if (parsed.meta.incomplete) return { error: 'brief stream was truncated' }
  const root = parsed.root
  if (root === null || root.typeName !== 'Stack') {
    return {
      error: 'brief has no Stack root',
      details: parsed.meta.errors.map(e => e.message),
    }
  }
  const details = parsed.meta.errors.map(e => e.message)
  const nodes = walk(root, { depth: 0, count: 0 })
  if (nodes === undefined) return { error: 'brief failed normalization', details }
  if (nodes.length === 0) return { error: 'brief rendered nothing', details }
  return { nodes }
}
