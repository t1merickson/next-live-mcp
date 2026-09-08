# Getting started for agents: writing music with Ableton MCP

This guide is for an agent connected to a musician's open Ableton Live Set. The goal is
not merely to make valid API calls; it is to make coherent, audible, reversible musical
changes while keeping the musician oriented and in control.

The examples assume the official Extensions SDK adapter and the current 23-tool surface.
Client syntax varies, so examples show tool names and JSON arguments rather than a
client-specific wrapper.

## Connection preflight

Before touching the Set:

- Confirm Live is open and the Ableton MCP Extension is active.
- List MCP tools and resources. The current core advertises 23 tools plus
  `ableton://capabilities` and `ableton://set`.
- If the endpoint is unavailable, ask the musician to check the Extension status in
  Live. Do not launch applications or change Live settings without their knowledge.
- If authentication fails, have the musician refresh the client's local token
  configuration. Never ask them to paste the real bearer token into the conversation.
- Read `ableton://capabilities` before interpreting a missing function. Optional adapters
  must appear there with provenance and health; their presence must never be guessed.

## The operating loop

1. **Discover.** Read `ableton://capabilities`, then `ableton://set` or call `get_set`.
   Never infer support, IDs, parameter names, or the state of the Set from an earlier
   conversation.
2. **Frame the musical move.** State a compact intention: tempo, meter, length, role of
   each part, harmonic center, and what existing material must remain untouched.
3. **Build a reversible slice.** Prefer new, clearly named tracks/scenes for exploratory
   work. Group related values into the batch tools so one musical move is one undo step.
4. **Read back.** Re-read the changed track, clip, device, or Set. A successful tool
   response proves the call returned; readback proves the intended state landed.
5. **Listen with the human.** The official adapter cannot launch clips or control
   transport. Ask the musician to launch the Scene and give perceptual feedback, unless
   capability discovery explicitly reports a tested optional transport adapter.
6. **Revise surgically.** Use `edit_clip_notes`, named parameter edits, or a batch mixer
   adjustment rather than rebuilding material that already works.
7. **Hand off honestly.** Summarize what changed, what was verified by readback, what was
   actually heard, the known undo boundary, and whether the Set remains unsaved.

## Non-negotiable behavior

- Call `get_set` at the start of every working session and again after a reconnect or Set
  switch. IDs are session-scoped capabilities, not durable database keys.
- Never guess an ID. Use `get_set`, then `get_track`, `get_clip`, or `get_device` to drill
  down.
- Never guess device parameter names or ranges. Insert the device, inspect it with
  `get_device`, then write exact names and in-range raw values.
- Preserve existing tracks and clips unless the musician explicitly asked to alter them.
  For an open-ended sketch, add material with an obvious prefix and use a new Scene.
- Treat delete, replace-all-notes, and duplication as consequential. Re-read the target
  immediately before the write.
- Do not claim something sounds good, plays correctly, or is audible from API success.
  That requires playback plus a human report or a tested audio-analysis adapter.
- Do not claim the Set is saved. This MCP surface has no save tool.
- Keep credentials out of chat and output. The bearer token is an access capability.

## MIDI representation

MIDI notes use compact tuples:

```text
[pitch, startBeat, durationBeats, velocity]
[pitch, startBeat, durationBeats, velocity, {prob?, velDev?, muted?, relVel?}]
```

Times are beats from the clip start. In 4/4, a four-bar loop is 16 beats. Middle C is
pitch 60. Prefer a small number of intentional velocity levels over random noise; add
probability or velocity deviation only when it serves the groove.

## Session versus Arrangement

Choose the view that matches the musician's workflow; do not create Session clips for an
Arrangement-only user.

- Session creation uses `create_midi_clip` with `trackId` + `sceneId`.
- Arrangement creation uses `create_arrangement_midi_clip` with `trackId` + zero-based
  song `startBeat`. Note times remain relative to the new clip, not the song timeline.
- Call `get_track` to inspect existing Arrangement clip intervals before choosing a
  range. Overlap returns `CONFLICT`; it never replaces existing material.
- `get_clip` reports the current view and location. Once an Arrangement clip has an ID,
  `edit_clip_notes`, `replace_clip_notes`, `update_clip`, and `delete_clips` use the same
  workflow as Session clips.
- MCP cannot reveal a clip, switch Live's view, activate Back to Arrangement, or control
  transport. Keep those as explicit human handoffs unless a tested optional adapter is
  advertised.

## First sketch: a four-bar house foundation

This is a workflow pattern, not a fixed composition recipe. Names and returned IDs are
examples; always use the actual values returned by Live.

### 1. Inspect and set the frame

Call `get_set`. If the musician requested 128 BPM:

```json
{ "tool": "update_song", "arguments": { "tempo": 128 } }
```

Choose an existing empty Scene or create one. Rename it so the work is easy to find:

```json
{
  "tool": "update_scene",
  "arguments": { "sceneId": "<scene-id>", "name": "Agent Sketch - 128" }
}
```

### 2. Add roles, not anonymous tracks

Create the rhythm and harmony lanes together:

```json
{
  "tool": "create_tracks",
  "arguments": {
    "tracks": [
      { "type": "midi", "name": "Agent Kick" },
      { "type": "midi", "name": "Agent Hats" },
      { "type": "midi", "name": "Agent Bass" },
      { "type": "midi", "name": "Agent Chord" }
    ]
  }
}
```

Capture the returned track IDs. Insert only built-in Live devices by exact browser name.
After each `insert_device`, retain the returned device ID and call `get_device` before
setting parameters.

### 3. Write rhythm in musical units

A four-on-the-floor kick in a four-beat loop:

```json
{
  "tool": "create_midi_clip",
  "arguments": {
    "trackId": "<kick-track-id>",
    "sceneId": "<scene-id>",
    "lengthBeats": 4,
    "name": "Four on the Floor",
    "notes": [
      [36, 0, 0.25, 112],
      [36, 1, 0.25, 108],
      [36, 2, 0.25, 112],
      [36, 3, 0.25, 108]
    ]
  }
}
```

Offbeat closed hats:

```json
{
  "tool": "create_midi_clip",
  "arguments": {
    "trackId": "<hat-track-id>",
    "sceneId": "<scene-id>",
    "lengthBeats": 4,
    "name": "Offbeat Hats",
    "notes": [
      [42, 0.5, 0.125, 82],
      [42, 1.5, 0.125, 88],
      [42, 2.5, 0.125, 80],
      [42, 3.5, 0.125, 90]
    ]
  }
}
```

For bass and chords, decide the pitch collection first. A minimal part with rests and a
clear phrase will usually survive sound-design changes better than a dense wall of notes.
Use 16 beats when the idea needs four-bar motion rather than cloning a one-bar pattern.

### 4. Shape sound from observed parameters

The reliable sequence is:

1. `insert_device` with an exact built-in device name.
2. `get_device` using the returned ID.
3. Choose parameters from the returned names and min/max values.
4. `set_device_params` with a small coherent set of changes.
5. `get_device` again if those values are important to the handoff.

Do not transfer normalized values from another plug-in or another Live device. This API
uses each Live parameter's raw range. Third-party VST/AU loading and preset browsing are
not available in API 1.0.0.

### 5. Establish headroom

Use one `set_mixer` batch for the first balance. Start conservatively; raw `volume` is
0..1 and approximately `0.85` corresponds to 0 dB, so a value below that is not a direct
dB number.

```json
{
  "tool": "set_mixer",
  "arguments": {
    "updates": [
      { "trackId": "<kick-track-id>", "volume": 0.76 },
      { "trackId": "<hat-track-id>", "volume": 0.5, "pan": 0.08 },
      { "trackId": "<bass-track-id>", "volume": 0.64 },
      { "trackId": "<chord-track-id>", "volume": 0.52, "pan": -0.1 }
    ]
  }
}
```

These are starting points, not a claim about loudness. The official adapter cannot read
meters.

### 6. Verify, then audition

Call `get_set` and drill into each new track/clip that matters. Check:

- tempo and Scene name;
- track names and device presence;
- clip lengths and note counts;
- mixer values;
- exact notes for any musically critical clip.

Then ask the musician to launch the Scene. After feedback, prefer focused moves such as:

- thin or shift a note range with `edit_clip_notes`;
- adjust a few observed device parameters;
- rebalance several tracks in one `set_mixer` call;
- duplicate a successful track/scene only when the full copied state is wanted.

## Editing an existing Set

Existing work deserves a stricter loop:

1. Read the Set and identify targets by both name and current ID.
2. Read each target in depth immediately before editing.
3. Restate the intended delta in musical language: “lower only the offbeat hats by 8
   velocity points,” not “fix drums.”
4. Use the narrowest tool. `edit_clip_notes` is safer than `replace_clip_notes` for a
   partial MIDI change.
5. Read back the changed target and report the exact delta.

If the user's intent is ambiguous and the edit would destroy or overwrite existing
material, pause for direction. “Undoable” is not permission.

## Capability gaps and handoffs

| Need                          | Official adapter today | Correct handoff                                                                                         |
| ----------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Launch a clip or Scene        | Not available          | Ask the musician; use an optional adapter only if capability discovery reports it as active and tested. |
| Play, stop, record, or seek   | Not available          | Human transport control or a future narrow transport adapter.                                           |
| Read meters or judge audio    | Not available          | Human listening or a tested audio-analysis adapter.                                                     |
| Browse presets or load VST/AU | Not available          | Human browser action or a separately declared adapter.                                                  |
| Write automation or routing   | Not available          | Human edit or a future explicit adapter contract.                                                       |
| Save the Set                  | Not available          | Ask the musician to save in Live.                                                                       |
| Run while Live is closed      | Impossible             | Explain that the Extension Host exists only with Live.                                                  |

Max for Live can eventually close some transport, observation, and signal-analysis gaps,
but it must remain a named optional adapter. Max for Live Developer Mode does not enable
the Ableton Extensions system.

## Failure recovery

- `NOT_FOUND`: an ID is stale. Re-read the Set and resolve the target again.
- `INVALID_INPUT`: inspect the target/schema; do not retry unchanged.
- `CONFLICT`: the current Set no longer matches the precondition, such as an occupied
  clip slot. Re-read before proposing a different action.
- `UNSUPPORTED`: stop and explain the adapter boundary; do not silently switch to UI
  automation.
- `INTERNAL`: preserve the error message, avoid repeated mutations, and suggest checking
  the Extension Host log.

One failed write does not block later writes, but failure is a reason to re-read state.

## Completion note template

Use a handoff in this shape:

> Built one new four-bar Scene at 128 BPM on four new MIDI tracks. Readback confirms four
> clips, their note counts, the inserted native devices, and the mixer values. Playback
> still needs you to launch the Scene; I have not claimed an audio judgment. Each tool
> call is one Live undo step, and the Set has not been saved by MCP.

Separate facts observed through MCP from anything the musician confirmed by listening.
