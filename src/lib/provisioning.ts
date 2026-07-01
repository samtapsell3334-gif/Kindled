/**
 * Provisioning — multi-tenant instance + pot initialisation.
 *
 * Every new host gets their own isolated `instance_id` (their tenant boundary), and
 * every Fire they create gets a unique `pot_id`. IDs are collision-resistant (time +
 * random) and URL-safe so they double as share-link slugs. The instance_id scopes all
 * of a host's pots, contributions, media, and analytics for row-level isolation.
 */

const RAND = () => Math.random().toString(36).slice(2, 10);
const TS36 = () => Date.now().toString(36);

/** URL-safe, collision-resistant id with a typed prefix (e.g. "pot_lr4x…"). */
export function generateId(prefix: string): string {
  return `${prefix}_${TS36()}${RAND()}`;
}

export interface Instance {
  instanceId: string;
  ownerId: string;
  createdAt: number;
}

export interface Pot {
  potId: string;
  instanceId: string;
  ownerId: string;
  title: string;
  goalValue: number;
  /** Share-link slug derived from the pot id. */
  slug: string;
  createdAt: number;
}

/** Initialise a tenant instance for a brand-new host. */
export function provisionInstance(ownerId: string, now = Date.now()): Instance {
  return { instanceId: generateId("inst"), ownerId, createdAt: now };
}

/**
 * Create a pot inside an instance. Every new user's first `createPot` should be paired
 * with `provisionInstance` so the pot lands in its own tenant.
 */
export function createPot(
  params: { instanceId: string; ownerId: string; title: string; goalValue: number },
  now = Date.now(),
): Pot {
  const potId = generateId("pot");
  return {
    potId,
    instanceId: params.instanceId,
    ownerId: params.ownerId,
    title: params.title,
    goalValue: params.goalValue,
    slug: potId.split("_")[1] ?? potId,
    createdAt: now,
  };
}

/** One-shot onboarding: provision an instance and its first pot together. */
export function onboardNewHost(
  ownerId: string,
  firstPot: { title: string; goalValue: number },
  now = Date.now(),
): { instance: Instance; pot: Pot } {
  const instance = provisionInstance(ownerId, now);
  const pot = createPot({ instanceId: instance.instanceId, ownerId, ...firstPot }, now);
  return { instance, pot };
}
