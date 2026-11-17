import { useState } from "react";
import { createRoot } from "react-dom/client";
import { motion, MotionConfig } from "motion/react";
import { Area, AreaChart } from "@zeron/ui/area-chart";
import { useChartStable } from "@zeron/ui/chart-core";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@zeron/ui/select";

const policy = new URLSearchParams(window.location.search).get("policy");
const reducedMotion = policy === "always" || policy === "never" ? policy : "user";
const series = [{ date: "2026-10-01", value: 10 }, { date: "2026-10-02", value: 20 }];

function ChartTiming() {
  const { animationDuration } = useChartStable();
  return <g data-testid="chart-timing" data-duration={animationDuration} />;
}

function MotionExamples() {
  const [moved, setMoved] = useState(false);
  const [showChart, setShowChart] = useState(false);

  return (
    <MotionConfig reducedMotion={reducedMotion}>
      <button id="move" onClick={() => setMoved(true)}>Move samples</button>
      <motion.div
        data-testid="transform"
        initial={false}
        animate={{ x: moved ? 80 : 0 }}
        transition={{ duration: 0.8, ease: "linear" }}
        style={{ width: 30, height: 20 }}
      />
      <motion.div
        layout="position"
        data-testid="layout"
        transition={{ layout: { duration: 0.8, ease: "linear" } }}
        style={{ marginLeft: moved ? 80 : 0, width: 30, height: 20 }}
      />
      <Select defaultValue="one">
        <SelectTrigger aria-label="Choice" />
        <SelectContent>
          <SelectItem value="one">One</SelectItem>
          <SelectItem value="two">Two</SelectItem>
        </SelectContent>
      </Select>
      <button onClick={() => setShowChart(true)}>Show chart</button>
      {showChart && (
        <AreaChart data={series} animationDuration={1000} style={{ width: 420, height: 180 }}>
          <Area dataKey="value" /><ChartTiming />
        </AreaChart>
      )}
    </MotionConfig>
  );
}

createRoot(document.body).render(<MotionExamples />);
