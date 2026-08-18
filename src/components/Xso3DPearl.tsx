import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, MeshTransmissionMaterial, MeshDistortMaterial, Environment } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import * as THREE from 'three';

interface Xso3DPearlProps {
  isActive?: boolean;
  color?: string;
  openingMode?: boolean;
}

function PearlCore({ isActive, color, openingMode }: { isActive: boolean; color: string; openingMode: boolean }) {
  const outerMaterialRef = useRef<any>(null);
  const innerMaterialRef = useRef<any>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const shellGlowRef = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    if (innerMaterialRef.current) {
      // Smoothly interpolate distort and speed based on isActive
      const targetDistort = isActive ? 0.34 : openingMode ? 0.06 : 0.2;
      const targetSpeed = isActive ? 2.2 : openingMode ? 0.15 : 1;
      
      innerMaterialRef.current.distort = THREE.MathUtils.lerp(innerMaterialRef.current.distort, targetDistort, delta * 5);
      innerMaterialRef.current.speed = THREE.MathUtils.lerp(innerMaterialRef.current.speed, targetSpeed, delta * 5);
      innerMaterialRef.current.emissiveIntensity = THREE.MathUtils.lerp(
        innerMaterialRef.current.emissiveIntensity,
        isActive ? 1.55 : openingMode ? 0.35 : 1.25,
        delta * 3.5,
      );
    }
    
    if (outerMaterialRef.current) {
      outerMaterialRef.current.chromaticAberration = THREE.MathUtils.lerp(
        outerMaterialRef.current.chromaticAberration,
        openingMode ? 0.01 : 0.05,
        delta * 3,
      );
      outerMaterialRef.current.roughness = THREE.MathUtils.lerp(
        outerMaterialRef.current.roughness,
        openingMode ? 0.14 : 0.06,
        delta * 3,
      );
      outerMaterialRef.current.thickness = THREE.MathUtils.lerp(
        outerMaterialRef.current.thickness,
        openingMode ? 3.0 : 1.9,
        delta * 3,
      );
    }

    if (lightRef.current) {
      const targetIntensity = isActive ? 1.9 : openingMode ? 0.25 : 0.9;
      lightRef.current.intensity = THREE.MathUtils.lerp(lightRef.current.intensity, targetIntensity, delta * 5);
    }

    if (shellGlowRef.current) {
      const pulse = 0.15 + Math.sin(state.clock.elapsedTime * 0.4) * 0.05;
      const targetShellIntensity = isActive ? 0.8 : openingMode ? pulse : 0.6;
      shellGlowRef.current.intensity = THREE.MathUtils.lerp(
        shellGlowRef.current.intensity,
        targetShellIntensity,
        delta * 3,
      );
    }
  });

  return (
    <group>
      {/* Elegant highlight for the opening screen */}
      {openingMode && <directionalLight position={[2, 4, 3]} intensity={1.8} color="#ffffff" />}
      
      {/* Outer Shell (Premium Refractive Glass) */}
      <Sphere args={[1, 64, 64]}>
        <MeshTransmissionMaterial
          ref={outerMaterialRef}
          transmission={1}
          thickness={openingMode ? 3.0 : 1.7}
          roughness={openingMode ? 0.14 : 0.08}
          ior={openingMode ? 1.42 : 1.5}
          chromaticAberration={openingMode ? 0.01 : 0.02}
          backside={true}
          color={openingMode ? "#1a1b22" : "#16131b"}
          transparent
        />
      </Sphere>

      {/* Volatile Inner Core (The Magic) */}
      <Sphere args={[0.7, 128, 128]}>
        <MeshDistortMaterial
          ref={innerMaterialRef}
          color={color}
          emissive={color}
          emissiveIntensity={openingMode ? 0.35 : 0.82}
          distort={openingMode ? 0.06 : 0.12}
          speed={openingMode ? 0.15 : 0.45}
        />
      </Sphere>

      {/* Internal Lighting */}
      <pointLight ref={lightRef} color={color} intensity={openingMode ? 0.25 : 0.62} distance={4.2} />
      <pointLight ref={shellGlowRef} color={openingMode ? "#ffffff" : "#d9d1ff"} intensity={openingMode ? 0.2 : 0.5} distance={3.4} />
    </group>
  );
}

export default function Xso3DPearl({ isActive = false, color = '#8b5cf6', openingMode = false }: Xso3DPearlProps) {
  return (
    <div className="w-full h-full relative pointer-events-none">
      <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
        <React.Suspense fallback={null}>
          <Environment preset={openingMode ? "city" : "studio"} environmentIntensity={openingMode ? 0.08 : 0.35} />
          
          <PearlCore isActive={isActive} color={color} openingMode={openingMode} />

          <EffectComposer>
            <Bloom luminanceThreshold={openingMode ? 0.95 : 0.85} mipmapBlur intensity={openingMode ? 0.1 : 0.7} />
          </EffectComposer>
        </React.Suspense>
      </Canvas>
    </div>
  );
}
