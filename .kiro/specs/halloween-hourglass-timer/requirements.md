# Requirements Document

## Introduction

This feature adds an animated hourglass timer component to the Study Dashboard page. The hourglass displays sand dripping animation that visually represents the study session progress, complementing the Halloween-themed dashboard aesthetic with atmospheric effects and smooth animations.

## Glossary

- **HalloweenHourglass Component**: An SVG-based animated hourglass that displays timer progress through sand level visualization
- **Sand Stream**: Animated particles flowing from the top bulb to the bottom bulb of the hourglass
- **Progress**: A value from 0 to 100 representing the percentage of study session completed
- **Study Timer**: The parent component that tracks study session time and controls the hourglass state
- **Halloween Glow**: Purple and orange accent effects that match the dashboard's Halloween theme

## Requirements

### Requirement 1

**User Story:** As a user, I want to see an animated hourglass on my study timer, so that I have a visual representation of my study session progress.

#### Acceptance Criteria

1. WHEN the study timer renders with halloweenGlow enabled THEN the HalloweenHourglass_Component SHALL display an SVG hourglass with two bulbs connected by a narrow neck
2. WHEN the timer progress changes THEN the HalloweenHourglass_Component SHALL update the sand levels to reflect the current progress percentage
3. WHEN progress is 0% THEN the HalloweenHourglass_Component SHALL display sand fully in the top bulb
4. WHEN progress is 100% THEN the HalloweenHourglass_Component SHALL display sand fully in the bottom bulb

### Requirement 2

**User Story:** As a user, I want to see sand flowing animation when my timer is active, so that I know my study session is in progress.

#### Acceptance Criteria

1. WHEN the timer is active and progress is less than 99% THEN the HalloweenHourglass_Component SHALL display an animated sand stream flowing through the neck
2. WHEN the timer is paused THEN the HalloweenHourglass_Component SHALL stop the sand stream animation
3. WHEN sand flows THEN the HalloweenHourglass_Component SHALL display splash particles at the bottom where sand lands
4. WHEN the sand stream animates THEN the HalloweenHourglass_Component SHALL use a grainy effect with multiple animated lines

### Requirement 3

**User Story:** As a user, I want the hourglass to match the Halloween theme, so that it feels cohesive with the dashboard design.

#### Acceptance Criteria

1. WHEN halloweenGlow is enabled THEN the HalloweenHourglass_Component SHALL use orange (#fb923c) as the primary sand color
2. WHEN halloweenGlow is enabled THEN the HalloweenHourglass_Component SHALL display purple glow accents on the frame corners
3. WHEN halloweenGlow is enabled THEN the HalloweenHourglass_Component SHALL apply a purple drop shadow to the hourglass
4. WHEN the hourglass renders THEN the HalloweenHourglass_Component SHALL include glass reflections for a realistic appearance

### Requirement 4

**User Story:** As a developer, I want the hourglass animations to be performant, so that the study timer remains responsive.

#### Acceptance Criteria

1. WHEN animations run THEN the HalloweenHourglass_Component SHALL use CSS animations for smooth 60fps performance
2. WHEN sand levels change THEN the HalloweenHourglass_Component SHALL use CSS transitions with linear easing for smooth updates
3. WHEN the component renders THEN the HalloweenHourglass_Component SHALL use SVG elements for scalable, resolution-independent graphics
4. WHEN multiple animations run THEN the HalloweenHourglass_Component SHALL limit animation complexity to prevent performance degradation

### Requirement 5

**User Story:** As a user, I want the hourglass to have a polished appearance, so that it enhances my study experience.

#### Acceptance Criteria

1. WHEN the hourglass renders THEN the HalloweenHourglass_Component SHALL display a metallic frame with gradient styling
2. WHEN the hourglass renders THEN the HalloweenHourglass_Component SHALL display glass with subtle transparency and reflections
3. WHEN sand is present THEN the HalloweenHourglass_Component SHALL display a gradient from lighter to darker shade
4. WHEN the top sand surface renders THEN the HalloweenHourglass_Component SHALL display an elliptical surface for 3D depth effect
