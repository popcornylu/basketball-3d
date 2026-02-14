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

## Agent Teams for Complex Tasks

For complex features — especially those requiring design, architectural decisions, or multi-file changes — use **agent teams** instead of implementing everything in a single session.

### When to Use Agent Teams

- Features that touch 3+ files across different subsystems (physics, rendering, input, shooting)
- Tasks requiring a design/plan phase before implementation
- Work that can be parallelized across independent modules
- Debugging with multiple competing hypotheses

For sequential tasks, same-file edits, or simple changes, a single session or subagents are more effective.

### Recommended Workflow

1. **Plan first**: Enter plan mode to design the feature. Identify file boundaries and parallelizable work.
2. **Create the team**: Describe the task and team structure. Assign each teammate a distinct set of files to avoid conflicts.
3. **Require plan approval** for risky or architectural changes — teammates plan in read-only mode until the lead approves.
4. **Use delegate mode** (Shift+Tab) to keep the lead focused on coordination, not implementation.
5. **Lead integrates last**: After teammates finish parallel work, the lead handles integration (e.g., wiring everything together in `Game.ts`).

### Team Patterns for This Project

**New game system** (e.g., multi-ball, net physics):
- Agent 1: Foundation — constants, type changes, shared resource refactoring
- Agent 2: Core module — the new system (e.g., `BallManager.ts`)
- Lead: Integration into `Game.ts` after both complete

**Cross-layer feature** (e.g., new input method + visuals + physics):
- Agent 1: Physics layer changes
- Agent 2: Rendering layer changes
- Agent 3: Input layer changes
- Lead: Wiring in `Game.ts` + testing

**Investigation / debugging**:
- Spawn 2-3 agents with different hypotheses, have them challenge each other's findings

### Key Rules

- **Avoid file conflicts**: Never assign two teammates to edit the same file. Break work by file ownership.
- **Size tasks right**: 5-6 tasks per teammate. Too small = coordination overhead; too large = wasted effort if off track.
- **Give context in spawn prompts**: Teammates don't inherit conversation history. Include relevant file paths, architecture details, and acceptance criteria.
- **Wait for teammates**: Tell the lead to wait for teammates before proceeding if it starts implementing on its own.
- **Clean up**: Always shut down teammates before cleaning up the team. Only the lead should run cleanup.
