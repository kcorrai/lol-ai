"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { SplashCards } from "./SplashCards";
import { HextechParticles } from "./HextechParticles";

// Tilts the card group toward the pointer for a subtle parallax effect.
function ParallaxRig({ children }: { children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (!ref.current) return;
    ref.current.rotation.y = THREE.MathUtils.lerp(ref.current.rotation.y, state.pointer.x * 0.25, 0.04);
    ref.current.rotation.x = THREE.MathUtils.lerp(ref.current.rotation.x, -state.pointer.y * 0.18, 0.04);
  });
  return <group ref={ref}>{children}</group>;
}

// Default export so it can be lazy-loaded via next/dynamic (ssr:false).
export default function HeroCanvas() {
  return (
    <Canvas
      camera={{ position: [0, 0, 7], fov: 45 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true }}
      style={{ background: "transparent" }}
    >
      <ambientLight intensity={1} />
      <Suspense fallback={null}>
        <ParallaxRig>
          <SplashCards />
        </ParallaxRig>
        <HextechParticles />
      </Suspense>
    </Canvas>
  );
}
