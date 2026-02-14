// NBA Standard Dimensions
export const HOOP_HEIGHT = 3.05; // 10 feet (m)
export const RIM_RADIUS = 0.2286; // 9 inches (m)
export const RIM_THICKNESS = 0.02; // Rim tube thickness (m)
export const BALL_RADIUS = 0.12; // (m)
export const BALL_MASS = 0.624; // (kg)
export const BALL_RESTITUTION = 0.7;
export const RIM_RESTITUTION = 0.55;
export const FREE_THROW_DIST = 4.57; // 15 feet (m)
export const BACKBOARD_WIDTH = 1.83; // 6 feet (m)
export const BACKBOARD_HEIGHT = 1.07; // 3.5 feet (m)
export const BACKBOARD_THICKNESS = 0.05; // (m)
export const BACKBOARD_OFFSET = 0.15; // Distance from rim to backboard front (m)

// Court dimensions
export const COURT_LENGTH = 15; // (m)
export const COURT_WIDTH = 10; // (m)
export const COURT_Y = 0; // Floor Y position

// Camera / Player
export const PLAYER_HEIGHT = 1.8; // (m)
export const PLAYER_POSITION = { x: 0, y: PLAYER_HEIGHT, z: FREE_THROW_DIST + 1}; // At free throw line

// Hoop position (at the basket end)
export const HOOP_POSITION = { x: 0, y: HOOP_HEIGHT, z: 0 };
export const BACKBOARD_POSITION = {
  x: 0,
  y: HOOP_HEIGHT + BACKBOARD_HEIGHT / 2 - 0.15,
  z: -BACKBOARD_OFFSET - BACKBOARD_THICKNESS / 2,
};

// Physics
export const GRAVITY = { x: 0, y: -9.81, z: 0 };
export const PHYSICS_TIMESTEP = 1 / 60;
export const RIM_CAPSULE_COUNT = 14; // Number of capsules forming the rim ring

// Shooting
export const MIN_SHOOT_POWER = 3;
export const MAX_SHOOT_POWER = 12;
export const CHARGE_RATE = 1.5; // per second, 0 to 1
export const AIM_SENSITIVITY = 0.003;

// Scoring
export const SWISH_POINTS = 3;
export const NORMAL_POINTS = 2;

// Ball reset - positioned in front of player, clearly visible from camera
export const BALL_RESET_POSITION = {
  x: 0,
  y: PLAYER_HEIGHT - 0.25,
  z: FREE_THROW_DIST - 0.8,
};
export const BALL_OUT_OF_BOUNDS_Y = -2;
export const BALL_RESET_DELAY = 1500; // ms after result

// Multi-ball
export const MAX_FLYING_BALLS = 10;
export const BALL_CLEANUP_DELAY = 3000; // ms - remove settled balls after 3s
export const BALL_SPAWN_DELAY = 500; // ms - delay before next ball appears after shooting

// Net animation
export const NET_HEIGHT = 0.45;
export const NET_SEGMENTS = 12;
export const NET_RINGS = 5;
export const NET_TAPER = 0.3;
export const NET_WAVE_SPEED = 8.0;
export const NET_WAVE_AMPLITUDE = 0.12;
export const NET_RADIAL_AMPLITUDE = 0.04;
export const NET_TWIST_AMPLITUDE = 0.15;
export const NET_SPRING_DAMPING = 4.0;
export const NET_SPRING_FREQUENCY = 10.0;
export const NET_ANIMATION_DURATION = 1.5;

// Player configuration
export const PLAYER_COLORS = [0xff6a00, 0x3399ff, 0x33cc66]; // orange, blue, green
export const PLAYER_KNOB_COLORS = ['#ff6a00', '#3399ff', '#33cc66'];
export const PLAYER_OFFSETS_X: Record<number, number[]> = {
  1: [0],
  2: [-0.2, 0.2],
  3: [-0.4, 0, 0.4],
};
