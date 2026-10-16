"""Laya local sidecar: the System One wire on a laptop.

Serves the same POST /v1/systemone contract onegw forwards to TypeSafe Jev,
answered by the local `convaiinnovations/laya` weights instead of the hosted
API. The request and response shapes are identical by design — a client (this
repo's OnegwJudge, agentloop's guardrail screen) switches backends by changing
the base URL, never the code.

Run:  ~/venvs/laya/bin/python scripts/laya-sidecar.py [--port 8091]
Probe: curl -X POST 127.0.0.1:8091/v1/systemone -H 'Content-Type: application/json'
         -d '{"state":"...","model":"laya","questions":{"q":{"type":"score","instructions":"..."}}}'

This is the SOURCE copy. The one macOS actually runs is the installed
`~/.local/share/laya-sidecar/laya-sidecar.py`, started at login by the
launchd job `ai.hermes.laya-sidecar` on port 8092 and shared by hermes,
x-trader, sale-loop and xdev. Do not start a second instance: one resident
checkpoint is ~2.4 GB on a 16 GB Mac, and two hot ones ~3.2 GB. When you
change the request-handling path here, copy it over the installed file and
`launchctl kickstart -k gui/$(id -u)/ai.hermes.laya-sidecar`, then check
`curl -s http://127.0.0.1:8092/health`.

Tunables the launchd plist owns, not this script: LAYA_PRELOAD (which
checkpoints to prefer), LAYA_MAX_LOADED (how many stay resident) and
LAYA_EAGER (load at boot instead of on first request).
"""

from __future__ import annotations

import argparse
import json
import os
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from laya import Router


def _preload_names() -> list[str]:
    """Checkpoints to keep resident, from LAYA_PRELOAD (comma-separated)."""
    names = [n.strip() for n in os.environ.get("LAYA_PRELOAD", "english").split(",") if n.strip()]
    return names or ["english"]


def build_router() -> Router:
    """Build the router lazy, so only the checkpoint that answers stays resident.

    `Router(preload=True)` loads ALL THREE: measured phys_footprint 5.5 GB
    (peak 6.1 GB) for callers that only ever hit English, on a 16 GB Mac that
    already swaps. Lazy routing with max_loaded=1 measures 145 MB idle and
    2.4 GB once one checkpoint is live. The cost is a cold load on the first
    request after a restart — paid once, instead of at every boot.

    ponytail: keeps one checkpoint, so genuinely multilingual traffic pays a
    reload per language switch. Raise LAYA_MAX_LOADED (and accept the memory)
    if that traffic ever becomes real.
    """
    names = _preload_names()
    max_loaded = max(1, int(os.environ.get("LAYA_MAX_LOADED", "1")))
    router = Router(preload=False, max_loaded=max_loaded)
    if os.environ.get("LAYA_EAGER", "").strip().lower() in ("1", "true", "yes"):
        router.preload(names)
        print(f"laya eager: resident={','.join(router.loaded)}", flush=True)
    else:
        print(f"laya lazy: max_loaded={max_loaded} preferred={names} "
              f"(first request pays the cold load)", flush=True)
    return router


router = build_router()

# Serialises predict across request threads. ThreadingHTTPServer runs each
# request on its own thread and every one of them hits the same global
# `router`, but a Metal command buffer holds a single encoder: two threads
# encoding at once trip "A command encoder is already encoding to this command
# buffer" and kill the process (measured on M2 Pro, torch 2.14: 8 concurrent
# requests died after 2 replies, 20 sequential ones were clean). Serialising
# costs the queue, not the GPU — a request is 130-240 ms. GET /health takes no
# lock, so health checks stay responsive while predictions queue.
_PREDICT_LOCK = threading.Lock()


class Handler(BaseHTTPRequestHandler):
    server_version = "laya-sidecar/0.1"

    def log_message(self, *args: object) -> None:
        pass  # stdout stays a clean log of one line per request below

    def _send(self, status: int, payload: object) -> None:
        body = json.dumps(payload).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:  # noqa: N802 — http.server names the method
        if self.path == "/health":
            # `router.loaded` is a load ORDER, not a statement about which head
            # is usable: preloading a hub subfolder pulls the whole bundle, so
            # it can list names that are resident but not the ones we rely on.
            # Report the configured preload alongside it so a silent fallback
            # away from the expected head is visible from outside the process.
            self._send(200, {
                "ok": True,
                "model": "laya",
                "loaded": router.loaded,
                "preload": _preload_names(),
            })
        else:
            self._send(404, {"error": "not found"})

    def do_POST(self) -> None:  # noqa: N802 — http.server names the method
        if self.path != "/v1/systemone":
            self._send(404, {"error": "not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        try:
            body = json.loads(self.rfile.read(length) or b"{}")
        except (ValueError, OSError):
            self._send(400, {"error": "invalid JSON body"})
            return
        # System One callers send the input as `text`; Laya's own API calls it
        # `state`. Accept either so the contract and the model agree — sending
        # only `text` left `state` empty and the head answered a blank string.
        state = body.get("state")
        if state is None:
            state = body.get("text", "")
        questions = body.get("questions", {})
        if not isinstance(questions, dict) or not questions:
            self._send(400, {"error": "questions must be a non-empty map"})
            return
        # Laya's score head needs ordinal levels, but callers in the System One
        # contract (this repo's judgeQuestion, agentloop's guardrail battery)
        # send bare {"type": "score", "instructions": ...} with no levels. A
        # score question with no usable criteria raises inside the model
        # ("options exceed head_max_len" / NoneType iteration), so default one
        # here rather than 500: the 0–3 review scale this repo's Judge speaks.
        # Criteria ARE part of the question semantics, so an explicit criteria
        # is always honoured — this only fills the hole a bare question leaves.
        for qid, qdef in questions.items():
            if not isinstance(qdef, dict):
                continue
            if qdef.get("type") == "score" and not qdef.get("criteria"):
                qdef["criteria"] = ["low", "medium", "high", "critical"]
        started = time.perf_counter()
        try:
            with _PREDICT_LOCK:
                out = router.predict(state, questions)
        except Exception as e:  # noqa: BLE001 — a model failure is a 500, not a crash
            self._send(500, {"error": f"laya predict failed: {e}"})
            return
        ms = (time.perf_counter() - started) * 1000
        # Jev-shaped envelope: {model, answers, usage}. Laya's answers already
        # carry type/score/choice/probabilities/confidence per question id.
        self._send(200, {
            "model": (out.get("routing") or {}).get("model", "laya"),
            "answers": out.get("answers", {}),
            "usage": {"input_tokens": 0, "output_tokens": 0, "local_ms": round(ms, 1)},
        })
        print(f"systemone {len(questions)}q {ms:.0f}ms", flush=True)


class Server(ThreadingHTTPServer):
    """ThreadingHTTPServer with a deep accept backlog.

    socketserver's default `request_queue_size` is 5, and that is the LISTEN
    backlog, not the worker pool: a burst larger than 5 has its extra
    connections refused by the kernel before any worker thread starts.
    Measured against the deployed sidecar on this M2 Pro box: 120 concurrent
    requests dropped 40 at ~9 rps, while 60 concurrent lost none at ~35 rps.
    Deepening the backlog turns that loss into the queue the server already
    provides, and it stays bounded by `request_queue_size` — a saturated
    backlog still sheds load instead of growing threads without limit.
    """

    request_queue_size = 128


def main() -> None:
    parser = argparse.ArgumentParser(description="Laya local sidecar for POST /v1/systemone")
    parser.add_argument("--port", type=int, default=int(os.environ.get("PORT", "8091")))
    parser.add_argument("--host", default=os.environ.get("LAYA_HOST", "127.0.0.1"),
                        help="bind host; a container must use 0.0.0.0")
    args = parser.parse_args()
    server = Server((args.host, args.port), Handler)
    print(f"laya-sidecar listening on {args.host}:{args.port} "
          f"(resident: {','.join(router.loaded) or 'none — lazy'})", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
