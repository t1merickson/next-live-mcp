/**
 * Process-wide serialization for writes into one Live Set.
 *
 * Streamable HTTP is stateless in this server, so each request receives a fresh
 * McpServer. The queue must therefore live in the shared ToolDeps object rather
 * than in an individual server instance. Reads do not enter this queue.
 */
export class MutationQueue {
  private tail: Promise<void> = Promise.resolve();
  private waiting = 0;
  private activeLabel: string | undefined;

  run<T>(label: string, work: () => Promise<T>): Promise<T> {
    this.waiting += 1;
    const result = this.tail.then(async () => {
      this.waiting -= 1;
      this.activeLabel = label;
      try {
        return await work();
      } finally {
        this.activeLabel = undefined;
      }
    });

    // A failed write must not poison later writes. Callers still receive the
    // original rejection through `result`.
    this.tail = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  }

  status(): { active: string | null; waiting: number } {
    return { active: this.activeLabel ?? null, waiting: this.waiting };
  }
}
