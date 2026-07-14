"use client";

import { useTexture, Float } from "@react-three/drei";
import * as THREE from "three";
import { championLoadingUrl } from "@/lib/ddragon";

interface CardDef {
  champion: string;
  position: [number, number, number];
  rotation: number;
  scale: number;
}

// Real champion loading art (lightweight ~60KB portraits) floating in 3D.
const CARDS: CardDef[] = [
  { champion: "Ahri", position: [-3.1, 0.2, -0.5], rotation: 0.22, scale: 1.0 },
  { champion: "Yasuo", position: [0, -0.3, 0.8], rotation: -0.04, scale: 1.15 },
  { champion: "Lux", position: [3.1, 0.5, -0.6], rotation: -0.22, scale: 0.95 },
];

const ASPECT = 560 / 308; // loading-art portrait ratio

function Card({ champion, position, rotation, scale }: CardDef) {
  const texture = useTexture(championLoadingUrl(champion));
  texture.colorSpace = THREE.SRGBColorSpace;
  const width = 1.7 * scale;

  return (
    <Float speed={2} rotationIntensity={0.25} floatIntensity={0.5}>
      <group position={position} rotation={[0, rotation, 0]}>
        {/* Gold frame slightly behind the portrait */}
        <mesh position={[0, 0, -0.02]}>
          <planeGeometry args={[width + 0.08, width * ASPECT + 0.08]} />
          <meshBasicMaterial color="#C89B3C" transparent opacity={0.55} />
        </mesh>
        <mesh>
          <planeGeometry args={[width, width * ASPECT]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
      </group>
    </Float>
  );
}

export function SplashCards() {
  return (
    <>
      {CARDS.map((card) => (
        <Card key={card.champion} {...card} />
      ))}
    </>
  );
}
