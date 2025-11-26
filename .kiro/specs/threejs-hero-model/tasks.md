# Implementation Plan

- [x] 1. Install Three.js dependencies and remove Unicorn Studio





  - [x] 1.1 Add @react-three/fiber, @react-three/drei, and three packages to dependencies


    - Run `pnpm add three @react-three/fiber @react-three/drei`
    - Add @types/three to devDependencies
    - _Requirements: 3.1, 3.2_
  - [x] 1.2 Remove unicornstudio-react dependency


    - Run `pnpm remove unicornstudio-react`
    - _Requirements: 6.1_

- [x] 2. Create ThreeHeroModel component





  - [x] 2.1 Create the base ThreeHeroModel component with Canvas setup


    - Create `components/three-hero-model.tsx`
    - Set up R3F Canvas with proper sizing and background transparency
    - Add "use client" directive for client-side rendering
    - _Requirements: 3.1, 3.3_

  - [x] 2.2 Implement SkeletonModel internal component

    - Use useGLTF hook to load `skelton with plane.glb`
    - Configure scale, position, and rotation props
    - Add Suspense boundary for loading state
    - _Requirements: 1.1, 1.2, 3.2, 5.1_
  - [x] 2.3 Implement SceneLighting internal component

    - Add ambientLight with appropriate intensity (0.5-0.7)
    - Add directionalLight with position and intensity for depth
    - Consider adding a subtle fill light for better visibility
    - _Requirements: 2.1, 2.2, 2.3, 2.4_
  - [x] 2.4 Write property test for scene lighting configuration


    - **Property 1: Scene Lighting Configuration**
    - **Validates: Requirements 2.1, 2.2**
  - [x] 2.5 Add error boundary and fallback to Spotlight


    - Implement error state handling
    - Render Spotlight component on error
    - _Requirements: 5.2_
  - [x] 2.6 Write property test for error fallback rendering


    - **Property 5: Error Fallback Rendering**
    - **Validates: Requirements 5.2**
  - [x] 2.7 Add resource cleanup on unmount


    - Dispose geometries, materials, and textures
    - Use useEffect cleanup function
    - _Requirements: 3.4_

  - [x] 2.8 Write property test for resource cleanup

    - **Property 3: Resource Cleanup on Unmount**
    - **Validates: Requirements 3.4**

- [ ] 3. Update landing page hero section layout
  - [ ] 3.1 Restructure hero section to two-column grid layout
    - Use CSS Grid with lg:grid-cols-2
    - Place text content in left column
    - Place 3D model container in right column (desktop only)
    - _Requirements: 1.3, 1.4_
  - [ ] 3.2 Dynamically import ThreeHeroModel with SSR disabled
    - Use next/dynamic with ssr: false
    - Add loading placeholder component
    - _Requirements: 3.3, 5.1_
  - [ ] 3.3 Write property test for SSR safety
    - **Property 2: SSR Safety**
    - **Validates: Requirements 3.3**
  - [ ] 3.4 Maintain Meteors effect for mobile/tablet
    - Keep existing Meteors component for screens below lg breakpoint
    - Hide 3D model on mobile using hidden lg:block classes
    - _Requirements: 4.1, 4.2, 4.3_

- [ ] 4. Remove old Unicorn Studio implementation
  - [ ] 4.1 Delete HeroBackground component
    - Remove `components/hero-background.tsx`
    - Remove any imports of HeroBackground from page.tsx
    - _Requirements: 6.2_
  - [ ] 4.2 Remove localStorage fallback logic
    - Remove STORAGE_KEY and related localStorage code
    - _Requirements: 6.3_

- [ ] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 6. Write unit tests for ThreeHeroModel component
  - [ ] 6.1 Test component renders without crashing
    - _Requirements: 1.1_
  - [ ] 6.2 Test loading state displays placeholder
    - **Property 4: Loading State Display**
    - **Validates: Requirements 5.1**
  - [ ] 6.3 Test text content renders correctly in hero section
    - _Requirements: 1.3_

- [ ] 7. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
