import RAPIER from '@dimforge/rapier3d-compat';

async function main() {
  await RAPIER.init();
  console.log('Rapier version:', RAPIER.version());

  // Import Game
  const { Game } = await import('./Game');
  const game = new Game(RAPIER);
  game.start();

  // Hide loading screen
  const loading = document.getElementById('loading');
  if (loading) loading.style.display = 'none';
  const hud = document.getElementById('hud');
  if (hud) hud.style.display = 'block';
}

main().catch((err) => {
  console.error('Failed to start game:', err);
  const loading = document.getElementById('loading');
  if (loading) loading.textContent = 'Failed to load. Check console.';
});
