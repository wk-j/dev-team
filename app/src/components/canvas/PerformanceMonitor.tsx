"use client";

import { useEffect, useState, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";

interface PerformanceStats {
  fps: number;
  frameTime: number;
  drawCalls: number;
  triangles: number;
  memory: number;
}

interface PerformanceMonitorProps {
  visible?: boolean;
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

export function PerformanceMonitor({
  visible = true,
  position = "bottom-right"
}: PerformanceMonitorProps) {
  const { gl } = useThree();
  const [stats, setStats] = useState<PerformanceStats>({
    fps: 60,
    frameTime: 16.67,
    drawCalls: 0,
    triangles: 0,
    memory: 0,
  });

  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const fpsHistory = useRef<number[]>([]);

  useFrame(() => {
    frameCount.current++;
    const now = performance.now();
    const elapsed = now - lastTime.current;

    // Update every 500ms
    if (elapsed >= 500) {
      const fps = Math.round((frameCount.current * 1000) / elapsed);
      const frameTime = elapsed / frameCount.current;

      // Get WebGL info
      const info = gl.info;
      const drawCalls = info.render.calls;
      const triangles = info.render.triangles;

      // Get memory (if available)
      let memory = 0;
      if ("memory" in performance) {
        const perfMemory = (performance as unknown as { memory: { usedJSHeapSize: number } }).memory;
        memory = Math.round(perfMemory.usedJSHeapSize / 1024 / 1024);
      }

      // Keep FPS history for smoothing
      fpsHistory.current.push(fps);
      if (fpsHistory.current.length > 10) {
        fpsHistory.current.shift();
      }
      const avgFps = Math.round(
        fpsHistory.current.reduce((a, b) => a + b, 0) / fpsHistory.current.length
      );

      setStats({
        fps: avgFps,
        frameTime: Math.round(frameTime * 100) / 100,
        drawCalls,
        triangles,
        memory,
      });

      // Reset frame info for next measurement
      info.reset();
      frameCount.current = 0;
      lastTime.current = now;
    }
  });

  if (!visible) return null;

  const positionStyles: Record<string, React.CSSProperties> = {
    "top-left": { top: 20, left: 20 },
    "top-right": { top: 20, right: 20 },
    "bottom-left": { bottom: 20, left: 20 },
    "bottom-right": { bottom: 20, right: 20 },
  };

  const getFpsColor = (fps: number) => {
    if (fps >= 55) return "#10b981"; // Green
    if (fps >= 30) return "#fbbf24"; // Yellow
    return "#ef4444"; // Red
  };

  return (
    <Html
      fullscreen
      style={{ pointerEvents: "none" }}
    >
      <div
        className="fixed glass-panel p-3 text-xs font-mono"
        style={{
          ...positionStyles[position],
          minWidth: 140,
          pointerEvents: "auto",
        }}
      >
        <div className="text-text-muted uppercase tracking-wider text-[10px] mb-2">
          Performance
        </div>

        {/* FPS */}
        <div className="flex justify-between items-center mb-1">
          <span className="text-text-dim">FPS</span>
          <span
            className="font-bold"
            style={{ color: getFpsColor(stats.fps) }}
          >
            {stats.fps}
          </span>
        </div>

        {/* Frame Time */}
        <div className="flex justify-between items-center mb-1">
          <span className="text-text-dim">Frame</span>
          <span className="text-text-bright">{stats.frameTime}ms</span>
        </div>

        {/* Draw Calls */}
        <div className="flex justify-between items-center mb-1">
          <span className="text-text-dim">Draws</span>
          <span className="text-text-bright">{stats.drawCalls}</span>
        </div>

        {/* Triangles */}
        <div className="flex justify-between items-center mb-1">
          <span className="text-text-dim">Tris</span>
          <span className="text-text-bright">
            {stats.triangles > 1000
              ? `${(stats.triangles / 1000).toFixed(1)}k`
              : stats.triangles}
          </span>
        </div>

        {/* Memory */}
        {stats.memory > 0 && (
          <div className="flex justify-between items-center">
            <span className="text-text-dim">Mem</span>
            <span className="text-text-bright">{stats.memory}MB</span>
          </div>
        )}

        {/* FPS Graph */}
        <div className="mt-2 h-8 bg-void-deep/50 rounded overflow-hidden">
          <svg width="100%" height="100%" preserveAspectRatio="none">
            {fpsHistory.current.map((fps, i) => {
              const x = (i / (fpsHistory.current.length - 1)) * 100;
              const height = Math.min((fps / 60) * 100, 100);
              const y = 100 - height;
              return (
                <rect
                  key={i}
                  x={`${x - 5}%`}
                  y={`${y}%`}
                  width="10%"
                  height={`${height}%`}
                  fill={getFpsColor(fps)}
                  opacity={0.7}
                />
              );
            })}
            {/* 60fps target line */}
            <line
              x1="0"
              y1="0"
              x2="100%"
              y2="0"
              stroke="#10b981"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity={0.5}
            />
            {/* 30fps warning line */}
            <line
              x1="0"
              y1="50%"
              x2="100%"
              y2="50%"
              stroke="#fbbf24"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity={0.3}
            />
          </svg>
        </div>
      </div>
    </Html>
  );
}
