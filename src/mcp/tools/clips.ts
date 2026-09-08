import { z } from "zod";
import type { ClipNotesEdit } from "../../domain/clip-editor.js";
import type { ClipPatch, Note } from "../../port/types.js";
import { NOTE_FORMAT_DOC, noteSchema } from "./schemas.js";
import type { ToolDef } from "./types.js";

export const clipTools: ToolDef[] = [
  {
    name: "create_arrangement_midi_clip",
    effect: "write",
    description:
      "Create a MIDI clip directly on a track's Arrangement timeline in one undo step. " +
      "startBeat is zero-based song time; note times are relative to the new clip. " +
      "Rejects overlaps with existing Arrangement clips instead of replacing them. " +
      NOTE_FORMAT_DOC,
    inputSchema: z.object({
      trackId: z.string(),
      startBeat: z.number().min(0),
      lengthBeats: z.number().positive(),
      notes: z.array(noteSchema),
      name: z.string().optional(),
    }),
    handler: async (args, deps) => ({
      clip: await deps.clips.createArrangementMidiClip({
        trackId: args.trackId as string,
        startBeat: args.startBeat as number,
        lengthBeats: args.lengthBeats as number,
        notes: args.notes as Note[],
        name: args.name as string | undefined,
      }),
    }),
  },
  {
    name: "create_midi_clip",
    effect: "write",
    description:
      "Create a MIDI clip in a session slot (trackId + sceneId) with notes inline, " +
      "in one undo step. " +
      NOTE_FORMAT_DOC,
    inputSchema: z.object({
      trackId: z.string(),
      sceneId: z.string(),
      lengthBeats: z.number().positive(),
      notes: z.array(noteSchema),
      name: z.string().optional(),
    }),
    handler: async (args, deps) => ({
      clip: await deps.clips.createMidiClip({
        trackId: args.trackId as string,
        sceneId: args.sceneId as string,
        lengthBeats: args.lengthBeats as number,
        notes: args.notes as Note[],
        name: args.name as string | undefined,
      }),
    }),
  },
  {
    name: "replace_clip_notes",
    effect: "write",
    destructive: true,
    description:
      "Replace ALL notes of a MIDI clip in one undo step. " +
      "For partial edits prefer edit_clip_notes. " +
      NOTE_FORMAT_DOC,
    inputSchema: z.object({
      clipId: z.string(),
      notes: z.array(noteSchema),
    }),
    handler: async (args, deps) => ({
      clip: await deps.clips.replaceClipNotes(
        args.clipId as string,
        args.notes as Note[],
      ),
    }),
  },
  {
    name: "create_audio_clip",
    effect: "write",
    description:
      "Create an audio clip from a file path in a session slot (audio tracks only), " +
      "in one undo step. The file must be accessible to Ableton Live.",
    inputSchema: z.object({
      trackId: z.string(),
      sceneId: z.string(),
      filePath: z.string().min(1),
      name: z.string().optional(),
    }),
    handler: async (args, deps) => ({
      clip: await deps.clips.createAudioClip({
        trackId: args.trackId as string,
        sceneId: args.sceneId as string,
        filePath: args.filePath as string,
        name: args.name as string | undefined,
      }),
    }),
  },
  {
    name: "update_clip",
    effect: "write",
    description:
      'Update clip properties in one undo step: name, looping, color ("#RRGGBB"); ' +
      "for audio clips also warping (on/off) and warpMode (beats | tones | texture " +
      "| repitch | complex | complexPro). Returns the updated clip summary.",
    inputSchema: z.object({
      clipId: z.string(),
      name: z.string().optional(),
      looping: z.boolean().optional(),
      color: z
        .string()
        .regex(/^#[0-9a-fA-F]{6}$/)
        .optional(),
      warping: z.boolean().optional(),
      warpMode: z
        .enum(["beats", "tones", "texture", "repitch", "complex", "complexPro"])
        .optional(),
    }),
    handler: async (args, deps) => {
      const patch: ClipPatch = {
        ...(args.name !== undefined ? { name: args.name as string } : {}),
        ...(args.looping !== undefined ? { looping: args.looping as boolean } : {}),
        ...(args.color !== undefined ? { color: args.color as string } : {}),
        ...(args.warping !== undefined ? { warping: args.warping as boolean } : {}),
        ...(args.warpMode !== undefined
          ? { warpMode: args.warpMode as ClipPatch["warpMode"] }
          : {}),
      };
      const clip = await deps.clips.updateClip(args.clipId as string, patch);
      return {
        clip: {
          id: clip.id,
          name: clip.name,
          looping: clip.looping,
          color: clip.color ?? null,
          ...(clip.warping !== undefined ? { warping: clip.warping } : {}),
          ...(clip.warpMode !== undefined ? { warpMode: clip.warpMode } : {}),
        },
      };
    },
  },
  {
    name: "delete_clips",
    effect: "write",
    destructive: true,
    description:
      "Delete clips by ID in one undo step. All IDs are validated first: if any is " +
      "stale the call fails and nothing is deleted.",
    inputSchema: z.object({ clipIds: z.array(z.string()).min(1) }),
    handler: async (args, deps) => {
      await deps.clips.deleteClips(args.clipIds as string[]);
      return { deleted: args.clipIds };
    },
  },
  {
    name: "edit_clip_notes",
    effect: "write",
    destructive: true,
    description:
      "Edit a MIDI clip's notes by filter, in one undo step — cheaper than resending " +
      "all notes. select: {pitchMin?, pitchMax?, startBeat? (inclusive), endBeat? " +
      "(exclusive)} — omitted bounds are open. Then EITHER remove: true (delete " +
      "selected notes) OR transform: {transpose?, shiftBeats?, velocityDelta?} " +
      "(applied to selected notes; results clamped to valid ranges), and/or add " +
      "new notes. " +
      NOTE_FORMAT_DOC +
      " Returns {clipId, noteCount}; call get_clip for the full note list.",
    inputSchema: z.object({
      clipId: z.string(),
      select: z
        .object({
          pitchMin: z.number().int().min(0).max(127).optional(),
          pitchMax: z.number().int().min(0).max(127).optional(),
          startBeat: z.number().min(0).optional(),
          endBeat: z.number().min(0).optional(),
        })
        .optional(),
      remove: z.boolean().optional(),
      transform: z
        .object({
          transpose: z.number().int().optional(),
          shiftBeats: z.number().optional(),
          velocityDelta: z.number().int().optional(),
        })
        .optional(),
      add: z.array(noteSchema).optional(),
    }),
    handler: async (args, deps) => {
      const clip = await deps.clips.editClipNotes(
        args.clipId as string,
        {
          select: args.select,
          remove: args.remove,
          transform: args.transform,
          add: args.add,
        } as ClipNotesEdit,
      );
      return { clipId: clip.id, noteCount: clip.noteCount };
    },
  },
];
