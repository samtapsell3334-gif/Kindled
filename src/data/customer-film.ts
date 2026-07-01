import type { Film } from "@/components/FilmPlayer";

/**
 * The Customer Film (~60s) — scenes match scripts/customer-film.md exactly.
 * Public by design. VO slot: public/audio/customer-film-vo.m4a (see
 * VO-RECORDING-GUIDE.md); captions carry it until then.
 */
export const CUSTOMER_FILM: Film = {
  id: "customer",
  title: "How Kindled works · 60 seconds",
  voSrc: "/audio/customer-film-vo.m4a",
  scenes: [
    { dur: 12, visual: "pain", headline: "Every year. The same four horsemen.",
      caption: "The group chat. The duplicate. The awkward money text. The drawer." },
    { dur: 12, visual: "potfill", headline: "One pot. One link. Everyone in.",
      caption: "Everyone chips in from anywhere — no app, no account needed." },
    { dur: 11, visual: "split", headline: "No more guessing. No more doubles.",
      caption: "The list means no duplicates — and kids circle their catalogue like we used to." },
    { dur: 8, visual: "ignition", headline: "Then — the reveal.",
      caption: "Everything stays sealed until the big day." },
    { dur: 7, visual: "reveal",
      caption: "The total, the people, the messages — together, on the day." },
    { dur: 8, visual: "flywheel", headline: "Better for everyone.",
      caption: "Organisers: no chasing · Contributors: 30 seconds · Receivers: the thing they actually dreamed of." },
    { dur: 4, visual: "endcard", caption: "Gifting, reignited. → kindledgift.co.uk" },
  ],
};

/** Full transcript (accessibility + SEO) — the VO lines from the script. */
export const CUSTOMER_TRANSCRIPT = [
  "Every year, the same four horsemen: the guessing group chat, the duplicate present, the awkward money-collection text — and the drawer where unwanted gifts go to live.",
  "Kindled replaces all of it. One pot, one link, everyone chips in from anywhere — no app, no account. The list means no more guessing and no more doubles. Kids circle their catalogue like we used to. And every message and video stays sealed until the big day.",
  "Then comes the bit nobody forgets. The reveal: the total, the people, the messages — together, on the day.",
  "Organisers never chase. Contributors are done in thirty seconds. And the person you love gets the thing they actually dreamed of.",
  "Kindled. Gifting, reignited.",
];
