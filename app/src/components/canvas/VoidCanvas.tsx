"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { VoidEnvironment } from "./VoidEnvironment";
import { CameraController } from "./CameraController";
import { ParticleField } from "./ParticleField";
import { ConstellationView } from "./ConstellationView";

interface VoidCanvasProps {
  className?: string;
}

export function VoidCanvas({ className }: VoidCanvasProps) {
  return (
    <div className={className}>
      <Canvas
        camera={{ position: [0, 0, 50], fov: 60 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <Suspense fallback={null}>
          <VoidEnvironment />
          <CameraController />
          <ParticleField count={500} />
          <ConstellationView />
        </Suspense>
      </Canvas>
    </div>
  );
}
