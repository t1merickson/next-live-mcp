import { z } from "zod";
import { PortError } from "../../port/errors.js";
import type { SongPatch } from "../../port/types.js";
import type { ToolDef } from "./types.js";

export const setTools: ToolDef[] = [
  {
    name: "get_set",
    effect: "read",
    description:
      "Compact overview of the open Live set: tempo, scale, tracks (one line each: " +
      "id, name, type, devices, Session clip count) and scenes. Call this first to obtain IDs; " +
      "drill down with get_track / get_clip. Arrangement clip counts are separate; get_track lists their positions. Includes arrangement cue points (cues) when present.",
    inputSchema: z.object({}),
    handler: async (_args, deps) => ({ set: await deps.inspector.getSet() }),
  },
  {
    name: "get_track",
    effect: "read",
    description:
      "One track in depth: its Session slots, Arrangement clips with zero-based beat positions, and device chain. " +
      "Use the trackId from get_set.",
    inputSchema: z.object({ trackId: z.string() }),
    handler: async (args, deps) => ({
      track: await deps.inspector.getTrack(args.trackId as string),
    }),
  },
  {
    name: "get_clip",
    effect: "read",
    description:
      "Full detail of one clip, including its MIDI notes as compact tuples " +
      "[pitch, startBeat, durationBeats, velocity, extras?]. Also returns a view-specific " +
      "location with current track name, plus Session scene number or Arrangement beat positions. Does not reveal " +
      "or launch the clip.",
    inputSchema: z.object({ clipId: z.string() }),
    handler: async (args, deps) => {
      const clip = await deps.inspector.getClip(args.clipId as string);
      const set = await deps.inspector.getSet();
      const track = set.tracks.find((item) => item.id === clip.trackId);
      const sceneIndex = set.scenes.findIndex((item) => item.id === clip.sceneId);
      if (!track || (clip.sceneId !== null && sceneIndex < 0)) {
        throw new PortError(
          "CONFLICT",
          "Clip location changed during the read",
          "Call get_set and resolve the clip again.",
        );
      }
      return {
        clip,
        location:
          clip.sceneId === null
            ? {
                view: "arrangement",
                trackName: track.name,
                startBeat: clip.startBeat,
                endBeat: clip.endBeat,
              }
            : {
                view: "session",
                trackName: track.name,
                sceneName: set.scenes[sceneIndex].name,
                sceneNumber: sceneIndex + 1,
              },
      };
    },
  },
  {
    name: "update_song",
    effect: "write",
    description:
      "Update song-level settings in one undo step: tempo (20-999 BPM) and " +
      "arrangement cue points. addCues creates locators at beat positions; " +
      "renameCues / deleteCueIds edit existing ones by ID (batch, all-or-nothing). " +
      "Cue time is fixed at creation — the Ableton API cannot move a cue; delete " +
      "and re-add instead. Returns minted IDs for added cues.",
    inputSchema: z.object({
      tempo: z.number().optional(),
      addCues: z
        .array(z.object({ timeBeats: z.number().min(0), name: z.string().optional() }))
        .min(1)
        .optional(),
      renameCues: z
        .array(z.object({ id: z.string(), name: z.string().min(1) }))
        .min(1)
        .optional(),
      deleteCueIds: z.array(z.string()).min(1).optional(),
    }),
    handler: async (args, deps) => {
      const patch = {
        ...(args.tempo !== undefined ? { tempo: args.tempo as number } : {}),
        ...(args.addCues !== undefined
          ? { addCues: args.addCues as SongPatch["addCues"] }
          : {}),
        ...(args.renameCues !== undefined
          ? { renameCues: args.renameCues as SongPatch["renameCues"] }
          : {}),
        ...(args.deleteCueIds !== undefined
          ? { deleteCueIds: args.deleteCueIds as string[] }
          : {}),
      } satisfies SongPatch;
      const result = await deps.song.updateSong(patch);
      return {
        song: { tempo: (args.tempo as number | undefined) ?? null },
        ...(result.addedCues.length > 0 ? { addedCues: result.addedCues } : {}),
        ...(patch.renameCues ? { renamedCueIds: patch.renameCues.map((r) => r.id) } : {}),
        ...(patch.deleteCueIds ? { deletedCueIds: patch.deleteCueIds } : {}),
      };
    },
  },
];
