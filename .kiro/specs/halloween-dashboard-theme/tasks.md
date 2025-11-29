# Implementation Plan

- [x] 1. Create FloatingParticles component






  - [x] 1.1 Create base FloatingParticles component with particle generation

    - Create `components/floating-particles.tsx`
    - Implement particle state with random positions, sizes, and colors
    - Use Halloween color palette (#fb923c, #a855f7, #f8fafc, #fbbf24, #c084fc)
    - Add "use client" directive
    - _Requirements: 2.1, 2.3_

  - [x] 1.2 Add CSS animations for floating effect
    - Implement keyframe animations for smooth particle movement
    - Use CSS transforms for GPU-accelerated animations
    - Set pointer-events: none on particle container
    - _Requirements: 2.2, 2.4, 4.1_
  - [ ]* 1.3 Write property test for particle count limit
    - **Property 1: Particle Count Limit**
    - **Validates: Requirements 4.4**
  - [ ]* 1.4 Write property test for particle color validity
    - **Property 2: Particle Color Validity**
    - **Validates: Requirements 2.3**
  - [ ]* 1.5 Write property test for particle non-interference
    - **Property 3: Particle Non-Interference**
    - **Validates: Requirements 2.4**

  - [x] 1.6 Add responsive particle count reduction for mobile
    - Detect viewport width using useEffect and resize listener
    - Reduce particle count to 8 on mobile (< 1024px)
    - _Requirements: 5.1, 5.2_
  - [ ]* 1.7 Write property test for mobile particle reduction
    - **Property 4: Mobile Particle Reduction**

    - **Validates: Requirements 5.1**
  - [x] 1.8 Add cleanup for animation frames and event listeners
    - Cancel any requestAnimationFrame on unmount
    - Remove resize event listener on unmount
    - _Requirements: 4.3_
  - [ ]* 1.9 Write property test for resource cleanup on unmount
    - **Property 5: Resource Cleanup on Unmount**
    - **Validates: Requirements 4.3**

- [x] 2. Update dashboard page with Halloween theme





  - [x] 2.1 Import and add FloatingParticles to dashboard


    - Import FloatingParticles component
    - Position as fixed background layer with z-index 0
    - Add pointer-events-none class
    - _Requirements: 1.1, 2.1_

  - [x] 2.2 Add SpookyGhost component to dashboard

    - Import existing SpookyGhost component
    - Position in bottom-right corner
    - Set appropriate size (w-20 h-20)
    - _Requirements: 1.2_

  - [x] 2.3 Replace PageTitle with DrippingText

    - Import DrippingText component
    - Use orange color (#fb923c) for Halloween effect
    - Wrap "Dashboard" text with DrippingText
    - _Requirements: 1.3_
  - [x] 2.4 Add Halloween glow effect to StatsCard component


    - Add subtle orange/purple glow on card borders
    - Implement hover effect with enhanced glow
    - Maintain readability of statistics
    - _Requirements: 3.1, 3.2, 3.3_

- [x] 3. Checkpoint - Ensure all tests pass





  - Ensure all tests pass, ask the user if questions arise.

- [ ]* 4. Write unit tests for Halloween dashboard
  - [ ]* 4.1 Test FloatingParticles renders without crashing
    - _Requirements: 2.1_
  - [ ]* 4.2 Test SpookyGhost is present in dashboard
    - _Requirements: 1.2_
  - [ ]* 4.3 Test DrippingText is used for page title
    - _Requirements: 1.3_
  - [ ]* 4.4 Test stats cards have Halloween styling
    - _Requirements: 3.1_

- [ ] 5. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
