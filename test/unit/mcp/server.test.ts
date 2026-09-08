import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { beforeEach, describe, expect, it } from "vitest";
import { FakeLive } from "../../../src/adapters/fake/fake-live.js";
import { createMcpServer } from "../../../src/mcp/server.js";
import { createToolDeps } from "../../../src/mcp/tools/deps.js";
import type { ToolDeps } from "../../../src/mcp/tools/types.js";

function buildDeps(fake: FakeLive): ToolDeps {
  return createToolDeps(fake);
}

async function connect(fake: FakeLive): Promise<Client> {
  const server = createMcpServer(buildDeps(fake));
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  const client = new Client({ name: "test-client", version: "0.0.0" });
  await client.connect(clientTransport);
  return client;
}

async function call(client: Client, name: string, args: Record<string, unknown> = {}) {
  const res = (await client.callTool({ name, arguments: args })) as {
    content: Array<{ type: string; text: string }>;
    isError?: boolean;
  };
  return { payload: JSON.parse(res.content[0].text), isError: res.isError ?? false };
}

describe("MCP server over in-memory transport", () => {
  let fake: FakeLive;
  let client: Client;

  beforeEach(async () => {
    fake = new FakeLive();
    client = await connect(fake);
  });

  it("lists the 23 tools", async () => {
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual(
      [
        "create_audio_clip",
        "create_arrangement_midi_clip",
        "create_midi_clip",
        "create_scenes",
        "create_tracks",
        "delete_clips",
        "delete_device",
        "delete_scenes",
        "delete_tracks",
        "edit_clip_notes",
        "get_clip",
        "get_device",
        "get_set",
        "get_track",
        "insert_device",
        "replace_clip_notes",
        "set_device_params",
        "set_mixer",
        "set_simpler_sample",
        "update_clip",
        "update_scene",
        "update_song",
        "update_track",
      ].sort(),
    );
  });

  it("publishes conservative read, write, and destructive hints", async () => {
    const { tools } = await client.listTools();
    const byName = new Map(tools.map((tool) => [tool.name, tool]));

    expect(byName.get("get_set")?.annotations).toMatchObject({
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    });
    expect(byName.get("update_track")?.annotations).toMatchObject({
      readOnlyHint: false,
      destructiveHint: false,
      idempotentHint: false,
      openWorldHint: false,
    });
    expect(byName.get("delete_tracks")?.annotations).toMatchObject({
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    });
  });

  it("publishes adapter capabilities and the current Set as resources", async () => {
    const { resources } = await client.listResources();
    expect(resources.map((resource) => resource.uri).sort()).toEqual([
      "ableton://capabilities",
      "ableton://set",
    ]);

    const capabilityResult = await client.readResource({
      uri: "ableton://capabilities",
    });
    const capabilityText = capabilityResult.contents[0];
    expect(capabilityText).toMatchObject({
      uri: "ableton://capabilities",
      mimeType: "application/json",
    });
    const capabilities = JSON.parse(
      capabilityText && "text" in capabilityText ? capabilityText.text : "{}",
    );
    expect(capabilities).toMatchObject({
      schema: "live-mcp-capabilities/v1",
      adapter: { id: "fake-live", apiVersion: "1.0.0", evidence: "simulated" },
      mutationQueue: { active: null, waiting: 0 },
    });
    expect(capabilities.tools).toHaveLength(23);
    expect(capabilities.unavailableInOfficialApi).toContain("transport");

    const setResult = await client.readResource({ uri: "ableton://set" });
    const setContent = setResult.contents[0];
    const set = JSON.parse(setContent && "text" in setContent ? setContent.text : "{}");
    expect(set.metadataTrust).toMatch(/untrusted data/);
    expect(set.set.tempo).toBe(120);
  });

  it("edit_clip_notes round-trip returns only clipId and noteCount", async () => {
    await call(client, "create_tracks", { tracks: [{ type: "midi" }] });
    await call(client, "create_scenes", { count: 1 });
    const created = await call(client, "create_midi_clip", {
      trackId: "t1",
      sceneId: "s1",
      lengthBeats: 4,
      notes: [
        [36, 0, 0.5, 100],
        [42, 0.5, 0.25, 60],
      ],
    });
    const edited = await call(client, "edit_clip_notes", {
      clipId: created.payload.clip.id,
      select: { pitchMin: 42 },
      remove: true,
    });
    expect(edited.payload).toEqual({
      ok: true,
      clipId: created.payload.clip.id,
      noteCount: 1,
    });
  });

  it("get_set returns the snapshot in an ok envelope", async () => {
    const { payload, isError } = await call(client, "get_set");
    expect(isError).toBe(false);
    expect(payload.ok).toBe(true);
    expect(payload.set.tempo).toBe(120);
  });

  it("create_tracks → create_scenes → create_midi_clip round-trip", async () => {
    await call(client, "create_tracks", { tracks: [{ type: "midi", name: "Drums" }] });
    await call(client, "create_scenes", { count: 1 });
    const { payload } = await call(client, "create_midi_clip", {
      trackId: "t1",
      sceneId: "s1",
      lengthBeats: 4,
      notes: [[36, 0, 0.5, 100]],
      name: "Kick",
    });
    expect(payload.ok).toBe(true);
    expect(payload.clip.id).toBe("c1");
    expect(fake.undoSteps).toEqual([
      "create_tracks",
      "create_scenes",
      "create_midi_clip",
    ]);
  });

  it("locates a clip by current names and one-based scene number after a rename", async () => {
    await call(client, "create_tracks", { tracks: [{ type: "midi", name: "Bass" }] });
    await call(client, "create_scenes", { count: 2 });
    const created = await call(client, "create_midi_clip", {
      trackId: "t1",
      sceneId: "s2",
      lengthBeats: 16,
      notes: [[27, 0, 4, 100]],
    });
    await call(client, "update_scene", { sceneId: "s2", name: "Bass audition" });
    await call(client, "update_track", { trackId: "t1", name: "Renamed bass" });
    const undoCount = fake.undoSteps.length;
    const result = await call(client, "get_clip", { clipId: created.payload.clip.id });
    expect(result.isError).toBe(false);
    expect(result.payload.location).toEqual({
      view: "session",
      trackName: "Renamed bass",
      sceneName: "Bass audition",
      sceneNumber: 2,
    });
    expect(fake.undoSteps).toHaveLength(undoCount);
  });

  it("creates, locates, edits and deletes Arrangement MIDI without touching Session", async () => {
    await call(client, "create_tracks", { tracks: [{ type: "midi", name: "Bass" }] });
    const args = {
      trackId: "t1",
      startBeat: 132,
      lengthBeats: 16,
      notes: [[27, 0, 4, 100]],
      name: "Phrase",
    };
    const created = await call(client, "create_arrangement_midi_clip", args);
    expect(created.isError).toBe(false);
    expect(created.payload.clip).toMatchObject({
      sceneId: null,
      startBeat: 132,
      endBeat: 148,
      looping: false,
    });
    const id = created.payload.clip.id;
    const read = await call(client, "get_clip", { clipId: id });
    expect(read.payload.location).toEqual({
      view: "arrangement",
      trackName: "Bass",
      startBeat: 132,
      endBeat: 148,
    });
    const track = await call(client, "get_track", { trackId: "t1" });
    expect(track.payload.track.clipCount).toBe(0);
    expect(track.payload.track.arrangementClips).toHaveLength(1);
    const count = fake.undoSteps.length;
    const overlap = await call(client, "create_arrangement_midi_clip", {
      ...args,
      startBeat: 140,
    });
    expect(overlap.payload.code).toBe("CONFLICT");
    const outside = await call(client, "create_arrangement_midi_clip", {
      ...args,
      startBeat: 160,
      notes: [[27, 15, 2, 100]],
    });
    expect(outside.payload.code).toBe("INVALID_INPUT");
    expect(fake.undoSteps).toHaveLength(count);
    const adjacent = await call(client, "create_arrangement_midi_clip", {
      ...args,
      startBeat: 148,
    });
    expect(adjacent.isError).toBe(false);
    await call(client, "edit_clip_notes", { clipId: id, transform: { transpose: 12 } });
    expect(
      (await call(client, "get_clip", { clipId: id })).payload.clip.notes[0][0],
    ).toBe(39);
    await call(client, "delete_clips", { clipIds: [id] });
    expect((await call(client, "get_clip", { clipId: id })).payload.code).toBe(
      "NOT_FOUND",
    );
    expect(
      (await call(client, "get_track", { trackId: "t1" })).payload.track.arrangementClips,
    ).toHaveLength(1);
  });

  it("stale ID surfaces as structured NOT_FOUND with isError", async () => {
    const { payload, isError } = await call(client, "get_track", { trackId: "t9" });
    expect(isError).toBe(true);
    expect(payload).toMatchObject({ ok: false, code: "NOT_FOUND" });
    expect(payload.hint).toContain("get_set");
  });

  it("device round-trip: insert, tweak, read, mixer", async () => {
    await call(client, "create_tracks", { tracks: [{ type: "midi", name: "Pad" }] });
    const inserted = await call(client, "insert_device", {
      trackId: "t1",
      device: "Reverb",
    });
    expect(inserted.payload.ok).toBe(true);
    const deviceId = inserted.payload.device.id;

    const tweaked = await call(client, "set_device_params", {
      deviceId,
      params: { "Dry/Wet": 0.25 },
    });
    expect(tweaked.payload).toMatchObject({
      ok: true,
      deviceId,
      changed: { "Dry/Wet": 0.25 },
    });

    const detail = await call(client, "get_device", { deviceId });
    expect(
      detail.payload.device.params.find((p: { name: string }) => p.name === "Dry/Wet")
        .value,
    ).toBe(0.25);

    const mixed = await call(client, "set_mixer", {
      updates: [{ trackId: "t1", volume: 0.5, sends: [{ returnId: "r1", value: 0.2 }] }],
    });
    expect(mixed.payload).toMatchObject({ ok: true, updated: ["t1"] });
    expect(fake.undoSteps).toEqual([
      "create_tracks",
      "insert_device",
      "set_device_params",
      "set_mixer",
    ]);
  });
});
