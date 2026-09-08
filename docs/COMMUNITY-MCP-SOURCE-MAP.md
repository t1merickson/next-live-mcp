# Community MCP source map

This is the compact replacement for the 17 disposable repository clones used in the
2026-09-07 survey. It preserves the useful parts as commit-pinned links and original
design notes instead of keeping 143 MB of working trees. The authoritative project list,
licenses, and adoption decisions remain in [`PRIOR-ART.md`](PRIOR-ART.md).

No third-party code is reproduced here. Repositories with no license at the snapshot are
comparison-only. A future code import still requires source-path, commit, license, and
destination attribution in `NOTICE.md`/`PRIOR-ART.md`.

## Patterns worth reopening

### One mutation lane and failure-tolerant backpressure

Source: Loophole's
[`write-queue.ts`](https://github.com/OthmanAdi/loophole/blob/cae93f433ecd85b801ac749bcd3926e370f02db7/packages/extension/src/adapter/write-queue.ts)
and its
[`write-queue.test.ts`](https://github.com/OthmanAdi/loophole/blob/cae93f433ecd85b801ac749bcd3926e370f02db7/packages/extension/src/adapter/write-queue.test.ts).

The valuable invariant is global serialization, not a specific class: all writes share
one FIFO; reads bypass it; capacity is bounded; a rejected task rejects only its caller;
and the tail itself always settles so the next write can run. This project implements
that invariant independently in `src/mcp/mutation-queue.ts`.

```text
enqueue(write):
  reject when pending reaches the configured bound
  result = tail.then(write, write)
  tail = result.then(ignore_success, ignore_failure)
  return result; always decrement pending on settlement
```

### Opaque, session-bound object references

Source: Loophole's
[`reference-service.ts`](https://github.com/OthmanAdi/loophole/blob/cae93f433ecd85b801ac749bcd3926e370f02db7/packages/extension/src/adapter/reference-service.ts)
and
[`references.ts`](https://github.com/OthmanAdi/loophole/blob/cae93f433ecd85b801ac749bcd3926e370f02db7/packages/core/src/references.ts).

Useful rules: expose typed opaque tokens rather than paths or raw handles; bind a token
to both object identity and a handle fingerprint; re-resolve before use; distinguish
wrong-kind from stale-reference errors; bound active and lifetime issuance; never recycle
a retired token within the session. Our current short IDs are lighter-weight; this is the
reference if capability-grade IDs become necessary.

### Musical notation as a tested language boundary

Source: Producer Pal's
[`barbeat-grammar.peggy`](https://github.com/adamjmurray/producer-pal/blob/156b8386a9a805835feea57e05a46abdec4f491e/src/notation/barbeat/parser/barbeat-grammar.peggy),
[`barbeat-serializer.ts`](https://github.com/adamjmurray/producer-pal/blob/156b8386a9a805835feea57e05a46abdec4f491e/src/notation/barbeat/serializer/barbeat-serializer.ts),
and
[`round-trip property tests`](https://github.com/adamjmurray/producer-pal/blob/156b8386a9a805835feea57e05a46abdec4f491e/src/notation/tests/grammar-roundtrip-property.test.ts).

The lesson is to treat compact musical notation as a language with a grammar, canonical
serializer, round-trip properties, pathological-input tests, and notation-neutral tool
semantics. Do not add shorthand directly inside MCP handlers. Keep the current tuple
format stable; experiment with richer notation as a pure, separately tested layer.

### Optional Max adapter with a narrow queue boundary

Source: LiveWire's Extension-side
[`ws-bridge.ts`](https://github.com/pnomolos/live-wire/blob/7fc8b06dd1c9a0d14bb7bbe4843160a03c93d8ec/extension/src/ws-bridge.ts),
Max-side
[`livewire-ws.js`](https://github.com/pnomolos/live-wire/blob/7fc8b06dd1c9a0d14bb7bbe4843160a03c93d8ec/m4l-devices/LiveWire%20Proxy/livewire-ws.js),
and audio analyzer
[`livewire.js`](https://github.com/pnomolos/live-wire/blob/7fc8b06dd1c9a0d14bb7bbe4843160a03c93d8ec/m4l-devices/LiveWire%20Audio%20Analyzer/livewire.js).

The useful split is an explicit request/response adapter with IDs, deadlines, pending
request cleanup, one in-flight Max dictionary exchange, heartbeats, and a clear disconnect
failure. If we add launch/transport/meters, keep the official Extension adapter as the
editing authority and expose Max as a named, health-checked capability rather than a
second hidden implementation of the same writes.

### Capability negotiation, receipts, and semantic diffs

Source: Ableton MCP Beyond's
[`capability manifest`](https://github.com/user1303836/ableton-mcp-beyond/blob/e3e04754442518a90988160231c92da84cac8cb9/docs/evidence/capability-manifest.json),
[`remote adapter`](https://github.com/user1303836/ableton-mcp-beyond/blob/e3e04754442518a90988160231c92da84cac8cb9/apps/mcp-server/src/bridge/remote-adapter.ts),
[`semantic diff`](https://github.com/user1303836/ableton-mcp-beyond/blob/e3e04754442518a90988160231c92da84cac8cb9/apps/mcp-server/src/project-semantic-diff.ts),
and
[`session MIDI transaction`](https://github.com/user1303836/ableton-mcp-beyond/blob/e3e04754442518a90988160231c92da84cac8cb9/apps/mcp-server/src/transactions/session-midi.ts).

Useful ideas: capabilities should include provenance and health; reconnects need an epoch
so an old authority cannot cross a bridge restart; consequential writes should return a
receipt with requested delta, observed readback, and an honest undo statement; large Set
diffs need deterministic identities, bounds, and duplicate-name tests. The current
`ableton://capabilities` resource is the first slice of this direction.

### Remote Script command contracts

Source: Ableton-Live-MCP's
[`dispatcher.py`](https://github.com/rephlex187/Ableton-Live-MCP/blob/5e423f94929b2db536f0f513b23ddbb3e40202c3/AbletonMCP_Remote_Script/dispatcher.py)
and paired
[`dispatcher tests`](https://github.com/rephlex187/Ableton-Live-MCP/blob/5e423f94929b2db536f0f513b23ddbb3e40202c3/tests/remote_script/test_dispatcher.py).

If a legacy adapter is ever necessary, use one versioned dispatcher with explicit handler
registration and paired tests on both sides of the wire. Do not let MCP tools know the
socket protocol or import Live's Python surface directly.

### Offline `.als` inspection

Source: wstierhout's
[`_als_parse.py`](https://github.com/wstierhout/ableton-live-mcp/blob/2e4413d316e63f3a501effcc051e9a981d4907ff/ableton_live_mcp/tools/_als_parse.py),
[`_als_xml.py`](https://github.com/wstierhout/ableton-live-mcp/blob/2e4413d316e63f3a501effcc051e9a981d4907ff/ableton_live_mcp/tools/_als_xml.py),
and
[`offline tests`](https://github.com/wstierhout/ableton-live-mcp/blob/2e4413d316e63f3a501effcc051e9a981d4907ff/tests/test_offline.py).

Offline analysis is a different authority domain from editing the open Set. If adopted,
make it a read-only file workflow with explicit format/version limits and bounded output;
do not imply that parsed XML is equivalent to Live's current object model.

### Browser traversal and caching

Source: ahujasid's Remote Script
[`__init__.py`](https://github.com/ahujasid/ableton-mcp/blob/8731a47a415f1590f50bdb3b4ac4f06d8328cf0b/AbletonMCP_Remote_Script/__init__.py)
and MCP
[`server.py`](https://github.com/ahujasid/ableton-mcp/blob/8731a47a415f1590f50bdb3b4ac4f06d8328cf0b/MCP_Server/server.py).

The reusable concept is URI-first selection with bounded traversal and caching, followed
by a fresh validity check before loading. Browser access is absent from Extensions API
1.0.0, so this remains an optional-adapter design source, not a reason to widen the core.

### Bridge-neutral HTTP contracts and observability

Source: jterratsdev's
[`http_bridge.py`](https://github.com/jterratsdev/ableton-live-mcp/blob/87519d288a65484dcfb1f0f53605e53484b08dc5/ableton_remote_scripts/AbletonMcpBridge/http_bridge.py),
[`capability-resolver.js`](https://github.com/jterratsdev/ableton-live-mcp/blob/87519d288a65484dcfb1f0f53605e53484b08dc5/src/capability-resolver.js),
and
[`observability.js`](https://github.com/jterratsdev/ableton-live-mcp/blob/87519d288a65484dcfb1f0f53605e53484b08dc5/bridge/observability.js).

Keep bridge protocols small, versioned, and independent from MCP presentation. Health
and edition capability should be data, not inferred from whether a call happened to work.

## Secondary comparison links

These projects remain useful for a focused re-check, but their main contribution is
already captured by the patterns above or by this project's current implementation:

- [idx3d/ableton-mcp-extension at the imported spine commit](https://github.com/idx3d/ableton-mcp-extension/tree/37ec2cb0a3d3577d36d47110d6010f1d9acd8c62)
- [ulm0/ableton-live-mcp minimal official-SDK host](https://gitlab.com/ulm0/ableton-live-mcp/-/tree/a708580923bb00d0ab7aa6c511cbcad64bbdfa7f)
- [bschoepke/ableton-live-mcp audio tap and workflow bridge](https://github.com/bschoepke/ableton-live-mcp/tree/70f7df9192b78d9bd9405f369c9e046c88f1610e)
- [hidingwill/AbletonBridge capability inventory](https://github.com/hidingwill/AbletonBridge/tree/01c31c4ea4644588b62b1157b99cc885e27ec91f)
- [wolfiesch/Ableton-MCP installer and tests](https://github.com/wolfiesch/Ableton-MCP/tree/32ee12e631b62dad17cda1c43fd2e259b28a367e)
- [nicholasbien/ableton-mcp-pro concise capability surface](https://github.com/nicholasbien/ableton-mcp-pro/tree/0d56baae49e2d11efa9ac141b2ce1af451942065)

The following snapshots had no license file and remain comparison-only; do not copy code:

- [jasper-zheng/ableton-sdk-mcp](https://github.com/jasper-zheng/ableton-sdk-mcp/tree/f74fa5088cec3ff35b36cfab45b56caf93359de6)
- [bassDaddyDevices/able-mcp](https://github.com/bassDaddyDevices/able-mcp/tree/03c08892d7a93e28bdbae7faf2cf6499872724e0)
- [jon-wrennall/ableton-mcp-extended](https://github.com/jon-wrennall/ableton-mcp-extended/tree/9d8302c6a307ccf1e0354d0ac6f0dc08d908f247)

## Reacquire an exact snapshot

Use a temporary directory and the origin/commit in `PRIOR-ART.md`:

```sh
git clone --filter=blob:none <origin-url> <temporary-directory>
git -C <temporary-directory> checkout --detach <full-commit-id>
```

Verify the license again before copying anything; upstream licensing and repository
contents can change even though the pinned commit does not.
