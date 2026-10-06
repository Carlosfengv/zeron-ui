import { galleryArtifacts } from "@docs/catalog/standalone-pages";
import { artifactPathname } from "@docs/catalog/artifact-collections";
import type { CommitHistoryEntry } from "./commit-history.server";
import { readCommitArtifactAdditions, type CommitArtifactAdditions } from "./commit-artifact-history.server";

function buildAdditions(): CommitArtifactAdditions {
  // Next embeds the build-time snapshot so deployed pages do not need a .git directory.
  const snapshot = process.env.UPDATES_ARTIFACT_ADDITIONS;
  return snapshot ? JSON.parse(snapshot) as CommitArtifactAdditions : readCommitArtifactAdditions();
}

export function withCommitArtifacts(commits: CommitHistoryEntry[], additions = buildAdditions()): CommitHistoryEntry[] {
  const bySlug = new Map(galleryArtifacts.map((artifact) => [artifact.slug, artifact]));
  return commits.map((commit) => {
    const artifacts = (additions[commit.id] ?? []).flatMap((slug) => {
      const artifact = bySlug.get(slug);
      if (!artifact) return [];
      return [{
        slug, title: artifact.title, collection: artifact.collection,
        href: "href" in artifact ? artifact.href : artifactPathname(slug),
      }];
    });
    return artifacts.length ? { ...commit, artifacts } : commit;
  });
}
