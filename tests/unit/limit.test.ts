import { describe, expect, it } from "vitest";
import { createLimiter } from "@/lib/limit";

describe("createLimiter", () => {
  it("ne lance jamais plus de N tâches à la fois et les termine toutes", async () => {
    const limit = createLimiter(2);
    let running = 0;
    let peak = 0;
    const task = (v: number) => async () => {
      running++;
      peak = Math.max(peak, running);
      await new Promise((r) => setTimeout(r, 5));
      running--;
      if (v === 3) throw new Error("x");
      return v;
    };
    const results = await Promise.allSettled([1, 2, 3, 4, 5].map((v) => limit(task(v))));
    expect(peak).toBe(2);
    expect(results.map((r) => r.status)).toEqual(["fulfilled", "fulfilled", "rejected", "fulfilled", "fulfilled"]);
  });
});
