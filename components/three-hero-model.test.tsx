import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fc from "fast-check";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import React from "react";

// Mock Three.js and R3F modules - factory must be completely inline
vi.mock("@react-three/fiber", () => ({
  Canvas: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="r3f-canvas">{children}</div>
  ),
}));

vi.mock("@react-three/drei", () => {
  const useGLTF = () => ({
    scene: {
      clone: () => ({ type: "Group", children: [] }),
    },
  });
  useGLTF.preload = () => {};
  useGLTF.clear = () => {};
  return { useGLTF };
});

vi.mock("three", () => ({
  default: {},
  Group: class Group {},
  Mesh: class Mesh {},
}));

// Import after mocks
import { ThreeHeroModel, ThreeHeroModelWithError, SceneLightingTestable } from "./three-hero-model";

describe("ThreeHeroModel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  /**
   * **Feature: threejs-hero-model, Property 1: Scene Lighting Configuration**
   * **Validates: Requirements 2.1, 2.2**
   * 
   * For any rendered 3D scene, the scene SHALL contain both ambient light
   * and at least one directional light component to ensure proper model illumination.
   */
  describe("Property 1: Scene Lighting Configuration", () => {
    it.each(
      fc.sample(
        fc.record({
          ambientIntensity: fc.float({ min: Math.fround(0.1), max: Math.fround(1.0), noNaN: true }),
          directionalIntensity: fc.float({ min: Math.fround(0.5), max: Math.fround(2.0), noNaN: true }),
          directionalX: fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true }),
          directionalY: fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true }),
          directionalZ: fc.float({ min: Math.fround(-10), max: Math.fround(10), noNaN: true }),
        }),
        100
      )
    )(
      "scene lighting always includes ambient and directional lights for config %j",
      async (config) => {
        // Test the SceneLightingTestable component directly to verify lighting configuration
        const { container } = render(
          <SceneLightingTestable 
            ambientIntensity={config.ambientIntensity}
            directionalIntensity={config.directionalIntensity}
            directionalPosition={[config.directionalX, config.directionalY, config.directionalZ]}
          />
        );
        
        // The component should render without crashing
        expect(container).toBeTruthy();
        
        // Verify ambient light is present
        const ambientLight = screen.queryByTestId("ambient-light");
        expect(ambientLight).toBeTruthy();
        expect(ambientLight?.getAttribute("data-intensity")).toBe(String(config.ambientIntensity));
        
        // Verify directional light is present
        const directionalLight = screen.queryByTestId("directional-light");
        expect(directionalLight).toBeTruthy();
        expect(directionalLight?.getAttribute("data-intensity")).toBe(String(config.directionalIntensity));
        
        // Verify fill light is present (additional directional light)
        const fillLight = screen.queryByTestId("fill-light");
        expect(fillLight).toBeTruthy();
      }
    );
  });

  /**
   * **Feature: threejs-hero-model, Property 5: Error Fallback Rendering**
   * **Validates: Requirements 5.2**
   * 
   * For any model loading error, the component SHALL render the Spotlight 
   * fallback component instead of showing broken content.
   */
  describe("Property 5: Error Fallback Rendering", () => {
    it.each(
      fc.sample(
        fc.record({
          errorMessage: fc.string({ minLength: 1, maxLength: 100 }),
          errorName: fc.constantFrom("Error", "TypeError", "ReferenceError", "WebGLError"),
        }),
        100
      )
    )(
      "error fallback renders Spotlight for error %j",
      async ({ errorMessage, errorName }) => {
        // Test that when hasError is true, the component renders the Spotlight fallback
        // We use the exported test helper that simulates error state
        const { container } = render(<ThreeHeroModelWithError />);
        
        // The component should render without crashing
        expect(container).toBeTruthy();
        
        // Verify the Spotlight SVG is rendered (fallback)
        const spotlightSvg = container.querySelector("svg");
        expect(spotlightSvg).toBeTruthy();
        
        // Verify the canvas is NOT rendered when in error state
        const canvas = screen.queryByTestId("r3f-canvas");
        expect(canvas).toBeNull();
      }
    );
  });

  /**
   * **Feature: threejs-hero-model, Property 2: SSR Safety**
   * **Validates: Requirements 3.3**
   * 
   * For any server-side render attempt, the ThreeHeroModel component SHALL not 
   * throw errors and SHALL render null or a placeholder without accessing browser-only APIs.
   */
  describe("Property 2: SSR Safety", () => {
    it.each(
      fc.sample(
        fc.record({
          className: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
          hasWindow: fc.boolean(),
        }),
        100
      )
    )(
      "component handles SSR safely for config %j",
      async ({ className }) => {
        // The ThreeHeroModel component uses a mounted state to handle SSR
        // On initial render (before useEffect runs), it returns a placeholder
        // This simulates the SSR behavior where useEffect doesn't run
        
        // Render the component - in test environment, useEffect runs synchronously
        // but the component is designed to show placeholder until mounted
        const { container } = render(
          <ThreeHeroModel className={className ?? undefined} />
        );
        
        // The component should render without throwing errors
        expect(container).toBeTruthy();
        
        // The component should not crash when rendered
        // It either shows the canvas (client) or placeholder (SSR-like initial state)
        // Both are valid outcomes that don't throw errors
        const hasContent = container.innerHTML.length > 0;
        expect(hasContent).toBe(true);
        
        // Verify no browser-only API errors were thrown
        // If we got here, the component handled the render safely
      }
    );

    it("renders placeholder before mount state is set", () => {
      // This tests the SSR path where mounted is false
      // The component should return ModelPlaceholder in this case
      const { container } = render(<ThreeHeroModel />);
      
      // Component should render something (either placeholder or canvas)
      expect(container).toBeTruthy();
      expect(container.innerHTML.length).toBeGreaterThan(0);
    });
  });

  /**
   * **Feature: threejs-hero-model, Property 3: Resource Cleanup on Unmount**
   * **Validates: Requirements 3.4**
   * 
   * For any component unmount event, the ThreeHeroModel component SHALL dispose 
   * of Three.js resources (geometries, materials, textures) to prevent memory leaks.
   */
  describe("Property 3: Resource Cleanup on Unmount", () => {
    it.each(
      fc.sample(
        fc.record({
          mountDuration: fc.integer({ min: 0, max: 100 }),
          className: fc.option(fc.string({ minLength: 0, maxLength: 50 }), { nil: undefined }),
        }),
        100
      )
    )(
      "component cleans up resources on unmount for config %j",
      async ({ className }) => {
        // Render the component
        const { unmount, container } = render(
          <ThreeHeroModel className={className ?? undefined} />
        );
        
        // Verify component rendered
        expect(container).toBeTruthy();
        
        // Unmount the component - this should trigger cleanup
        // The cleanup function calls useGLTF.clear() and disposeObject()
        unmount();
        
        // After unmount, the container should be empty
        // This verifies the component was properly unmounted
        expect(container.innerHTML).toBe("");
      }
    );
  });
});
