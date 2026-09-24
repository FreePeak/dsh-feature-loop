/**
 * The Host→browser change event for the feature loop's live state.
 *
 * The dashboard used to poll: the client called `live()` every two seconds
 * because there was no way for the Host to say "something changed". This is
 * that way. It follows the harness's own event pattern exactly — a cordis
 * `Events` entry marked `@mode emit` (the marker is what makes an event
 * forwardable), plus a `TypertRemoteEventSelection` opt-in so a client remote
 * may `$on` it.
 *
 * Reference implementation read in the harness:
 * `packages/api/session-controller/src/types.ts` (`@mode emit` declaration),
 * `.../src/remote-events.ts` (the selection opt-in),
 * `.../src/index.ts` (`ctx.emit(...)` from an existing hook), consumed in the
 * browser by `ui-goal` with `ctx.remote.$on('goal/activation-changed', …)`.
 *
 * The payload is deliberately empty. The browser answers a change by re-reading
 * `live()` — one authoritative snapshot, not a second serialisation of the
 * state that could disagree with the first. An empty signal cannot go stale in
 * transit; a duplicated snapshot can.
 *
 * @module dsh-feature-loop/change-event
 */

declare module '@deepseek-ai/cordis' {
  interface Events {
    /**
     * The feature loop's live state changed; re-read it.
     *
     * Emitted COALESCED: a single run step can mutate the state many times, and
     * one event per mutation would flood the browser with frames that all say
     * the same thing. At most one event per window, with a trailing event so
     * the final change is never the one that gets dropped.
     *
     * @mode emit
     */
    'featureLoop/changed'(): void
  }
}

declare module '@deepseek-ai/dsh-typert-protocol' {
  interface TypertRemoteEventSelection {
    'featureLoop/changed': true
  }
}

/** Shortest gap between two change events, in ms. */
export const CHANGE_EMIT_INTERVAL_MS = 250

/**
 * Create a coalescing emitter over a Host context.
 *
 * The first change inside a window emits immediately (so an idle dashboard
 * updates with no delay); changes inside the window set a trailing timer instead
 * (so a burst of ten steps costs one event plus one more, not eleven). The timer
 * is unref'd — a pending trailing emit must not hold the process open.
 *
 * @param emit - the Host's `ctx.emit`, injected so this is testable with no ctx.
 * @returns the notifier to call after every state mutation.
 */
export function createChangeEmitter(emit: () => void, intervalMs: number = CHANGE_EMIT_INTERVAL_MS): () => void {
  let lastEmit = 0
  let timer: NodeJS.Timeout | undefined
  return () => {
    if (timer !== undefined) return // a trailing emit is already scheduled
    const since = Date.now() - lastEmit
    if (since >= intervalMs) {
      lastEmit = Date.now()
      emit()
      return
    }
    timer = setTimeout(() => {
      timer = undefined
      lastEmit = Date.now()
      emit()
    }, intervalMs - since)
    timer.unref?.()
  }
}

export {}
