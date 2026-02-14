import type RAPIER_TYPE from '@dimforge/rapier3d-compat';
import * as THREE from 'three';

import { EventBus } from './core/EventBus';
import { GameLoop } from './core/GameLoop';
import { GameState, ShootingState } from './core/GameState';
import {
  BALL_RESET_POSITION,
  BALL_MASS,
} from './core/Constants';

// Rendering
import { SceneManager } from './rendering/SceneManager';
import { CameraController } from './rendering/CameraController';
import { CourtRenderer } from './rendering/CourtRenderer';
import { HoopRenderer } from './rendering/HoopRenderer';
import { HandRenderer } from './rendering/HandRenderer';
import { TrajectoryRenderer } from './rendering/TrajectoryRenderer';
import { HUDRenderer } from './rendering/HUDRenderer';

// Physics
import { PhysicsWorld } from './physics/PhysicsWorld';
import { CourtPhysics } from './physics/CourtPhysics';
import { HoopPhysics } from './physics/HoopPhysics';

// Shooting
import { ShootingMechanic } from './shooting/ShootingMechanic';
import { BallManager } from './shooting/BallManager';

// Input
import { InputManager } from './input/InputManager';
import { PullShotController } from './input/PullShotController';

// Joystick overlay
import { JoystickOverlay } from './rendering/JoystickOverlay';

// Audio
import { AudioManager } from './audio/AudioManager';

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
  private handRenderer: HandRenderer;
  private trajectoryRenderer: TrajectoryRenderer;
  private hudRenderer: HUDRenderer;

  // Physics
  private physicsWorld: PhysicsWorld;
  private courtPhysics: CourtPhysics;
  private hoopPhysics: HoopPhysics;

  // Shooting
  private shootingMechanic: ShootingMechanic;
  private ballManager: BallManager;

  // Input
  private inputManager: InputManager;
  private joystickOverlay: JoystickOverlay;

  // Audio
  private audioManager: AudioManager;

  // State
  private lastBallBounceTime = { value: 0 };
  private shotFiredTime = 0;

  constructor(RAPIER: typeof RAPIER_TYPE) {
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
    this.handRenderer = new HandRenderer(this.cameraController.getCamera());
    this.trajectoryRenderer = new TrajectoryRenderer(this.sceneManager.scene);
    this.hudRenderer = new HUDRenderer();

    // Add camera to scene (needed for HandRenderer which is a child of camera)
    this.sceneManager.scene.add(this.cameraController.getCamera());

    // --- Physics ---
    this.physicsWorld = new PhysicsWorld(RAPIER);
    this.courtPhysics = new CourtPhysics(this.physicsWorld);
    this.hoopPhysics = new HoopPhysics(this.physicsWorld);

    // --- Shooting ---
    this.shootingMechanic = new ShootingMechanic();
    this.ballManager = new BallManager(
      this.physicsWorld,
      this.sceneManager.scene,
      this.eventBus,
      this.hoopPhysics,
    );

    // --- Input ---
    this.inputManager = new InputManager();
    this.joystickOverlay = new JoystickOverlay(container);
    const pullShotController = new PullShotController(this.joystickOverlay.getKnobElement());
    pullShotController.setOnPullUpdate((data) => this.joystickOverlay.update(data));
    this.inputManager.registerController(pullShotController);
    this.inputManager.setActiveController('pullshot');

    // --- Audio ---
    this.audioManager = new AudioManager();

    // --- Setup ---
    this.setupEventHandlers();
    this.setupGameLoop();
    this.setupResize();

    // Initial HUD
    this.hudRenderer.updateScore(0, 0, 0);
    this.hudRenderer.updatePowerBar(0);
  }

  private setupEventHandlers(): void {
    // Scoring
    this.eventBus.on('shot:scored', (data) => {
      this.gameState.addScore(data.points);
      const msg = data.type === 'swish' ? 'SWISH!' : 'SCORE!';
      this.hudRenderer.showMessage(msg, 2000);
      this.hudRenderer.updateScore(
        this.gameState.score,
        this.gameState.shots,
        this.gameState.makes,
      );
      this.audioManager.playSound('swish');
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
    });
  }

  private fixedUpdate(dt: number): void {
    // 1. Snapshot input state BEFORE update (getState returns a mutable reference,
    //    and update() calls clearTriggers which would zero shootTriggered/resetTriggered)
    const raw = this.inputManager.getState();
    const input = {
      aimDirection: { x: raw.aimDirection.x, y: raw.aimDirection.y },
      chargeLevel: raw.chargeLevel,
      isCharging: raw.isCharging,
      shootTriggered: raw.shootTriggered,
      resetTriggered: raw.resetTriggered,
    };
    this.inputManager.update(dt);

    // 2. State machine logic (simplified: AIMING ↔ CHARGING only)
    const state = this.gameState.state;

    switch (state) {
      case ShootingState.AIMING: {
        // Hold hand ball in place (gravity off, at reset position)
        const handBall = this.ballManager.getHandBall();
        if (handBall) {
          handBall.physics.setGravityScale(0);
          handBall.physics.reset(BALL_RESET_POSITION);

          // Transition to charging when input starts charging (only if hand ball ready)
          if (input.isCharging) {
            this.gameState.transition(ShootingState.CHARGING);
            this.shootingMechanic.getPowerMeter().startCharging();
          }
        }
        break;
      }

      case ShootingState.CHARGING: {
        if (input.shootTriggered) {
          // Compute impulse and shoot via BallManager
          const impulse = this.shootingMechanic.shoot(input.chargeLevel, input.aimDirection.x);
          this.ballManager.shootHandBall(impulse);

          this.gameState.addShot();
          this.shotFiredTime = performance.now();
          this.trajectoryRenderer.setVisible(false);

          // Reset shooting mechanic for next shot and go back to AIMING
          this.shootingMechanic.reset();
          this.gameState.transition(ShootingState.AIMING);
        } else if (!input.isCharging) {
          // Released without shooting (cancel / drag up) — go back to AIMING
          this.shootingMechanic.reset();
          this.gameState.transition(ShootingState.AIMING);
        } else {
          // Hold hand ball in place while charging, update power meter
          this.shootingMechanic.update(input, dt);
          const handBall = this.ballManager.getHandBall();
          if (handBall) {
            handBall.physics.setGravityScale(0);
            handBall.physics.reset(BALL_RESET_POSITION);
          }
        }
        break;
      }
    }

    // 3. Update all flying balls (evaluate shots, clean up settled balls)
    this.ballManager.update();

    // 4. Step physics
    this.physicsWorld.step();

    // 5. Detect ball bounces on ground (for sound)
    this.ballManager.detectBounces(this.lastBallBounceTime);

    // 6. Update camera (fixed forward, no aim panning)
    this.cameraController.update(0, 0);

    // 7. Update HUD power bar
    const chargeLevel = this.shootingMechanic.getChargeLevel();
    this.hudRenderer.updatePowerBar(input.isCharging ? input.chargeLevel : chargeLevel);

    // 8. Update trajectory preview during charging (show predicted arc)
    const handBallForTrajectory = this.ballManager.getHandBall();
    if (handBallForTrajectory && state === ShootingState.CHARGING && input.chargeLevel > 0) {
      this.trajectoryRenderer.setVisible(true);
      // Compute preview impulse matching the actual shoot() calculation
      const previewImpulse = this.shootingMechanic.shoot(input.chargeLevel, input.aimDirection.x);
      const ballPos = handBallForTrajectory.physics.getPosition();
      const startPos = new THREE.Vector3(ballPos.x, ballPos.y, ballPos.z);
      const dir = new THREE.Vector3(previewImpulse.x, previewImpulse.y, previewImpulse.z).normalize();
      const power = new THREE.Vector3(previewImpulse.x, previewImpulse.y, previewImpulse.z).length() / BALL_MASS;
      this.trajectoryRenderer.update(startPos, dir, power);
    } else {
      this.trajectoryRenderer.setVisible(false);
    }
  }

  private render(): void {
    // Sync all ball physics to rendering (hand ball + flying balls)
    this.ballManager.syncRendering();

    // Update hand animation
    const state = this.gameState.state;
    const input = this.inputManager.getState();
    const justShot = performance.now() - this.shotFiredTime < 400;
    this.handRenderer.update(
      input.chargeLevel,
      state === ShootingState.CHARGING,
      justShot,
    );

    // Render
    this.sceneManager.render(this.cameraController.getCamera());
  }

  start(): void {
    this.gameLoop.start();
  }

  dispose(): void {
    this.gameLoop.stop();
    this.inputManager.dispose();
    this.joystickOverlay.dispose();
    this.audioManager.dispose();
    this.hudRenderer.dispose();
    this.trajectoryRenderer.dispose();
    this.handRenderer.dispose();
    this.ballManager.dispose();
    this.hoopRenderer.dispose();
    this.courtRenderer.dispose();
    this.hoopPhysics.dispose();
    this.courtPhysics.dispose();
    this.physicsWorld.dispose();
    this.sceneManager.dispose();
  }
}
