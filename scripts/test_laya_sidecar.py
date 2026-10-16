"""Regression check for the sidecar's accept backlog.

The fix that matters here is four lines: `Server.request_queue_size = 128`,
because socketserver's default LISTEN backlog of 5 refuses the connections of
any burst larger than 5 before a worker thread ever starts. Two ways that can
rot unnoticed:

  1. someone lowers the constant, or
  2. someone rebuilds the server as a plain `ThreadingHTTPServer` -- the class
     survives, still correct, and now nothing uses it.

(2) is the one a reader cannot see, so this asserts the wiring too. The stub
Router's sleep stands in for one serialised forward pass; a backlog bug only
shows up when the handler is slower than the accept loop.

Run: ~/venvs/laya/bin/python scripts/test_laya_sidecar.py
"""

from __future__ import annotations

import importlib.util
import pathlib
import socketserver
import sys
import time
import types
import unittest
from unittest import mock

SCRIPT = pathlib.Path(__file__).resolve().parent / "laya-sidecar.py"
EXPECTED_BACKLOG = 128


def _load_sidecar():
    """Import the sidecar as a real module with `laya` stubbed out.

    The real `laya` package loads checkpoints; this check only needs the HTTP
    layer, so a stub Router stands in and keeps the test dependency-free. The
    module name is not `__main__`, so the script's own `main()` call does not
    fire on import.
    """
    fake = types.ModuleType("laya")

    class StubRouter:
        loaded: list[str] = []

        def __init__(self, *_a, **_k) -> None:
            pass

        def predict(self, _state, questions):
            time.sleep(0.05)  # one serialised forward pass
            return {
                "routing": {"model": "stub"},
                "answers": {
                    q: {"type": "choice", "choice": "a", "probabilities": {"a": 1.0}, "confidence": 1.0}
                    for q in questions
                },
            }

    fake.Router = StubRouter
    spec = importlib.util.spec_from_file_location("laya_sidecar_under_test", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    with mock.patch.dict(sys.modules, {"laya": fake}):
        spec.loader.exec_module(module)
    return module


class AcceptBacklog(unittest.TestCase):
    def test_backlog_is_deeper_than_the_stdlib_default(self):
        sidecar = _load_sidecar()
        self.assertEqual(
            sidecar.Server.request_queue_size,
            EXPECTED_BACKLOG,
            "the sidecar must set its own request_queue_size on Server",
        )
        self.assertGreater(
            sidecar.Server.request_queue_size,
            socketserver.TCPServer.request_queue_size,
            "a backlog at or below the socketserver default sheds a burst before any worker runs",
        )

    def test_main_builds_the_server_with_the_deep_backlog_class(self):
        """(2): the class existing is not the same as main using it."""
        sidecar = _load_sidecar()
        built = []

        class Recorder(sidecar.Server):
            def __init__(self, addr, handler):
                built.append(addr)
                # Never bind: this asserts the wiring, not the socket.
                socketserver.BaseServer.__init__(self, addr, handler)

        with mock.patch.object(sys, "argv", ["laya-sidecar.py", "--port", "0"]):
            with mock.patch.object(sidecar, "Server", Recorder):
                with mock.patch.object(socketserver.BaseServer, "serve_forever", lambda self: None):
                    sidecar.main()
        self.assertEqual(len(built), 1, "main() must construct exactly one server")
        self.assertEqual(built[0], ("127.0.0.1", 0))


if __name__ == "__main__":
    unittest.main(verbosity=2)