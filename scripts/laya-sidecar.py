"""Laya local sidecar: the System One wire on a laptop.

Serves the same POST /v1/systemone contract onegw forwards to TypeSafe Jev,
answered by the local `convaiinnovations/laya` weights instead of the hosted
API. The request and response shapes are identical by design — a client (this
repo's OnegwJudge, agentloop's guardrail screen) switches backends by changing
the base URL, never the code.

Run:  ~/venvs/laya/bin/python scripts/laya-sidecar.py [--port 8091]
Probe: curl -X POST 127.0.0.1:8091/v1/systemone -H 'Content-Type: application/json'
         -d '{"state":"...","model":"laya","questions":{"q":{"type":"score","instructions":"..."}}}'
"""

from __future__ import annotations

import argparse
import json
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from laya import Router

router = Router(preload=True)


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
            self._send(200, {"ok": True, "model": "laya"})
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
        state = body.get("state", "")
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


def main() -> None:
    parser = argparse.ArgumentParser(description="Laya local sidecar for POST /v1/systemone")
    parser.add_argument("--port", type=int, default=8091)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    print(f"laya-sidecar listening on 127.0.0.1:{args.port} (preload warm)", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
