/**
 * The `/loop` and `/product` host commands for the feature loop.
 *
 * Registered as its own cordis row (`feature-loop-command`) because the host
 * command registry owns `commands`, and the policy row (`feature-loop`) must
 * not inject it — the same separation the `feature-loop-remote` row exists
 * for.
 *
 * ## Why the handler submits the turn itself
 *
 * The original handler returned the task text as a `success` result, on the
 * assumption that "the composer submits the returned text as the turn". It does
 * not. Measured on harness 0.2.0-rc.2: the composer's claimed-command path calls
 * `commands.execute()`, and `onSubmitSettled` renders a success result's `text`
 * as an inline NOTICE — `command/run` + `command/done`, no `turn/start`. A live
 * `/product` therefore produced a command row and nothing else, and the 0→1
 * pipeline never started. (`/goal` works because its handler mutates goal state
 * the host acts on, not because the composer promotes the text.)
 *
 * So the handler does what `dsh headless` does: it calls
 * `agent.followup(createUserMessage(...))`, which queues the task as the sole
 * ordinary message of its own turn and wakes the driver. The loop's policies
 * then apply to it exactly as to any typed request.
 *
 * The turn is started with `wakeup: false` semantics in one respect that
 * matters: the command must NOT block on `whenIdle()`. A five-phase pipeline
 * runs for many minutes, and the composer's submit transaction would hold its
 * `submitting` phase open for all of it, locking the input bar. Queuing and
 * returning is the whole handoff.
 *
 * @module @deepseek-ai/dsh-feature-loop/command
 */

import type { Context } from '@deepseek-ai/cordis'
import type { Agent } from '@deepseek-ai/dsh-agent'
import { createUserMessage } from '@deepseek-ai/dsh-llm'
import { executeLoopCommand, executeProductCommand } from './plugin.ts'

/** The name cordis and the harness log address this plugin by. */
export const name = 'feature-loop-command'

/** The services this plugin reads. The command registry owns `commands`. */
export const inject = ['commands']

/** One command's outcome, in the shape the registry normalizes. */
type CommandOutcome = { kind: 'success', text?: string } | { kind: 'error', text: string }

/**
 * Register the global `/loop` and `/product` commands.
 *
 * A plain function would be constructed with `new` by the cordis fiber
 * runner (every `function` has a prototype), and `new` on a function that
 * touches `ctx` throws `cannot get property without inject` — the fiber
 * context is not yet the intercept proxy inside a constructor call. An
 * arrow function has no prototype, so the runner calls it directly with
 * the live context. Same reason the harness's own command plugins export
 * plain `apply` functions transpiled without prototypes.
 *
 * The loader unwraps `default` before reading `inject`, so this module
 * must NOT have a default export — otherwise the runner reads inject off
 * the bare function (undefined) instead of the module namespace. The
 * remote row works the same way: `remote.mjs` has no default export
 * either (check: it exports the class, not a default).
 *
 * @param ctx - the cordis context to register into.
 */
export const apply = (ctx: Context): void => {
  const commands = (ctx as unknown as {
    commands: {
      register(def: {
        name: string
        description: string
        input?: { hint: string }
        handler: (invocation: { agent: Agent, rawInput: string }) => CommandOutcome | Promise<CommandOutcome>
      }): void
    }
  }).commands

  /**
   * Build one handler: validate the argument text, then start the turn.
   *
   * Validation stays in the pure `execute*Command` functions so the argument
   * grammar is testable with no cordis, no agent and no network — that is what
   * `test/loop-command.test.ts` exercises. This wrapper owns only the handoff.
   */
  const submit = (
    run: (raw: string) => { task: string } | { kind: 'error', text: string },
  ) => (invocation: { agent: Agent, rawInput: string }): CommandOutcome => {
    const outcome = run(invocation.rawInput)
    if ('kind' in outcome) return outcome
    // Queue the task as its own turn and wake the driver. `followup` is the
    // documented seam for "this becomes the sole ordinary message of its own
    // turn" — the same call `dsh headless` makes for its one task.
    try {
      invocation.agent.followup(createUserMessage({
        content: [{ type: 'text', text: outcome.task }],
        // Attributed to the plugin, not to `user`: the human typed
        // `/product <goal>`, and the expanded task text is this plugin's
        // construction. A `user` source would put words in their mouth in the
        // durable log.
        source: { kind: 'plugin:feature-loop', form: 'notice', summary: `/${'product'}: task submitted to the loop` },
      }))
    } catch (error: unknown) {
      // A refused handoff is the one failure the human must see: the composer
      // keeps the draft on an `error` result, so the line is not lost.
      return {
        kind: 'error',
        text: `the loop could not start: ${error instanceof Error ? error.message : String(error)}`,
      }
    }
    return { kind: 'success', text: 'the loop is running — the gate will ask before anything irreversible' }
  }

  commands.register({
    name: 'loop',
    description: 'Run a task through the feature loop: bounded steps, cheap-first routing, and the review gate',
    input: { hint: '<task>' },
    handler: submit(executeLoopCommand),
  })

  // The 0→1 pipeline's front door. Without it the pipeline is reachable only by
  // editing the patch row, which is a configuration act rather than the "one
  // sentence starts the run" the PRD promises.
  commands.register({
    name: 'product',
    description: 'Build a product end to end: research, PRD, implement, test, and a pull request',
    input: { hint: '<goal>' },
    handler: submit(executeProductCommand),
  })
}
