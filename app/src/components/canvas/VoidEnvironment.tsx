"use client";

import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Stars } from "@react-three/drei";
import * as THREE from "three";

export type TimeOfDay = "morning" | "afternoon" | "evening" | "night";
export type WeatherState = "clear" | "energetic" | "calm" | "stormy";

interface VoidEnvironmentProps {
  /** Time of day for ambient lighting */
  timeOfDay?: TimeOfDay;
  /** Weather state based on team health */
  weatherState?: WeatherState;
  /** Team energy level (0-1) for dynamic effects */
  energyLevel?: number;
}

// Time-based color palettes
const timeColors: Record<TimeOfDay, {
  background: string;
  fog: string;
  ambient: string;
  directional: string;
  nebula1: string;
  nebula2: string;
  ambientIntensity: number;
  directionalIntensity: number;
}> = {
  morning: {
    background: "#0a0f1a",
    fog: "#1a2a4a",
    ambient: "#8ba3c9",
    directional: "#ffd4a0",
    nebula1: "#ff9d76",
    nebula2: "#ffb347",
    ambientIntensity: 0.2,
    directionalIntensity: 0.4,
  },
  afternoon: {
    background: "#05080f",
    fog: "#0a1628",
    ambient: "#4a5568",
    directional: "#00d4ff",
    nebula1: "#8b5cf6",
    nebula2: "#ff6b9d",
    ambientIntensity: 0.15,
    directionalIntensity: 0.3,
  },
  evening: {
    background: "#0d0815",
    fog: "#1a1030",
    ambient: "#6b5a8e",
    directional: "#ff8855",
    nebula1: "#ff6b9d",
    nebula2: "#c084fc",
    ambientIntensity: 0.12,
    directionalIntensity: 0.25,
  },
  night: {
    background: "#020408",
    fog: "#050a15",
    ambient: "#2d3748",
    directional: "#6366f1",
    nebula1: "#4c1d95",
    nebula2: "#1e1b4b",
    ambientIntensity: 0.08,
    directionalIntensity: 0.15,
  },
};

// Weather modifiers
const weatherModifiers: Record<WeatherState, {
  fogDensity: number;
  particleSpeed: number;
  lightFlicker: boolean;
  extraEffects: boolean;
}> = {
  clear: {
    fogDensity: 1.0,
    particleSpeed: 0.5,
    lightFlicker: false,
    extraEffects: false,
  },
  energetic: {
    fogDensity: 0.8,
    particleSpeed: 1.5,
    lightFlicker: true,
    extraEffects: true,
  },
  calm: {
    fogDensity: 1.2,
    particleSpeed: 0.3,
    lightFlicker: false,
    extraEffects: false,
  },
  stormy: {
    fogDensity: 1.5,
    particleSpeed: 2.0,
    lightFlicker: true,
    extraEffects: true,
  },
};

export function VoidEnvironment({
  timeOfDay = "afternoon",
  weatherState = "clear",
  energyLevel = 0.5,
}: VoidEnvironmentProps = {}) {
  const fogRef = useRef<THREE.Fog>(null);
  const directionalRef = useRef<THREE.DirectionalLight>(null);
  const nebula1Ref = useRef<THREE.PointLight>(null);
  const nebula2Ref = useRef<THREE.PointLight>(null);

  const colors = timeColors[timeOfDay];
  const weather = weatherModifiers[weatherState];

  // Pre-compute colors
  const computedColors = useMemo(() => ({
    background: new THREE.Color(colors.background),
    fog: new THREE.Color(colors.fog),
    ambient: new THREE.Color(colors.ambient),
    directional: new THREE.Color(colors.directional),
    nebula1: new THREE.Color(colors.nebula1),
    nebula2: new THREE.Color(colors.nebula2),
  }), [colors]);

  // Subtle fog animation for depth
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    
    // Fog animation
    if (fogRef.current) {
      const baseFar = 150 * weather.fogDensity;
      fogRef.current.far = baseFar + Math.sin(t * 0.1) * 20;
    }

    // Light flicker for energetic/stormy weather
    if (weather.lightFlicker) {
      if (directionalRef.current) {
        const flicker = 1 + Math.sin(t * 10) * 0.1 * energyLevel;
        directionalRef.current.intensity = colors.directionalIntensity * flicker;
      }
      
      if (nebula1Ref.current) {
        const pulse = 1 + Math.sin(t * 3 + 1) * 0.2 * energyLevel;
        nebula1Ref.current.intensity = 0.5 * pulse;
      }
      
      if (nebula2Ref.current) {
        const pulse = 1 + Math.sin(t * 3 + 2) * 0.2 * energyLevel;
        nebula2Ref.current.intensity = 0.4 * pulse;
      }
    }
  });

  return (
    <>
      {/* Deep space background color - time based */}
      <color attach="background" args={[computedColors.background]} />

      {/* Atmospheric fog for depth - weather affected */}
      <fog 
        ref={fogRef} 
        attach="fog" 
        args={[computedColors.fog, 30, 150 * weather.fogDensity]} 
      />

      {/* Ambient light for base visibility - time based */}
      <ambientLight 
        intensity={colors.ambientIntensity} 
        color={computedColors.ambient} 
      />

      {/* Directional light simulating distant star - time based */}
      <directionalLight
        ref={directionalRef}
        position={[50, 30, 20]}
        intensity={colors.directionalIntensity}
        color={computedColors.directional}
      />

      {/* Point lights for nebula glow effect - time based */}
      <pointLight 
        ref={nebula1Ref}
        position={[-30, 20, -20]} 
        intensity={0.5} 
        color={computedColors.nebula1} 
        distance={100} 
      />
      <pointLight 
        ref={nebula2Ref}
        position={[40, -10, 30]} 
        intensity={0.4} 
        color={computedColors.nebula2} 
        distance={80} 
      />

      {/* Energy-based accent light */}
      {energyLevel > 0.7 && (
        <pointLight
          position={[0, 0, 0]}
          intensity={energyLevel * 0.3}
          color="#00d4ff"
          distance={50}
        />
      )}

      {/* Background stars */}
      <Stars
        radius={200}
        depth={100}
        count={3000}
        factor={4}
        saturation={timeOfDay === "night" ? 0.1 : 0.3}
        fade
        speed={weather.particleSpeed}
      />

      {/* Extra effects for energetic/stormy weather */}
      {weather.extraEffects && <EnergyBurst energyLevel={energyLevel} />}
    </>
  );
}

/**
 * Energy burst effect for high-activity periods
 */
function EnergyBurst({ energyLevel }: { energyLevel: number }) {
  const burstRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const count = 100;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      const radius = 30 + Math.random() * 50;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;

      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * radius;
      positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * radius;
      positions[i * 3 + 2] = Math.cos(phi) * radius;

      // Random energy colors
      const color = new THREE.Color().setHSL(
        0.5 + Math.random() * 0.2, // cyan to blue
        0.8,
        0.5 + Math.random() * 0.3
      );
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    return { positions, colors };
  }, []);

  useFrame(({ clock }) => {
    if (!burstRef.current) return;

    const t = clock.getElapsedTime();
    burstRef.current.rotation.y = t * 0.1;
    burstRef.current.rotation.x = Math.sin(t * 0.05) * 0.2;

    // Pulse opacity based on energy
    const material = burstRef.current.material as THREE.PointsMaterial;
    material.opacity = 0.2 + Math.sin(t * 2) * 0.1 * energyLevel;
  });

  return (
    <points ref={burstRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[particles.positions, 3]} />
        <bufferAttribute attach="attributes-color" args={[particles.colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.5}
        vertexColors
        transparent
        opacity={0.3}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

/**
 * Get time of day from current hour
 */
export function getTimeOfDayFromHour(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

/**
 * Determine weather state from team metrics
 */
export function getWeatherFromTeamHealth(
  energyLevel: number,
  harmonyScore: number,
  activeRatio: number
): WeatherState {
  // High energy + high activity = energetic
  if (energyLevel > 0.7 && activeRatio > 0.6) return "energetic";
  
  // Low harmony or extreme energy = stormy
  if (harmonyScore < 0.4 || energyLevel > 0.9) return "stormy";
  
  // Low energy = calm
  if (energyLevel < 0.3) return "calm";
  
  // Default = clear
  return "clear";
}
