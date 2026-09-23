/**
 * The review brief: the model-authored prose that accompanies a pending ask,
 * normalized into the small node set the dashboard renders.
 *
 * This replaced `openui-brief.ts` when the UI moved from OpenUI to
 * assistant-ui, and the difference is worth stating because it changes where
 * the safety comes from.
 *
 * OpenUI was a *model-authored language*: the model emitted component calls,
 * and a parser plus a six-component allowlist was what made that survivable.
 * assistant-ui has no such language. Component choice is the developer's, and
 * the model's contribution is text inside it. So there is no allowlist here
 * any more, and no parser to get wrong — what remains is the part that was
 * always load-bearing: **bounds**. A brief is untrusted input of unbounded
 * size and shape, and this module is where it stops being unbounded.
 *
 * The rules, unchanged from the OpenUI version in spirit:
 *
 *   bounded        depth, node count, and per-string length are capped, and a
 *                  brief that exceeds any cap is rejected **whole** rather
 *                  than truncated. A partially-rendered brief reads as a
 *                  complete one, which is the failure that matters when the
 *                  text is what a human decides on.
 *   strings only   a non-string never reaches a node; it is dropped, never
 *                  coerced, so nothing can arrive as an object the renderer
 *                  might interpolate.
 *   no HTML        `BriefNode` is data. The renderer builds DOM from it, so
 *                  there is no markup escaping to get wrong here or there.
 *   honest absence an empty or unusable brief reports an error, and the card
 *                  says so. An empty box would read as "no risks".
 *
 * A follow-up worth recording rather than half-building: the *risk framing*
 * ("irreversible — this cannot be undone") should come from the plugin's own
 * reversibility class, not the model's prose. That needs a new field on the
 * pending-ask state and is deliberately not smuggled into this change; the
 * model is asked to explain, and the gate's own reason line is still shown
 * verbatim by the shell.
 *
 * @module dsh-feature-loop/brief
 */

/** One normalized brief node: data only, no HTML, strings only. */
export type BriefNode =
  | { kind: 'heading', text: string }
  | { kind: 'paragraph', text: string }
  | { kind: 'list', items: string[] }
  | { kind: 'code', language: string, code: string }

/** How many nodes a brief may hold before it fails whole. */
const MAX_NODES = 200
/** Longest string any single field may carry. */
const MAX_STRING = 2000
/** Longest a whole brief may be before it is refused unparsed. */
const MAX_INPUT = 20_000
/** Longest a list may be. */
const MAX_LIST_ITEMS = 50

/**
 * The system prompt for the model that authors briefs.
 *
 * There is no component language to describe any more, which makes this far
 * simpler than its OpenUI predecessor — and the constraints that remain are
 * the ones that matter: say what the ask does, do not invent arguments the
 * event never carried, and never claim to be the decision.
 *
 * @returns the prompt text.
 */
export function briefSystemPrompt(): string {
  return [
    'You explain a pending tool-call approval to the human who must allow or reject it.',
    '',
    'Write plain prose, at most a short paragraph or two. You may use:',
    '  - a single leading "# " heading,',
    '  - "- " list items,',
    '  - one fenced ``` code block for a command, path, or quoted line.',
    '',
    'Rules:',
    '  - You are NOT told the tool arguments. Never invent, guess, or imply them.',
    '  - Explain what the named tool does and why it may need a human, nothing more.',
    '  - Do not tell the human to approve, reject, or click anything. The',
    '    decision is theirs and the buttons are the dashboard\'s, not yours.',
    '  - Be terse. If you have nothing beyond the reason line already shown,',
    '    emit an empty brief rather than padding it.',
  ].join('\n')
}

/**
 * Read one line as a bounded string.
 *
 * @param line - the raw line.
 * @returns the line, or `undefined` when it exceeds the per-string cap.
 */
function bounded(line: string): string | undefined {
  return line.length <= MAX_STRING ? line : undefined
}

/**
 * Normalize model-authored prose into renderable brief nodes.
 *
 * Deliberately a small hand-rolled reader rather than a markdown library:
 * the accepted surface is three constructs, and every dependency added here
 * would be code running on the page that can authorise a tool call. A fenced
 * block is closed-only — an unterminated fence is a malformed brief, not an
 * invitation to read to the end of input.
 *
 * @param text - the model's reply.
 * @returns the nodes, or the reason the brief is unusable.
 */
export function normalizeBrief(text: string): { nodes: BriefNode[] } | { error: string } {
  if (typeof text !== 'string') return { error: 'brief was not text' }
  if (text.length > MAX_INPUT) {
    return { error: `brief exceeded ${String(MAX_INPUT)} characters` }
  }
  const nodes: BriefNode[] = []
  const lines = text.split('\n')
  let paragraph: string[] = []
  let items: string[] = []
  let fence: { language: string, body: string[] } | undefined

  const flushParagraph = (): boolean => {
    if (paragraph.length === 0) return true
    const joined = paragraph.join('\n').trim()
    paragraph = []
    if (joined === '') return true
    const boundedText = bounded(joined)
    if (boundedText === undefined) return false
    nodes.push({ kind: 'paragraph', text: boundedText })
    return true
  }
  const flushItems = (): boolean => {
    if (items.length === 0) return true
    const listItems = items
    items = []
    for (const item of listItems) {
      if (bounded(item) === undefined) return false
    }
    nodes.push({ kind: 'list', items: listItems })
    return true
  }

  for (const raw of lines) {
    // Inside a fence: everything is code except the closing fence.
    if (fence !== undefined) {
      if (raw.trimEnd() === '```') {
        const body = fence.body.join('\n')
        const boundedCode = bounded(body)
        if (boundedCode === undefined) return { error: 'brief code block was too long' }
        nodes.push({ kind: 'code', language: fence.language, code: boundedCode })
        fence = undefined
      } else {
        fence.body.push(raw)
      }
      if (nodes.length > MAX_NODES) return { error: 'brief had too many nodes' }
      continue
    }

    if (raw.trimStart().startsWith('```')) {
      if (!flushParagraph() || !flushItems()) return { error: 'brief contained an over-long string' }
      fence = { language: raw.trim().slice(3).trim(), body: [] }
      continue
    }

    const heading = /^#\s+(.*)$/.exec(raw)
    if (heading?.[1] !== undefined) {
      if (!flushParagraph() || !flushItems()) return { error: 'brief contained an over-long string' }
      const title = bounded(heading[1].trim())
      if (title === undefined) return { error: 'brief heading was too long' }
      if (title !== '') nodes.push({ kind: 'heading', text: title })
      continue
    }

    const item = /^[-*]\s+(.*)$/.exec(raw)
    if (item?.[1] !== undefined) {
      if (!flushParagraph()) return { error: 'brief contained an over-long string' }
      if (items.length >= MAX_LIST_ITEMS) return { error: 'brief list was too long' }
      items.push(item[1].trim())
      continue
    }

    if (raw.trim() === '') {
      if (!flushParagraph() || !flushItems()) return { error: 'brief contained an over-long string' }
      continue
    }

    if (!flushItems()) return { error: 'brief contained an over-long string' }
    paragraph.push(raw.trim())
    if (nodes.length > MAX_NODES) return { error: 'brief had too many nodes' }
  }

  if (fence !== undefined) return { error: 'brief had an unterminated code block' }
  if (!flushParagraph() || !flushItems()) return { error: 'brief contained an over-long string' }
  if (nodes.length > MAX_NODES) return { error: 'brief had too many nodes' }
  if (nodes.length === 0) return { error: 'brief rendered nothing' }
  return { nodes }
}
