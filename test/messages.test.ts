/**
 * The notices the loop injects into the model's own turn.
 *
 * These strings are not logging. They are spliced into the session log as
 * `user/message` rows and read by the model as instructions, so a wording bug
 * here changes what the agent DOES — which is how a review notice ended a
 * productive turn in the middle of a task.
 */

import { strict as assert } from 'node:assert'
import { test } from 'node:test'
import { budgetStopText, escalationText, reviewText } from '../src/messages.ts'

test('a judge review does not tell the model to stop; a gate review still does', () => {
  // The live 2026-10-04 failure: the judge scored an `ls` at 1.1/3, the notice
  // said "if the step was not consistent with the goal, stop and report what you
  // have instead", and the model's next message was "Stopping here for review
  // rather than continuing" — the turn ended one step in, and the run was
  // recorded `goal-met` with none of the three files written. Nothing blocked
  // the loop: the notice's own wording did.
  const judge = reviewText('the local judge scored this step 1.1/3', 'judge')
  assert.ok(!/stop and report/i.test(judge), `a judge flag must not read as a stop: ${judge}`)
  assert.match(judge, /will keep going/i, 'and it must say what actually happens')

  // The gate's ask is the one where the tool call really is blocked, so the
  // stop wording stays there.
  for (const source of ['policy', 'signal', 'checkpoint', 'operator']) {
    assert.match(reviewText(`${source} reason`, source), /stop and report/i, `${source} keeps the stop wording`)
  }
})

test('a ceiling stop is still an instruction to stop', () => {
  // The one notice that DOES block, so it must keep the imperative.
  assert.match(budgetStopText('the step ceiling is 15'), /final step/i)
  assert.match(budgetStopText('the step ceiling is 15'), /do not start new work/i)
})

test('an escalation names the route it left and the one now in use', () => {
  assert.match(escalationText('cheap/execution', 'strong/execution', 'the ladder moved'), /cheap\/execution/)
  assert.match(escalationText('cheap/execution', 'strong/execution', 'the ladder moved'), /strong\/execution/)
})
