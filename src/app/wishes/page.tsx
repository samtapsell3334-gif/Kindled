import { permanentRedirect } from "next/navigation";

/**
 * /wishes index — the v8.1 rename left /pots 308-ing here with no page,
 * so old dashboard links dead-ended in a 404. The demo is the right landing.
 */
export default function WishesIndex(): never {
  permanentRedirect("/wishes/demo");
}
