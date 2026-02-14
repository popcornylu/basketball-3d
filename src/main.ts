import RAPIER from '@dimforge/rapier3d-compat';

async function main() {
  await RAPIER.init();
  console.log('Rapier version:', RAPIER.version());

  // Hide loading, show start menu
  const loading = document.getElementById('loading');
  if (loading) loading.style.display = 'none';
  const startMenu = document.getElementById('start-menu');
  if (startMenu) startMenu.style.display = '';

  // Wait for player count selection
  const playerCount = await new Promise<number>((resolve) => {
    const buttons = document.querySelectorAll('#mode-buttons button');
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const count = parseInt((btn as HTMLElement).dataset.players ?? '1', 10);
        resolve(count);
      });
    });
  });

  // Hide start menu, show HUD
  if (startMenu) startMenu.style.display = 'none';
  const hud = document.getElementById('hud');
  if (hud) hud.style.display = 'block';

  // Start game
  const { Game } = await import('./Game');
  const game = new Game(RAPIER, playerCount);
  game.start();
}

main().catch((err) => {
  console.error('Failed to start game:', err);
  const loading = document.getElementById('loading');
  if (loading) loading.textContent = 'Failed to load. Check console.';
});
