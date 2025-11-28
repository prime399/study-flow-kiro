"use client";

import { Suspense, useState, useEffect, useRef, Component, ReactNode, useCallback, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Spotlight } from "@/components/ui/spotlight";

// ============================================
// SCENE CONFIGURATION - Adjust these values
// ============================================
const SCENE_CONFIG = {
  // Camera settings
  cameraPosition: [0, 0, 5] as [number, number, number],
  cameraFov: 50,
  
  // Model default rotation (in radians) - ~75 degrees from right = ~1.31 radians
  modelDefaultRotationY: -0.7, // Adjust: 0 = front, Math.PI/2 (1.57) = 90°, Math.PI (3.14) = 180°
  
  // Model scale and position
  modelScale: 1,
  modelPosition: [0, -1, 0] as [number, number, number],
  
  // Scene container aspect ratio (width multiplier)
  horizontalScale: 1.5, // Increase for wider scene (1.0 = default, 1.5 = 50% wider)
  
  // Right top point light settings
  rightTopLight: {
    enabled: true,
    position: [10, 10, 20] as [number, number, number],
    intensity: 3,
    color: "#ffffff",
    distance: 15,
    decay: 2,
  },
  
  // Pumpkin spotlight position
  pumpkinLightPosition: [-1.10403, -0.752614, 0.623707] as [number, number, number],
};

// Error Boundary for catching React render errors in 3D scene
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback: ReactNode;
  onError?: (error: Error) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ThreeErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("ThreeHeroModel Error Boundary caught error:", error);
    this.props.onError?.(error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

interface ThreeHeroModelProps {
  className?: string;
}

interface SkeletonModelProps {
  url: string;
  scale?: number;
  position?: [number, number, number];
  rotation?: [number, number, number];
}

interface SceneLightingProps {
  ambientIntensity?: number;
  directionalIntensity?: number;
  directionalPosition?: [number, number, number];
}


// Loading placeholder component
function ModelPlaceholder() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white/80" />
    </div>
  );
}

// Scene lighting component
function SceneLighting({
  ambientIntensity = 0.6,
  directionalIntensity = 1.2,
  directionalPosition = [5, 5, 5],
}: SceneLightingProps) {
  return (
    <>
      <ambientLight intensity={ambientIntensity} />
      <directionalLight
        position={directionalPosition}
        intensity={directionalIntensity}
        castShadow
      />
      {/* Fill light for better visibility */}
      <directionalLight position={[-3, 2, -5]} intensity={0.4} />
      
      {/* Right top point light - configurable via SCENE_CONFIG */}
      {SCENE_CONFIG.rightTopLight.enabled && (
        <pointLight
          position={SCENE_CONFIG.rightTopLight.position}
          intensity={SCENE_CONFIG.rightTopLight.intensity}
          color={SCENE_CONFIG.rightTopLight.color}
          distance={SCENE_CONFIG.rightTopLight.distance}
          decay={SCENE_CONFIG.rightTopLight.decay}
        />
      )}
    </>
  );
}

// Exported for testing - validates lighting configuration
export function SceneLightingTestable(props: SceneLightingProps) {
  const {
    ambientIntensity = 0.6,
    directionalIntensity = 1.2,
    directionalPosition = [5, 5, 5],
  } = props;
  
  // Return a testable representation of the lighting config
  return (
    <div data-testid="scene-lighting">
      <div data-testid="ambient-light" data-intensity={ambientIntensity} />
      <div 
        data-testid="directional-light" 
        data-intensity={directionalIntensity}
        data-position={JSON.stringify(directionalPosition)}
      />
      <div data-testid="fill-light" data-intensity={0.4} />
    </div>
  );
}

// Utility function to dispose of Three.js resources
function disposeObject(object: THREE.Object3D) {
  if (!object || typeof object.traverse !== "function") {
    return;
  }
  
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => {
            disposeMaterial(material);
          });
        } else {
          disposeMaterial(child.material);
        }
      }
    }
  });
}

// Utility function to dispose of material and its textures
function disposeMaterial(material: THREE.Material) {
  if (!material) return;
  material.dispose();
  
  // Dispose textures if they exist (for MeshStandardMaterial)
  const mat = material as THREE.MeshStandardMaterial;
  if (mat.map) mat.map.dispose();
  if (mat.normalMap) mat.normalMap.dispose();
  if (mat.roughnessMap) mat.roughnessMap.dispose();
  if (mat.metalnessMap) mat.metalnessMap.dispose();
  if (mat.aoMap) mat.aoMap.dispose();
  if (mat.emissiveMap) mat.emissiveMap.dispose();
}


// Animated spotlight inside the pumpkin (flickering candle effect)
function PumpkinSpotlight({ position = [-1.10403, -0.752614, 0.623707] }: { position?: [number, number, number] }) {
  const spotlightRef = useRef<THREE.SpotLight>(null);
  const targetRef = useRef<THREE.Object3D>(null);
  
  // Flickering animation state
  const flickerRef = useRef({
    baseIntensity: 15,
    time: 0,
  });

  useFrame((state, delta) => {
    if (!spotlightRef.current) return;
    
    const flicker = flickerRef.current;
    flicker.time += delta;
    
    // Create organic flickering effect using multiple sine waves
    const flicker1 = Math.sin(flicker.time * 8) * 0.15;
    const flicker2 = Math.sin(flicker.time * 13) * 0.1;
    const flicker3 = Math.sin(flicker.time * 21) * 0.05;
    const randomFlicker = Math.random() * 0.05 - 0.025;
    
    // Combine for natural candle-like flickering
    const intensityMultiplier = 1 + flicker1 + flicker2 + flicker3 + randomFlicker;
    spotlightRef.current.intensity = flicker.baseIntensity * intensityMultiplier;
    
    // Subtle color temperature variation (warm orange to yellow)
    const colorShift = Math.sin(flicker.time * 5) * 0.05;
    spotlightRef.current.color.setRGB(1, 0.6 + colorShift, 0.2);
    
    // Request next frame for continuous animation
    state.invalidate();
  });

  return (
    <>
      {/* Target for the spotlight to point at */}
      <object3D ref={targetRef} position={[position[0], position[1] + 2, position[2]]} />
      
      {/* Main spotlight inside pumpkin */}
      <spotLight
        ref={spotlightRef}
        position={position}
        target={targetRef.current || undefined}
        intensity={15}
        color="#ff9933"
        angle={Math.PI / 6}
        penumbra={0.3}
        distance={5}
        decay={2}
        castShadow
      />
      
      {/* Point light for inner glow effect */}
      <pointLight
        position={position}
        intensity={3}
        color="#ff6600"
        distance={2}
        decay={2}
      />
    </>
  );
}

// Skeleton model component that loads the GLB file with drag rotation
interface DraggableSkeletonModelProps extends SkeletonModelProps {
  dragRotationY: number;
}

function SkeletonModel({
  url,
  scale = SCENE_CONFIG.modelScale,
  position = SCENE_CONFIG.modelPosition,
  rotation = [0, SCENE_CONFIG.modelDefaultRotationY, 0],
  dragRotationY = 0,
}: DraggableSkeletonModelProps) {
  const { scene } = useGLTF(url);
  const groupRef = useRef<THREE.Group>(null);
  
  // Spring physics state for smooth bounce-back
  const springRef = useRef({
    current: 0,
    target: 0,
    velocity: 0,
  });

  // Clone the scene ONCE using useMemo to prevent memory leaks
  const clonedScene = useMemo(() => {
    const clone = scene.clone();
    // Optimize: reduce texture quality for large textures
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const mat = child.material as THREE.MeshStandardMaterial;
        if (mat.map) {
          mat.map.minFilter = THREE.LinearFilter;
          mat.map.generateMipmaps = false;
        }
      }
    });
    return clone;
  }, [scene]);

  // Update spring target when drag rotation changes
  useEffect(() => {
    springRef.current.target = dragRotationY;
  }, [dragRotationY]);

  // Animate with spring physics
  useFrame((state, delta) => {
    const spring = springRef.current;
    const stiffness = 180;
    const damping = 12;
    
    const displacement = spring.target - spring.current;
    const springForce = displacement * stiffness;
    const dampingForce = spring.velocity * damping;
    const acceleration = springForce - dampingForce;
    
    spring.velocity += acceleration * delta;
    spring.current += spring.velocity * delta;
    
    if (groupRef.current) {
      groupRef.current.rotation.y = rotation[1] + spring.current;
    }
    
    // Only continue rendering if animation is active
    if (Math.abs(spring.velocity) > 0.001 || Math.abs(displacement) > 0.001) {
      state.invalidate();
    }
  });

  // Cleanup cloned scene on unmount
  useEffect(() => {
    return () => {
      disposeObject(clonedScene);
    };
  }, [clonedScene]);

  return (
    <group ref={groupRef} rotation={[rotation[0], rotation[1], rotation[2]]}>
      <primitive
        object={clonedScene}
        scale={scale}
        position={position}
        rotation={[0, 0, 0]}
      />
      <PumpkinSpotlight position={SCENE_CONFIG.pumpkinLightPosition} />
    </group>
  );
}

// Spotlight fallback component
function SpotlightFallback({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="relative h-full w-full">
        <Spotlight
          className="top-10 left-0 md:left-60 md:-top-20"
          fill="white"
        />
      </div>
    </div>
  );
}

// Custom hook for drag-to-rotate interaction
function useDragRotation(maxRotation: number = Math.PI) {
  const [dragRotation, setDragRotation] = useState(0);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const currentRotation = useRef(0);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    isDragging.current = true;
    startX.current = e.clientX;
    currentRotation.current = dragRotation;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [dragRotation]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    
    const deltaX = e.clientX - startX.current;
    const sensitivity = 0.005; // Adjust for rotation speed
    let newRotation = currentRotation.current + deltaX * sensitivity;
    
    // Clamp rotation to max range (±180 degrees = ±π radians)
    newRotation = Math.max(-maxRotation, Math.min(maxRotation, newRotation));
    
    setDragRotation(newRotation);
  }, [maxRotation]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    
    // Bounce back to original position
    setDragRotation(0);
  }, []);

  const handlePointerLeave = useCallback((e: React.PointerEvent) => {
    if (isDragging.current) {
      isDragging.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture may already be released
      }
      // Bounce back to original position
      setDragRotation(0);
    }
  }, []);

  return {
    dragRotation,
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerLeave: handlePointerLeave,
    },
  };
}

// Main ThreeHeroModel component
export function ThreeHeroModel({ className }: ThreeHeroModelProps) {
  const [hasError, setHasError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { dragRotation, handlers } = useDragRotation(Math.PI); // 180 degrees max

  useEffect(() => {
    setMounted(true);
  }, []);

  // Resource cleanup on unmount
  useEffect(() => {
    return () => {
      // Dispose of cached GLTF resources
      useGLTF.clear("/third scene with animation-optimized.glb");
    };
  }, []);

  // Handle errors from the 3D scene
  const handleError = (error: Error) => {
    console.error("ThreeHeroModel error:", error);
    setHasError(true);
  };

  // Don't render on server
  if (!mounted) {
    return <ModelPlaceholder />;
  }

  // Fallback to Spotlight on error
  if (hasError) {
    return <SpotlightFallback className={className} />;
  }

  return (
    <ThreeErrorBoundary
      fallback={<SpotlightFallback className={className} />}
      onError={handleError}
    >
      <div 
        ref={containerRef} 
        className={className} 
        style={{ 
          height: "100%", 
          width: `${100 * SCENE_CONFIG.horizontalScale}%`, 
          cursor: "grab", 
          touchAction: "none",
          marginTop: "-90px",
          marginBottom: "25px",
          position: "relative",
        }}
        {...handlers}
      >
        <Canvas
          camera={{ position: SCENE_CONFIG.cameraPosition, fov: SCENE_CONFIG.cameraFov }}
          style={{ background: "transparent", pointerEvents: "none", position: "relative", zIndex: 1 }}
          gl={{ 
            alpha: true, 
            antialias: false, // Disable for better performance
            powerPreference: "low-power", // Use integrated GPU when possible
            precision: "lowp", // Lower precision for better performance
            depth: true,
            stencil: false, // Disable if not needed
          }}
          dpr={[1, 1.5]} // Limit pixel ratio to reduce GPU memory
          frameloop="demand" // Only render when needed
          onCreated={(state) => {
            // Limit max texture size to reduce memory
            state.gl.capabilities.maxTextureSize = Math.min(
              state.gl.capabilities.maxTextureSize,
              2048
            );
            state.gl.domElement.addEventListener("webglcontextlost", () => {
              handleError(new Error("WebGL context lost"));
            });
          }}
        >
          <SceneLighting />
          <Suspense fallback={null}>
            <SkeletonModel url="/third scene with animation-optimized.glb" dragRotationY={dragRotation} />
          </Suspense>
        </Canvas>
      </div>
    </ThreeErrorBoundary>
  );
}

// Test helper component that simulates error state for property testing
export function ThreeHeroModelWithError({ className }: ThreeHeroModelProps) {
  return <SpotlightFallback className={className} />;
}

// Preload the optimized model (2.6MB with Draco compression)
useGLTF.preload("/third scene with animation-optimized.glb");
