import type { NpmRelease } from "@docs/lib/npm-release.server";
import { HomeReleaseBadge, HomeReleaseCommand, HomeReleaseDetails } from "./home-release";

export type HomeReleasePart = "badge" | "details" | "init" | "add button";

// All slots share one request-scoped promise; only these small regions wait for npm.
export async function HomeReleaseSlot({ release, part }: { release: Promise<NpmRelease | null>; part: HomeReleasePart }) {
  const resolved = await release;
  if (part === "badge") return <HomeReleaseBadge release={resolved} />;
  if (part === "details") return <HomeReleaseDetails release={resolved} />;
  return <HomeReleaseCommand release={resolved} command={part} />;
}

export function HomeReleasePlaceholder({ part }: { part: HomeReleasePart }) {
  // Neutral placeholders must not claim npm is unavailable while still loading,
  // nor expose copyable @latest commands before the published version is known.
  if (part === "badge") return <div aria-hidden="true" className="h-8 w-48 max-w-full rounded-full bg-surface-raised" />;
  if (part === "details") return (
    <div aria-hidden="true" className="px-2 py-6">
      <div className="h-6 w-72 max-w-full rounded bg-surface-raised" />
      <div className="mt-5 h-4 w-full rounded bg-surface-raised" />
    </div>
  );
  return <div aria-hidden="true" className="h-10 w-full rounded-lg bg-surface-raised" />;
}
