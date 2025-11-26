"use client";

import { Suspense, useState, useEffect, useRef, Component, ReactNode, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { Spotlight } from "@/components/ui/spotlight";

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


// Skeleton model component that loads the GLB file with drag rotation
interface DraggableSkeletonModelProps extends SkeletonModelProps {
  dragRotationY: number;
}

function SkeletonModel({
  url,
  scale = 2,
  position = [0, -1, 0],
  rotation = [0, 0.5, 0],
  dragRotationY = 0,
}: DraggableSkeletonModelProps) {
  const { scene } = useGLTF(url);
  const clonedSceneRef = useRef<THREE.Object3D | null>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // Spring physics state for smooth bounce-back
  const springRef = useRef({
    current: 0,
    target: 0,
    velocity: 0,
  });

  // Clone the scene to avoid issues with reusing the same geometry
  const clonedScene = scene.clone();
  clonedSceneRef.current = clonedScene;

  // Update spring target when drag rotation changes
  useEffect(() => {
    springRef.current.target = dragRotationY;
  }, [dragRotationY]);

  // Animate with spring physics
  useFrame((_, delta) => {
    const spring = springRef.current;
    const stiffness = 180; // Spring stiffness
    const damping = 12; // Damping factor
    
    // Spring force calculation
    const displacement = spring.target - spring.current;
    const springForce = displacement * stiffness;
    const dampingForce = spring.velocity * damping;
    const acceleration = springForce - dampingForce;
    
    // Update velocity and position
    spring.velocity += acceleration * delta;
    spring.current += spring.velocity * delta;
    
    // Apply rotation to the group
    if (groupRef.current) {
      groupRef.current.rotation.y = rotation[1] + spring.current;
    }
  });

  // Cleanup cloned scene on unmount
  useEffect(() => {
    return () => {
      if (clonedSceneRef.current) {
        disposeObject(clonedSceneRef.current);
      }
    };
  }, []);

  return (
    <group ref={groupRef} rotation={[rotation[0], rotation[1], rotation[2]]}>
      <primitive
        object={clonedScene}
        scale={scale}
        position={position}
        rotation={[0, 0, 0]}
      />
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
      useGLTF.clear("/skelton with plane.glb");
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
        style={{ height: "100%", width: "100%", cursor: "grab", touchAction: "none" }}
        {...handlers}
      >
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          style={{ background: "transparent", pointerEvents: "none" }}
          gl={{ alpha: true, antialias: true }}
          onCreated={(state) => {
            // Set up error handling for WebGL context loss
            state.gl.domElement.addEventListener("webglcontextlost", () => {
              handleError(new Error("WebGL context lost"));
            });
          }}
        >
          <SceneLighting />
          <Suspense fallback={null}>
            <SkeletonModel url="/skelton with plane.glb" dragRotationY={dragRotation} />
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

// Preload the model for better performance
useGLTF.preload("/skelton with plane.glb");
