import type { z } from "zod";
import type { ClipEditor } from "../../domain/clip-editor.js";
import type { DeviceService } from "../../domain/device-service.js";
import type { MixerService } from "../../domain/mixer-service.js";
import type { SetInspector } from "../../domain/set-inspector.js";
import type { SongService } from "../../domain/song-service.js";
import type { TrackService } from "../../domain/track-service.js";
import type { MutationQueue } from "../mutation-queue.js";

export interface AdapterDescriptor {
  id: "ableton-extensions-sdk" | "fake-live";
  sdkVersion?: string;
  apiVersion: string;
  hostApiVersion?: string;
  evidence: "runtime" | "simulated";
}

export interface ToolDeps {
  inspector: SetInspector;
  tracks: TrackService;
  clips: ClipEditor;
  song: SongService;
  devices: DeviceService;
  mixer: MixerService;
  /** Shared across every stateless HTTP request for this Live connection. */
  mutations: MutationQueue;
  adapter: AdapterDescriptor;
}

export interface ToolDef {
  name: string;
  description: string;
  effect: "read" | "write";
  /** Conservative MCP hint; writes are assumed non-idempotent unless stated. */
  destructive?: boolean;
  idempotent?: boolean;
  inputSchema: z.ZodObject;
  handler(args: Record<string, unknown>, deps: ToolDeps): Promise<unknown>;
}
