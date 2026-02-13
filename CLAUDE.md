# CLAUDE.md

## Project Overview

3D basketball free-throw shooting game built with TypeScript, Three.js (rendering), and Rapier 3D (physics). The player stands at the free-throw line and shoots basketballs at a regulation hoop.

## Tech Stack

- **Language**: TypeScript (strict mode, ES2020 target)
- **Rendering**: Three.js 0.170
- **Physics**: Rapier 3D 0.14 (WASM-based rigid body physics)
- **Bundler**: Vite 6 with WASM + top-level-await plugins
- **Module system**: ESM (`"type": "module"`)

## Commands

- `npm run dev` — Start Vite dev server with HMR
- `npm run build` — Type-check (`tsc`) then production build
- `npm run preview` — Preview production build locally
- `npx tsc --noEmit` — Type-check only (no output)

## Project Structure

```
src/
├── main.ts                        # Entry point, loads Rapier WASM
├── Game.ts                        # Main orchestrator, game loop, state machine
├── core/
│   ├── Constants.ts               # All game constants (dimensions, physics, scoring)
│   ├── EventBus.ts                # Typed event system (GameEvents)
│   ├── GameLoop.ts                # Fixed-timestep game loop (1/60s)
│   └── GameState.ts               # State machine (AIMING ↔ CHARGING) + score tracking
├── shooting/
│   ├── BallManager.ts             # Multi-ball manager (hand ball + flying balls)
│   ├── ShootingMechanic.ts        # Physics-based shot calculation (kinematic equations)
│   ├── ShotEvaluator.ts           # Score/miss detection per ball (rim contact, sensor)
│   ├── PowerMeter.ts              # Charge level tracking (0→1)
│   └── AimSystem.ts               # Aim offset from input
├── physics/
│   ├── PhysicsWorld.ts            # Rapier world wrapper
│   ├── BallPhysics.ts             # Ball rigid body (dynamic, CCD enabled)
│   ├── HoopPhysics.ts             # Rim (14 capsules) + backboard + scoring sensor
│   ├── CourtPhysics.ts            # Floor collider
│   └── NetPhysics.ts              # Net physics
├── rendering/
│   ├── SceneManager.ts            # Three.js scene + renderer setup
│   ├── CameraController.ts        # Camera with aim direction
│   ├── BallRenderer.ts            # Ball mesh (shared geometry/material across instances)
│   ├── CourtRenderer.ts           # Court/floor mesh
│   ├── HoopRenderer.ts            # Hoop/rim visual
│   ├── HandRenderer.ts            # Animated hand (child of camera)
│   ├── TrajectoryRenderer.ts      # Shot arc preview line
│   └── HUDRenderer.ts             # DOM-based HUD (score, power bar, messages)
├── input/
│   ├── InputController.ts         # Interface + InputState type
│   ├── InputManager.ts            # Multi-controller management
│   ├── KeyboardController.ts      # WASD/Arrow aim, Space charge/shoot, R reset
│   ├── MouseController.ts         # Mouse-based aiming
│   ├── JoyConController.ts        # Nintendo JoyCon support
│   └── CameraTrackingController.ts
├── audio/
│   ├── AudioManager.ts            # Sound playback
│   └── SoundEffects.ts            # Sound definitions
└── utils/
    ├── MathUtils.ts               # lerp, createRingPositions, etc.
    └── PhysicsSync.ts             # Physics-to-render sync helpers
```

## Architecture

### State Machine

Player uses a simplified 2-state machine: `AIMING ↔ CHARGING`. There is no blocking FLIGHT/RESULT state — the player can shoot continuously.

### Multi-Ball System

- **Hand ball**: Always at the player's hand (gravity off). This is what the player aims.
- **Flying balls**: After shooting, the hand ball becomes a flying ball tracked by its own `ShotEvaluator`. A new hand ball spawns after `BALL_SPAWN_DELAY` (500ms).
- Flying balls are cleaned up `BALL_CLEANUP_DELAY` (3s) after settling.
- Max `MAX_FLYING_BALLS` (10) in flight simultaneously.

### Event-Driven Communication

Systems communicate via `EventBus` with typed events:
- `shot:scored`, `shot:missed` — per-ball scoring results
- `ball:rim-hit`, `ball:bounce` — sound triggers
- `state:change` — state machine transitions

### Physics

- Fixed timestep at 60 FPS via `GameLoop`
- Rapier physics world stepped once per fixed update
- Ball uses CCD (Continuous Collision Detection) to prevent tunneling through rim
- Scoring sensor is a cylinder collider set as sensor (intersection detection, no collision response)

### Rendering

- `BallRenderer` uses static shared geometry/material with reference counting for multi-ball performance
- Physics → render sync happens every render frame via `BallManager.syncRendering()`

## Key Patterns

- `ShootingMechanic.shoot(chargeLevel)` returns an impulse vector `{x, y, z}` — it does NOT apply it directly
- `BallManager.shootHandBall(impulse)` handles the full shoot flow: apply impulse, create evaluator, spawn next hand ball after delay
- Input state is snapshot BEFORE `inputManager.update()` each frame to preserve one-frame triggers (`shootTriggered`)
- All game constants live in `src/core/Constants.ts` — dimensions use real NBA measurements in meters

## Coding Conventions

- No default exports — use named exports everywhere
- Rapier is loaded async in `main.ts` and passed as constructor arg to `Game`
- `dispose()` pattern used for cleanup across all systems
- Avoid adding comments/docstrings to unchanged code
