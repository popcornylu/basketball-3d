import type RAPIER_TYPE from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

import { EventBus } from './core/EventBus';
import { GameLoop } from './core/GameLoop';
import { GameState, ShootingState } from './core/GameState';
import {
  BALL_RESET_POSITION,
  BALL_MASS,
  PLAYER_COLORS,
  PLAYER_KNOB_COLORS,
  PLAYER_OFFSETS_X,
} from './core/Constants';

// Rendering
import { SceneManager } from './rendering/SceneManager';
import { CameraController } from './rendering/CameraController';
import { CourtRenderer } from './rendering/CourtRenderer';
import { HoopRenderer } from './rendering/HoopRenderer';
import { TrajectoryRenderer } from './rendering/TrajectoryRenderer';
import { HUDRenderer } from './rendering/HUDRenderer';
import { NetRenderer } from './rendering/NetRenderer';

// Physics
import { PhysicsWorld } from './physics/PhysicsWorld';
import { CourtPhysics } from './physics/CourtPhysics';
import { HoopPhysics } from './physics/HoopPhysics';

// Shooting
import { ShootingMechanic } from './shooting/ShootingMechanic';
import { BallManager } from './shooting/BallManager';

// Input
import { PullShotController } from './input/PullShotController';

// Joystick overlay
import { JoystickOverlay } from './rendering/JoystickOverlay';

// Audio
import { AudioManager } from './audio/AudioManager';

interface PlayerData {
  controller: PullShotController;
  mechanic: ShootingMechanic;
  ballManager: BallManager;
  trajectory: TrajectoryRenderer;
  state: ShootingState;
  shotFiredTime: number;
  resetPosition: { x: number; y: number; z: number };
}

export class Game {
  // Core
  private eventBus: EventBus;
  private gameState: GameState;
  private gameLoop: GameLoop;

  // Rendering
  private sceneManager: SceneManager;
  private cameraController: CameraController;
  private courtRenderer: CourtRenderer;
  private hoopRenderer: HoopRenderer;
  private hudRenderer: HUDRenderer;
  private netRenderer: NetRenderer;

  // Physics
  private physicsWorld: PhysicsWorld;
  private courtPhysics: CourtPhysics;
  private hoopPhysics: HoopPhysics;

  // Joystick overlay
  private joystickOverlay: JoystickOverlay;

  // Audio
  private audioManager: AudioManager;

  // Players
  private players: PlayerData[] = [];
  private playerCount: number;

  // State
  private lastBallBounceTime = { value: 0 };

  constructor(RAPIER: typeof RAPIER_TYPE, playerCount: number = 1) {
    this.playerCount = playerCount;
    const container = document.getElementById('app')!;

    // --- Core ---
    this.eventBus = new EventBus();
    this.gameState = new GameState(this.eventBus);
    this.gameLoop = new GameLoop();

    // --- Rendering ---
    this.sceneManager = new SceneManager(container);
    const aspect = container.clientWidth / container.clientHeight;
    this.cameraController = new CameraController(aspect);
    this.courtRenderer = new CourtRenderer(this.sceneManager.scene);
    this.hoopRenderer = new HoopRenderer(this.sceneManager.scene);
    this.hudRenderer = new HUDRenderer();
    this.netRenderer = new NetRenderer(this.sceneManager.scene, this.eventBus);

    // Add camera to scene
    this.sceneManager.scene.add(this.cameraController.getCamera());

    // --- Physics ---
    this.physicsWorld = new PhysicsWorld(RAPIER);
    this.courtPhysics = new CourtPhysics(this.physicsWorld);
    this.hoopPhysics = new HoopPhysics(this.physicsWorld);

    // --- Joystick overlay ---
    this.joystickOverlay = new JoystickOverlay(
      container,
      playerCount,
      PLAYER_KNOB_COLORS.slice(0, playerCount),
    );

    // --- Per-player setup ---
    const offsets = PLAYER_OFFSETS_X[playerCount] ?? [0];
    for (let i = 0; i < playerCount; i++) {
      const resetPos = {
        x: BALL_RESET_POSITION.x + offsets[i],
        y: BALL_RESET_POSITION.y,
        z: BALL_RESET_POSITION.z,
      };
      const color = PLAYER_COLORS[i];

      const knobEl = this.joystickOverlay.getKnobElement(i);
      const controller = new PullShotController(knobEl);
      controller.setOnPullUpdate((data) => this.joystickOverlay.update(i, data));
      controller.enable();

      const mechanic = new ShootingMechanic(resetPos);
      const ballManager = new BallManager(
        this.physicsWorld,
        this.sceneManager.scene,
        this.eventBus,
        this.hoopPhysics,
        { ballColor: color, resetPosition: resetPos },
      );
      const trajectory = new TrajectoryRenderer(this.sceneManager.scene, color);

      this.players.push({
        controller,
        mechanic,
        ballManager,
        trajectory,
        state: ShootingState.AIMING,
        shotFiredTime: 0,
        resetPosition: resetPos,
      });
    }

    // --- Audio ---
    this.audioManager = new AudioManager();

    // --- Setup ---
    this.setupEventHandlers();
    this.setupGameLoop();
    this.setupResize();

    // HUD config
    this.hudRenderer.updateScore(0, 0, 0);
    this.hudRenderer.updatePowerBar(0);
    if (playerCount > 1) {
      this.hudRenderer.setMultiplayer(true);
    }

  }

  private setupEventHandlers(): void {
    this.eventBus.on('shot:scored', (data) => {
      this.gameState.addScore(data.points);
      const msg = data.type === 'swish' ? 'SWISH!' : 'SCORE!';
      this.hudRenderer.showMessage(msg, 2000);
      this.hudRenderer.updateScore(
        this.gameState.score,
        this.gameState.shots,
        this.gameState.makes,
      );
      this.audioManager.playSound('net');
      if (data.type === 'swish') {
        this.audioManager.playSound('swish');
      }
    });

    this.eventBus.on('shot:missed', () => {
      this.hudRenderer.showMessage('MISS', 1500);
    });

    this.eventBus.on('ball:rim-hit', () => {
      this.audioManager.playSound('rim');
    });

    this.eventBus.on('ball:bounce', () => {
      this.audioManager.playSound('bounce');
    });
  }

  private setupGameLoop(): void {
    this.gameLoop.setFixedUpdate((dt) => this.fixedUpdate(dt));
    this.gameLoop.setRender(() => this.render());
  }

  private setupResize(): void {
    window.addEventListener('resize', () => {
      const container = document.getElementById('app')!;
      const w = container.clientWidth;
      const h = container.clientHeight;
      this.cameraController.setAspect(w / h);
      this.updateKnobPositions();
    });
  }

  /** Project each player's ball reset position to screen pixels and position knobs there. */
  private lastKnobW = 0;
  private lastKnobH = 0;

  private updateKnobPositions(): void {
    const container = document.getElementById('app')!;
    const w = container.clientWidth;
    const h = container.clientHeight;

    // Re-sync renderer + camera if container size changed
    if (w !== this.lastKnobW || h !== this.lastKnobH) {
      this.lastKnobW = w;
      this.lastKnobH = h;
      this.sceneManager.renderer.setSize(w, h);
      this.cameraController.setAspect(w / h);
    }

    const camera = this.cameraController.getCamera();
    camera.updateMatrixWorld(true);

    for (let i = 0; i < this.players.length; i++) {
      const rp = this.players[i].resetPosition;
      const pos = new THREE.Vector3(rp.x, rp.y, rp.z);
      pos.project(camera); // NDC: x,y in [-1,1]
      const screenX = (pos.x * 0.5 + 0.5) * w;
      const screenY = (-pos.y * 0.5 + 0.5) * h;
      this.joystickOverlay.setBaseScreenPosition(i, screenX, screenY);
    }
  }

  private fixedUpdate(dt: number): void {
    // Update each player
    for (const player of this.players) {
      // 1. Snapshot input state BEFORE clearing triggers
      const raw = player.controller.getState();
      const input = {
        aimDirection: { x: raw.aimDirection.x, y: raw.aimDirection.y },
        chargeLevel: raw.chargeLevel,
        isCharging: raw.isCharging,
        shootTriggered: raw.shootTriggered,
        resetTriggered: raw.resetTriggered,
      };
      player.controller.clearTriggers();

      // 2. State machine logic per player
      switch (player.state) {
        case ShootingState.AIMING: {
          const handBall = player.ballManager.getHandBall();
          if (handBall) {
            handBall.physics.setGravityScale(0);
            handBall.physics.reset(player.resetPosition);

            if (input.isCharging) {
              player.state = ShootingState.CHARGING;
              player.mechanic.getPowerMeter().startCharging();
            }
          }
          break;
        }

        case ShootingState.CHARGING: {
          if (input.shootTriggered) {
            const impulse = player.mechanic.shoot(input.chargeLevel, input.aimDirection.x);
            player.ballManager.shootHandBall(impulse);

            this.gameState.addShot();
            player.shotFiredTime = performance.now();
            player.trajectory.setVisible(false);

            player.mechanic.reset();
            player.state = ShootingState.AIMING;
          } else if (!input.isCharging) {
            player.mechanic.reset();
            player.state = ShootingState.AIMING;
          } else {
            player.mechanic.update(input, dt);
            const handBall = player.ballManager.getHandBall();
            if (handBall) {
              handBall.physics.setGravityScale(0);
              handBall.physics.reset(player.resetPosition);
            }
          }
          break;
        }
      }

      // 3. Update flying balls per player
      player.ballManager.update();

      // 4. Detect bounces per player (shared throttle)
      player.ballManager.detectBounces(this.lastBallBounceTime);

      // 5. Update trajectory preview
      const handBall = player.ballManager.getHandBall();
      if (handBall && player.state === ShootingState.CHARGING && input.chargeLevel > 0) {
        player.trajectory.setVisible(true);
        const previewImpulse = player.mechanic.shoot(input.chargeLevel, input.aimDirection.x);
        const ballPos = handBall.physics.getPosition();
        const startPos = new THREE.Vector3(ballPos.x, ballPos.y, ballPos.z);
        const dir = new THREE.Vector3(previewImpulse.x, previewImpulse.y, previewImpulse.z).normalize();
        const power = new THREE.Vector3(previewImpulse.x, previewImpulse.y, previewImpulse.z).length() / BALL_MASS;
        player.trajectory.update(startPos, dir, power);
      } else {
        player.trajectory.setVisible(false);
      }
    }

    // Step physics once after all players
    this.physicsWorld.step();

    // Update camera
    this.cameraController.update(0, 0);

    // Update HUD power bar (1P only — use first player's charge)
    if (this.playerCount === 1) {
      const p = this.players[0];
      const raw = p.controller.getState();
      const chargeLevel = p.mechanic.getChargeLevel();
      this.hudRenderer.updatePowerBar(raw.isCharging ? raw.chargeLevel : chargeLevel);
    }
  }

  private render(): void {
    // Sync all players' ball physics to rendering
    for (const player of this.players) {
      player.ballManager.syncRendering();
    }

    // Animate net
    this.netRenderer.update();

    // Render
    this.sceneManager.render(this.cameraController.getCamera());

    // Keep knobs aligned with projected ball positions every frame
    this.updateKnobPositions();
  }

  start(): void {
    this.gameLoop.start();
  }

  dispose(): void {
    this.gameLoop.stop();
    for (const player of this.players) {
      player.controller.dispose();
      player.mechanic.reset();
      player.ballManager.dispose();
      player.trajectory.dispose();
    }
    this.joystickOverlay.dispose();
    this.audioManager.dispose();
    this.hudRenderer.dispose();
    this.netRenderer.dispose();
    this.hoopRenderer.dispose();
    this.courtRenderer.dispose();
    this.hoopPhysics.dispose();
    this.courtPhysics.dispose();
    this.physicsWorld.dispose();
    this.sceneManager.dispose();
  }
}
