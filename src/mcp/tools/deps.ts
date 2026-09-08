import { ClipEditor } from "../../domain/clip-editor.js";
import { DeviceService } from "../../domain/device-service.js";
import { MixerService } from "../../domain/mixer-service.js";
import { SetInspector } from "../../domain/set-inspector.js";
import { SongService } from "../../domain/song-service.js";
import { TrackService } from "../../domain/track-service.js";
import type { LivePort } from "../../port/live-port.js";
import { MutationQueue } from "../mutation-queue.js";
import type { AdapterDescriptor, ToolDeps } from "./types.js";

const DEFAULT_ADAPTER: AdapterDescriptor = {
  id: "fake-live",
  apiVersion: "1.0.0",
  evidence: "simulated",
};

/** Build the one shared service graph used by every stateless MCP request. */
export function createToolDeps(
  live: LivePort,
  adapter: AdapterDescriptor = DEFAULT_ADAPTER,
): ToolDeps {
  return {
    inspector: new SetInspector(live),
    tracks: new TrackService(live),
    clips: new ClipEditor(live),
    song: new SongService(live),
    devices: new DeviceService(live),
    mixer: new MixerService(live),
    mutations: new MutationQueue(),
    adapter,
  };
}
