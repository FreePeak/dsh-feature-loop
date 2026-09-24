/**
 * The `/loop` host command for the feature loop.
 *
 * Registered as its own cordis row (`feature-loop-command`) because the host
 * command registry owns `commands`, and the policy row (`feature-loop`) must
 * not inject it — the same separation the `feature-loop-remote` row exists
 * for. The handler is `executeLoopCommand` from the policy module: it returns
 * the task text for the composer to submit as the turn, so the loop policies
 * (ceilings, detectors, gate) apply to it exactly as to any typed request.
 *
 * @module @freepeak/dsh-feature-loop/command
 */

import type { Context } from '@deepseek-ai/cordis'
import { executeLoopCommand } from './plugin.ts'

/** The name cordis and the harness log address this plugin by. */
export const name = 'feature-loop-command'

/** The services this plugin reads. The command registry owns `commands`. */
export const inject = ['commands']

/**
 * Register the global `/loop` command.
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
        handler: (invocation: { rawInput: string }) => { kind: 'success' | 'error', text?: string }
      }): void
    }
  }).commands
  commands.register({
    name: 'loop',
    description: 'Run a task through the feature loop: bounded steps, cheap-first routing, and the review gate',
    input: { hint: '<task>' },
    handler: (invocation) => {
      const outcome = executeLoopCommand(invocation.rawInput)
      if ('kind' in outcome) return outcome
      // The composer submits the returned text as the turn, so the loop
      // policies apply to it exactly as to any typed request.
      return { kind: 'success', text: outcome.task }
    },
  })
}
