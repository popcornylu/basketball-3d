# 3D Basketball Shooting Game

A browser-based 3D basketball free-throw shooting game built with TypeScript, Three.js, and Rapier 3D physics.

## Features

- Physics-based shooting with kinematic trajectory calculation
- NBA regulation court dimensions and hoop height (3.05m / 10ft)
- Realistic ball physics with continuous collision detection
- Multi-ball continuous shooting — shoot again without waiting
- Swish detection (3 pts) vs rim shot (2 pts) scoring
- Power meter charge system with arc control
- WASD / Arrow key aiming with trajectory preview
- Sound effects for rim hits, bounces, and swishes
- HUD with score, shot percentage, and power bar

## Getting Started

### Prerequisites

- Node.js 18+

### Install & Run

```bash
npm install
npm run dev
```

Open the URL shown in terminal (default: `http://localhost:5173`).

### Build

```bash
npm run build
npm run preview
```

## Controls

| Key | Action |
|-----|--------|
| **Space** (hold) | Charge shot power |
| **Space** (release) | Shoot |
| **W / S** or **Up / Down** | Aim up / down |
| **A / D** or **Left / Right** | Aim left / right |
| **R** | Reset ball |
| **1** | Switch to keyboard controls |
| **2** | Switch to mouse controls |

### Tips

- Charge level controls the arc height — lower charge = flatter shot, higher charge = higher arc
- Sweet spot is around 35-55% charge for a clean free throw
- A swish (no rim contact) scores 3 points; a rim shot scores 2 points
- You can shoot again 0.5s after each shot — multiple balls can be in flight at once

## Tech Stack

- **TypeScript** — Strict mode, ES2020
- **Three.js** — 3D rendering (WebGL)
- **Rapier 3D** — WASM-based rigid body physics simulation
- **Vite** — Development server and bundler

## Project Structure

```
src/
├── Game.ts              # Main game orchestrator
├── core/                # Constants, events, state machine, game loop
├── shooting/            # Ball manager, shot mechanics, scoring
├── physics/             # Rapier physics bodies (ball, hoop, court)
├── rendering/           # Three.js meshes and scene
├── input/               # Keyboard, mouse, and gamepad controllers
├── audio/               # Sound effects
└── utils/               # Math helpers
```

## License

MIT
