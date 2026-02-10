"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { ScrollControls, useScroll, Float, Stars, Sparkles } from "@react-three/drei";
import * as THREE from "three";

export default function Experience() {
    return (
        <ScrollControls pages={5} damping={0.2}>
            <Story />
        </ScrollControls>
    );
}

function Story() {
    const scroll = useScroll();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { width, height } = useThree((state) => state.viewport);

    // Refs for animation
    const sparkRef = useRef<THREE.Group>(null);
    const structureRef = useRef<THREE.Group>(null);
    const growthRef = useRef<THREE.Group>(null);
    const launchRef = useRef<THREE.Group>(null);

    // Particles for "Spark" phase
    const particlesCount = 200;
    const positions = useMemo(() => {
        const pos = new Float32Array(particlesCount * 3);
        // seed random for stability
        let seed = 1;
        const random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
        };

        for (let i = 0; i < particlesCount; i++) {
            pos[i * 3] = (random() - 0.5) * 10;
            pos[i * 3 + 1] = (random() - 0.5) * 10;
            pos[i * 3 + 2] = (random() - 0.5) * 10;
        }
        return pos;
    }, []);

    useFrame((state, delta) => {
        const offset = scroll.offset; // 0 to 1

        // Phase 1: Spark (0 to 0.25)
        if (sparkRef.current) {
            sparkRef.current.rotation.y += delta * 0.2;
            sparkRef.current.position.z = THREE.MathUtils.lerp(0, 10, offset * 4);
            sparkRef.current.visible = offset < 0.3;
        }

        // Phase 2: Structure (0.25 to 0.5)
        if (structureRef.current) {
            const active = offset > 0.15 && offset < 0.6;
            structureRef.current.visible = active;
            if (active) {
                const localProgress = (offset - 0.15) / 0.45;
                structureRef.current.rotation.x = localProgress * Math.PI * 2;
                structureRef.current.scale.setScalar(THREE.MathUtils.lerp(0.5, 1.5, localProgress));
            }
        }

        // Phase 3: Growth (0.5 to 0.75)
        if (growthRef.current) {
            const active = offset > 0.45 && offset < 0.85;
            growthRef.current.visible = active;
            if (active) {
                const localProgress = (offset - 0.45) / 0.4;
                growthRef.current.position.y = THREE.MathUtils.lerp(-5, 0, localProgress);
                growthRef.current.rotation.y += delta;
            }
        }

        // Phase 4: Launch (0.75 to 1)
        if (launchRef.current) {
            const active = offset > 0.7;
            launchRef.current.visible = active;
            if (active) {
                const localProgress = (offset - 0.7) / 0.3;
                launchRef.current.position.z = THREE.MathUtils.lerp(-10, 2, localProgress);
                launchRef.current.rotation.z += delta * 0.5;
            }
        }
    });

    return (
        <>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />


            {/* Phase 1: The Spark (Chaos) */}
            <group ref={sparkRef}>
                <points>
                    <bufferGeometry>
                        <bufferAttribute
                            attach="attributes-position"
                            count={particlesCount}
                            array={positions}
                            itemSize={3}
                            args={[positions, 3]}
                        />
                    </bufferGeometry>
                    <pointsMaterial size={0.05} color="#818cf8" transparent opacity={0.8} />
                </points>
                <Sparkles count={100} scale={5} size={2} speed={0.4} opacity={0.5} color="#c084fc" />
            </group>

            {/* Phase 2: The Structure (Wireframe Cube) */}
            <group ref={structureRef} visible={false}>
                <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
                    <mesh>
                        <boxGeometry args={[2, 2, 2]} />
                        <meshStandardMaterial wireframe color="#6366f1" />
                    </mesh>
                    <mesh scale={[0.9, 0.9, 0.9]}>
                        <boxGeometry args={[2, 2, 2]} />
                        <meshStandardMaterial color="#4f46e5" transparent opacity={0.1} />
                    </mesh>
                </Float>
            </group>

            {/* Phase 3: Growth (Rising Pillars) */}
            <group ref={growthRef} visible={false}>
                <mesh position={[-1.5, -1, 0]}>
                    <boxGeometry args={[1, 3, 1]} />
                    <meshStandardMaterial color="#818cf8" />
                </mesh>
                <mesh position={[0, 0, 0]}>
                    <boxGeometry args={[1, 5, 1]} />
                    <meshStandardMaterial color="#6366f1" />
                </mesh>
                <mesh position={[1.5, 1, 0]}>
                    <boxGeometry args={[1, 7, 1]} />
                    <meshStandardMaterial color="#4f46e5" />
                </mesh>
            </group>

            {/* Phase 4: Launch (Rocket/Gem) */}
            <group ref={launchRef} visible={false}>
                <Float speed={5} rotationIntensity={1} floatIntensity={2}>
                    <mesh>
                        <octahedronGeometry args={[1.5, 0]} />
                        <meshStandardMaterial
                            color="#c084fc"
                            emissive="#818cf8"
                            emissiveIntensity={0.5}
                            roughness={0.1}
                            metalness={0.8}
                        />
                    </mesh>
                    <Sparkles count={50} scale={3} size={3} speed={0.4} opacity={0.5} color="#ffffff" />
                </Float>
            </group>
        </>
    );
}
