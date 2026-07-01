import { describe, it, expect } from "vitest";
import { Decimal } from "@prisma/client/runtime/library";
import { resolveTransition } from "@/lib/pot-transitions";

/**
 * Status-machine unit tests (required by CLAUDE.md). resolveTransition is the single
 * source of truth for ACTIVE → HALFWAY → FUNDED and the milestone events it fires.
 */
const snap = (target: string, prev: string, next: string, status: "ACTIVE" | "HALFWAY" | "FUNDED" | "STALLED") => ({
  targetAmount: new Decimal(target),
  previousBalance: new Decimal(prev),
  newBalance: new Decimal(next),
  currentStatus: status,
});

describe("resolveTransition", () => {
  it("stays ACTIVE below the halfway line", () => {
    const r = resolveTransition(snap("100", "10", "40", "ACTIVE"));
    expect(r).toEqual({ nextStatus: "ACTIVE", event: null });
  });

  it("fires BRIDGE_THE_GAP when crossing halfway", () => {
    const r = resolveTransition(snap("100", "40", "55", "ACTIVE"));
    expect(r).toEqual({ nextStatus: "HALFWAY", event: "BRIDGE_THE_GAP" });
  });

  it("treats the exact halfway boundary as crossed", () => {
    const r = resolveTransition(snap("100", "49.99", "50", "ACTIVE"));
    expect(r.nextStatus).toBe("HALFWAY");
    expect(r.event).toBe("BRIDGE_THE_GAP");
  });

  it("fires IGNITE_REVEAL when fully funded", () => {
    const r = resolveTransition(snap("100", "80", "100", "HALFWAY"));
    expect(r).toEqual({ nextStatus: "FUNDED", event: "IGNITE_REVEAL" });
  });

  it("prioritises FUNDED when a single contribution jumps past halfway to funded", () => {
    const r = resolveTransition(snap("100", "10", "120", "ACTIVE"));
    expect(r).toEqual({ nextStatus: "FUNDED", event: "IGNITE_REVEAL" });
  });

  it("never regresses out of FUNDED (irreversible)", () => {
    const r = resolveTransition(snap("100", "100", "40", "FUNDED"));
    expect(r).toEqual({ nextStatus: "FUNDED", event: null });
  });

  it("preserves HALFWAY without re-firing when already past the line", () => {
    const r = resolveTransition(snap("100", "60", "70", "HALFWAY"));
    expect(r).toEqual({ nextStatus: "HALFWAY", event: null });
  });

  it("never sets STALLED from a balance update (that is a background-job concern)", () => {
    const statuses = ["ACTIVE", "HALFWAY", "FUNDED"] as const;
    for (const s of statuses) {
      const r = resolveTransition(snap("100", "10", "20", s));
      expect(r.nextStatus).not.toBe("STALLED");
    }
  });
});
