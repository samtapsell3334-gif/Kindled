import { describe, it, expect } from "vitest";
import { toReceiverPots } from "../demo/receiver-view";

const fullPot = {
  id: "p1", title: "Super-Fast Mountain Bike", image: "/bike.jpg",
  goal: 450, raised: 310, mode: "surprise", continuous: true,
  eventLabel: "Birthday", eventDate: "28 Jun", eventIso: "2026-06-28",
  contributors: 7, boosterEntries: 14, accentGradient: "from-a to-b",
  tributes: [{ from: "Grandma Jean", message: "secret note", hasVideo: true }],
  stackNote: "Next up: Christmas 2026",
};

describe("demo receiver-view redaction (P3.2)", () => {
  it("output shape structurally cannot carry progress amounts", () => {
    const [out] = toReceiverPots([fullPot]);
    expect(Object.keys(out!).sort()).toEqual(["eventIso", "eventLabel", "goal", "id", "image", "stackNote", "title"]);
    const json = JSON.stringify(out);
    for (const banned of ["raised", "contributors", "boosterEntries", "tributes", "claimedNote", "310"]) {
      expect(json).not.toContain(banned);
    }
  });

  it("checklist (Parent's pick) items never reach the recipient", () => {
    const out = toReceiverPots([fullPot, { ...fullPot, id: "p2", isChecklist: true }]);
    expect(out.map((p) => p.id)).toEqual(["p1"]);
  });

  it("claimed items keep only the fields the Sorted section shows", () => {
    const [out] = toReceiverPots([{ ...fullPot, isClaimed: true, claimedBy: "Grandma Jean", claimedNote: "Bought outright" }]);
    expect(out!.isClaimed).toBe(true);
    expect(out!.claimedBy).toBe("Grandma Jean");
    expect(JSON.stringify(out)).not.toContain("claimedNote");
  });
});
