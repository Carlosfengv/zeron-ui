import type { FallbackAttempt, FallbackAttemptStatus } from "./fallback-chain-types";
import styles from "./fallback-chain.module.css";

const width = 48;
const treeWidth = 44;
const rowHeight = 60;
const rowGap = 10;

function Branch({ path, status }: { path: string; status: FallbackAttemptStatus }) {
  return <g data-status={status}>
    <path className={styles.line} d={path} pathLength={100} />
    {status === "trying" && <path className={styles.beam} d={path} pathLength={100} />}
  </g>;
}

export function FallbackBranches({ attempts, layout }: {
  attempts: readonly FallbackAttempt[];
  layout: "incoming" | "outgoing" | "tree";
}) {
  const modelsHeight = attempts.length * (rowHeight + rowGap) - rowGap;
  const middle = modelsHeight / 2;
  const tree = layout === "tree";
  const outgoing = layout === "outgoing";
  const height = tree ? modelsHeight + rowGap : modelsHeight;
  const viewWidth = tree ? treeWidth : width;

  return (
    <svg className={styles[layout]} viewBox={`0 0 ${viewWidth} ${height}`}
      width={viewWidth} height={height} preserveAspectRatio="none" aria-hidden="true">
      {attempts.map((attempt, index) => {
        const rowCenter = index * (rowHeight + rowGap) + rowHeight / 2;
        const from = outgoing ? rowCenter : middle;
        const to = outgoing ? middle : rowCenter;
        const treeCenter = rowCenter + rowGap;
        const path = tree
          ? `M20 0V${treeCenter - 10}Q20 ${treeCenter} 30 ${treeCenter}H${treeWidth}`
          : `M0 ${from}C26 ${from} 22 ${to} ${width} ${to}`;
        return <Branch key={attempt.id} path={path}
          status={outgoing && attempt.status !== "answered" ? "waiting" : attempt.status} />;
      })}
    </svg>
  );
}
