import * as THREE from 'three';

export class SceneManager {
  readonly scene: THREE.Scene;
  readonly renderer: THREE.WebGLRenderer;

  get domElement(): HTMLCanvasElement {
    return this.renderer.domElement;
  }

  constructor(container: HTMLElement) {
    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x1a1a2e);
    this.scene.fog = new THREE.Fog(0x1a1a2e, 20, 40);

    this.setupLighting();

    // Resize handler
    this._onResize = this._onResize.bind(this);
    window.addEventListener('resize', this._onResize);
  }

  private setupLighting(): void {
    // Ambient light - soft fill
    const ambient = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambient);

    // Directional light - main sun-like light from above
    const dirLight = new THREE.DirectionalLight(0xfff5e6, 0.8);
    dirLight.position.set(5, 12, 5);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 30;
    dirLight.shadow.camera.left = -10;
    dirLight.shadow.camera.right = 10;
    dirLight.shadow.camera.top = 10;
    dirLight.shadow.camera.bottom = -10;
    dirLight.shadow.bias = -0.0005;
    this.scene.add(dirLight);

    // Point lights for gym feel
    const gymLight1 = new THREE.PointLight(0xffe0b2, 0.6, 20);
    gymLight1.position.set(-3, 8, 2);
    this.scene.add(gymLight1);

    const gymLight2 = new THREE.PointLight(0xffe0b2, 0.6, 20);
    gymLight2.position.set(3, 8, -2);
    this.scene.add(gymLight2);

    const gymLight3 = new THREE.PointLight(0xffe0b2, 0.4, 25);
    gymLight3.position.set(0, 9, 4);
    this.scene.add(gymLight3);
  }

  render(camera: THREE.PerspectiveCamera): void {
    this.renderer.render(this.scene, camera);
  }

  private _onResize(): void {
    const parent = this.renderer.domElement.parentElement;
    if (!parent) return;
    this.renderer.setSize(parent.clientWidth, parent.clientHeight);
  }

  dispose(): void {
    window.removeEventListener('resize', this._onResize);
    this.renderer.dispose();
  }
}
