// import * as BABYLON from 'babylonjs';
import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';

class PongComponent
{
   // private scene!: BABYLON.Scene;
  private canvas: HTMLCanvasElement;
  private leftPaddle!: BABYLON.Mesh;
  private rightPaddle!: BABYLON.Mesh;
  private ball: BABYLON.Mesh;
  private scoreText1!: GUI.TextBlock;
  private scoreText2!: GUI.TextBlock;
  private scene: BABYLON.Scene;
  
  private camera!: BABYLON.FreeCamera;
  private cameraTargetY = 0;
  private cameraCurrentY = 0;
  private cameraTilt = 0;

  private container: HTMLElement;

  private _paddleHeight = 80;
  private ballRadius = 8;

  // Paddle positions
  private leftPaddleY = 0;
  private _rightPaddleY = 0;
  private prevLeftPaddleY?: number;
  private prevRightPaddleY?: number;

  // Ball position & velocity
  private ballX = 0;
  private _ballY = 0;
  private ballSpeedX = 4;
  private ballSpeedY = 3;
  private ballSpeedMultiplier = 1; // Ajouté pour accélération progressive
  private ballSpeedIncrement = 0.003; // Plus la partie dure, plus ça accélère

  // Paddle speed and movement flags
  private _paddleSpeed = 6;
  private leftPaddleUp = false;
  private leftPaddleDown = false;
  private _rightPaddleUp = false;
  private _rightPaddleDown = false;

  // Ajout: compteurs de frames pour accélération progressive
  private leftPaddleUpFrames = 0;
  private leftPaddleDownFrames = 0;
  private rightPaddleUpFrames = 0;
  private rightPaddleDownFrames = 0;

  private player1 = "player_1";
  private player2 = "player_2";
  private player1_score = 0;
  private player2_score = 0;

  // private aiType?: string; // Ajout: type d'IA (si nécessaire)

  private createHitParticles(position: BABYLON.Vector3) {
    const particleSystem = new BABYLON.ParticleSystem("particles", 200, this.scene);

    // Texture for particles (you can use any small dot or spark texture)
    particleSystem.particleTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/flare.png", this.scene);

    // Position where particles emit
    particleSystem.emitter = position.clone();

    particleSystem.minEmitBox = new BABYLON.Vector3(0, 0, 0); // Start at emitter position
    particleSystem.maxEmitBox = new BABYLON.Vector3(0.1, 0.1, 0.1); // Small spread

    // Particle colors
    particleSystem.color1 = new BABYLON.Color4(1, 0.8, 0, 1.0);  // Yellow-ish
    particleSystem.color2 = new BABYLON.Color4(1, 0.4, 0, 1.0);  // Orange-ish
    particleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0.0);

    // Particle size
    particleSystem.minSize = 0.1;
    particleSystem.maxSize = 0.3;

    // Lifetime
    particleSystem.minLifeTime = 0.2;
    particleSystem.maxLifeTime = 0.5;

    // Emission rate
    particleSystem.emitRate = 500;

    // Direction and speed
    particleSystem.direction1 = new BABYLON.Vector3(-1, 1, 0);
    particleSystem.direction2 = new BABYLON.Vector3(1, 1, 0);

    particleSystem.minEmitPower = 1;
    particleSystem.maxEmitPower = 3;

    particleSystem.updateSpeed = 0.01;

    // Start the particle system
    particleSystem.start();

    // Stop emitting after 0.1 seconds and dispose after 1 second
    setTimeout(() => {
      particleSystem.stop();
      setTimeout(() => {
        particleSystem.dispose();
      }, 100);
    }, 100);
}


  constructor(player1: string, player2: string, options?: { aiType?: string })
  {
        this.player1 = player1;
        this.player2 = player2;

        // Ajout: options pour IA
        // if (options?.aiType) {
        //   this.aiType = options.aiType;
        // }

        this.container = document.createElement('div');
        this.container.className = 'pong-container p-4 rounded-lg neon-glow-border'; // Ajoute une classe pour le contour glow

        this.canvas = document.createElement('canvas');
        this.canvas.width = 800;
        this.canvas.height = 600;
        this.canvas.className = 'rounded-lg shadow-lg neon-glow-canvas'; // Ajoute une classe pour le glow CSS
        this.container.appendChild(this.canvas);

        // Initialize paddle positions centered vertically
        this.leftPaddleY = this.canvas.height / 2 - this._paddleHeight / 2;
        this._rightPaddleY = this.canvas.height / 2 - this._paddleHeight / 2;

        // Initialize ball in the center
        this.ballX = this.canvas.width / 2;
        this._ballY = this.canvas.height / 2;

        // Setup keyboard listeners
        this.setupInputListeners();

        const engine = new BABYLON.Engine(this.canvas, true);
        this.scene = new BABYLON.Scene(engine);
        const scene = this.scene;

        // === AJOUT CAMERA ===
        this.camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 0, -32), scene);
        this.camera.setTarget(BABYLON.Vector3.Zero());
        this.camera.fov = 0.8;
        this.camera.minZ = 0.1;
        this.camera.maxZ = 1000;

        // FOND CYBERPUNK/NEON
        // Utilise un material de fond custom avec un dégradé
        scene.clearColor = new BABYLON.Color4(0.04, 0.04, 0.14, 1); // navy dark

        // Ajoute un plan au fond avec un shader dégradé
        const bg = BABYLON.MeshBuilder.CreatePlane("bg", {width: 32, height: 24}, scene);
        bg.position.z = 2;
        const bgMat = new BABYLON.StandardMaterial("bgMat", scene);
        bgMat.emissiveColor = new BABYLON.Color3(0.02, 0.13, 0.18); // base
        bgMat.alpha = 1;
        bgMat.diffuseTexture = null;
        bgMat.disableLighting = true;
        bgMat.backFaceCulling = false;
        bg.material = bgMat;

        // Ajoute un effet de glow global
        const glow = new BABYLON.GlowLayer("glow", scene, { blurKernelSize: 32 });
        glow.intensity = 0.7;

        // PADDLES
        this.leftPaddle = BABYLON.MeshBuilder.CreateBox("leftPaddle", { width: 0.5, height: 4, depth: 4 }, scene);
        this.leftPaddle.position.x = -14;
        this.rightPaddle = BABYLON.MeshBuilder.CreateBox("rightPaddle", { width: 0.5, height: 4, depth: 4 }, scene);
        this.rightPaddle.position.x = 14;

        // Matériau néon pour les paddles
        const paddleMaterial = new BABYLON.StandardMaterial("paddleMat", scene);
        paddleMaterial.emissiveColor = new BABYLON.Color3(0.02, 0.85, 0.91); // neon cyan
        paddleMaterial.diffuseColor = new BABYLON.Color3(0.02, 0.85, 0.91);
        paddleMaterial.specularColor = new BABYLON.Color3(1, 1, 1);
        paddleMaterial.specularPower = 128;
        this.leftPaddle.material = paddleMaterial;
        this.rightPaddle.material = paddleMaterial;
        glow.addIncludedOnlyMesh(this.leftPaddle);
        glow.addIncludedOnlyMesh(this.rightPaddle);

        this.leftPaddle.enableEdgesRendering();
        this.leftPaddle.edgesWidth = 6;
        this.leftPaddle.edgesColor = new BABYLON.Color4(0.02, 0.85, 0.91, 1);

        this.rightPaddle.enableEdgesRendering();
        this.rightPaddle.edgesWidth = 6;
        this.rightPaddle.edgesColor = new BABYLON.Color4(0.02, 0.85, 0.91, 1);

        // BALLE
        this.ball = BABYLON.MeshBuilder.CreateSphere("ball", { diameter: 1 }, scene);
        const ballMat = new BABYLON.StandardMaterial("ballMat", scene);
        ballMat.emissiveColor = new BABYLON.Color3(1, 0.16, 0.43); // neon pink
        ballMat.diffuseColor = new BABYLON.Color3(1, 0.16, 0.43);
        ballMat.specularColor = new BABYLON.Color3(1, 1, 1);
        ballMat.specularPower = 128;
        this.ball.material = ballMat;
        glow.addIncludedOnlyMesh(this.ball);

        // LIGNE CENTRALE
        for (let y = -10; y <= 10; y += 2) {
          const dot = BABYLON.MeshBuilder.CreateBox("dot", { width: 0.2, height: 0.75, depth: 1 }, scene);
          dot.enableEdgesRendering();
          dot.edgesWidth = 4;
          dot.edgesColor = new BABYLON.Color4(1, 0.16, 0.43, 1); // neon pink
          dot.position.set(0, y, 0);
          const dotMat = new BABYLON.StandardMaterial("dotMat", scene);
          dotMat.emissiveColor = new BABYLON.Color3(1, 0.16, 0.43);
          dot.material = dotMat;
          glow.addIncludedOnlyMesh(dot);
        }

        // SCORE & NOMS
        const gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

        this.scoreText1 = new GUI.TextBlock("score1", this.player1);
        this.scoreText1.color = "#05d9e8"; // neon cyan
        this.scoreText1.fontFamily = "Orbitron, 'Big Shoulders Display', sans-serif";
        this.scoreText1.fontSize = 32;
        this.scoreText1.top = "-40%";
        this.scoreText1.left = "-35%";
        this.scoreText1.shadowColor = "#ff2a6d";
        this.scoreText1.shadowBlur = 8;
        gui.addControl(this.scoreText1);

        this.scoreText2 = new GUI.TextBlock("score2", this.player2);
        this.scoreText2.color = "#ff2a6d"; // neon pink
        this.scoreText2.fontFamily = "Orbitron, 'Big Shoulders Display', sans-serif";
        this.scoreText2.fontSize = 32;
        this.scoreText2.top = "-40%";
        this.scoreText2.left = "35%";
        this.scoreText2.shadowColor = "#05d9e8";
        this.scoreText2.shadowBlur = 8;
        gui.addControl(this.scoreText2);

        const light = new BABYLON.HemisphericLight("dirLight", new BABYLON.Vector3(0, 1, 0), scene);
        light.intensity = 0.7;


        engine.runRenderLoop(() => {
          this.update(); // ← your game logic goes here
          scene.render();
        });
  }

  private setupInputListeners()
  {
    window.addEventListener('keydown', e => {
      switch (e.key) {
        case 'w':
            e.preventDefault();
          this.leftPaddleUp = true;
          break;
        case 's':
            e.preventDefault();
          this.leftPaddleDown = true;
          break;
        case 'ArrowUp':
            e.preventDefault();
          this.rightPaddleUp = true;
          break;
        case 'ArrowDown':
          this.rightPaddleDown = true;
          break;
      }
    });

    window.addEventListener('keyup', e => {
      switch (e.key) {
        case 'w':
            e.preventDefault();
          this.leftPaddleUp = false;
          this.leftPaddleUpFrames = 0; // reset
          break;
        case 's':
            e.preventDefault();
          this.leftPaddleDown = false;
          this.leftPaddleDownFrames = 0; // reset
          break;
        case 'ArrowUp':
                    e.preventDefault();
          this.rightPaddleUp = false;
          this.rightPaddleUpFrames = 0; // reset
          break;
        case 'ArrowDown':
                    e.preventDefault();
          this.rightPaddleDown = false;
          this.rightPaddleDownFrames = 0; // reset
          break;
      }
    });
  }

  // Ajout: expose propriétés pour IA
  get ballY() { return this._ballY; }
  get rightPaddleY() { return this._rightPaddleY; }
  get paddleHeight() { return this._paddleHeight; }
  set paddleSpeed(val: number) { this._paddleSpeed = val; }
  set rightPaddleUp(val: boolean) { this._rightPaddleUp = val; }
  set rightPaddleDown(val: boolean) { this._rightPaddleDown = val; }

private update() {
  // Limites pour la vitesse paddle
  const baseSpeed = this._paddleSpeed;
  const accel = 0.5;
  const maxPaddleSpeed = 16; // Limite max raisonnable

  let leftUpSpeed = Math.min(baseSpeed + this.leftPaddleUpFrames * accel, maxPaddleSpeed);
  let leftDownSpeed = Math.min(baseSpeed + this.leftPaddleDownFrames * accel, maxPaddleSpeed);
  let rightUpSpeed = Math.min(baseSpeed + this.rightPaddleUpFrames * accel, maxPaddleSpeed);
  let rightDownSpeed = Math.min(baseSpeed + this.rightPaddleDownFrames * accel, maxPaddleSpeed);

  // Move left paddle (in canvas coords)
  if (this.leftPaddleUp && !this.leftPaddleDown) {
    this.leftPaddleUpFrames++;
    this.leftPaddleY = Math.max(0, this.leftPaddleY - leftUpSpeed);
  } else {
    this.leftPaddleUpFrames = 0;
  }
  if (this.leftPaddleDown && !this.leftPaddleUp) {
    this.leftPaddleDownFrames++;
    this.leftPaddleY = Math.min(this.canvas.height - this._paddleHeight, this.leftPaddleY + leftDownSpeed);
  } else {
    this.leftPaddleDownFrames = 0;
  }

  // Move right paddle (in canvas coords)
  if (this._rightPaddleUp && !this._rightPaddleDown) {
    this.rightPaddleUpFrames++;
    this._rightPaddleY = Math.max(0, this._rightPaddleY - rightUpSpeed);
  } else {
    this.rightPaddleUpFrames = 0;
  }
  if (this._rightPaddleDown && !this._rightPaddleUp) {
    this.rightPaddleDownFrames++;
    this._rightPaddleY = Math.min(this.canvas.height - this._paddleHeight, this._rightPaddleY + rightDownSpeed);
  } else {
    this.rightPaddleDownFrames = 0;
  }

  // Accélération progressive de la balle
  this.ballSpeedMultiplier += this.ballSpeedIncrement;
  // Limite la vitesse max pour éviter l'injouable
  if (this.ballSpeedMultiplier > 2.5) this.ballSpeedMultiplier = 2.5;

  // Applique le multiplicateur de vitesse
  let speedX = this.ballSpeedX * this.ballSpeedMultiplier;
  let speedY = this.ballSpeedY * this.ballSpeedMultiplier;

  this.ballX += speedX;
  this._ballY += speedY;

  // Ball collision with top/bottom walls (canvas coords)
  if (this._ballY - this.ballRadius < 0) {
    this._ballY = this.ballRadius;
    this.ballSpeedY = Math.abs(this.ballSpeedY); // always down
  }
  if (this._ballY + this.ballRadius > this.canvas.height) {
    this._ballY = this.canvas.height - this.ballRadius;
    this.ballSpeedY = -Math.abs(this.ballSpeedY); // always up
  }

  // Constants for converting canvas to world coordinates
  const worldWidth = 30;
  const worldHeight = 20;

  // Convert ball to world coordinates
  const ballWorldX = (this.ballX / this.canvas.width) * worldWidth - worldWidth / 2;
  const ballWorldY = worldHeight / 2 - (this._ballY / this.canvas.height) * worldHeight;

  // Convert paddles to world Y positions
  const leftPaddleWorldY = worldHeight / 2 - (this.leftPaddleY / this.canvas.height) * worldHeight;
  const rightPaddleWorldY = worldHeight / 2 - (this._rightPaddleY / this.canvas.height) * worldHeight;

  // Paddle sizes in world coords (match your CreateBox)
  const paddleWidthWorld = 0.5;
  const paddleHeightWorld = 4;

  // Ball size in world coords
  const ballRadiusWorld = 0.5; // diameter=1, so radius=0.5

  // Calculate bounding boxes for collision

  // Ball bounds
  const ballLeft = ballWorldX - ballRadiusWorld;
  const ballRight = ballWorldX + ballRadiusWorld;
  const ballTop = ballWorldY + ballRadiusWorld;
  const ballBottom = ballWorldY - ballRadiusWorld;

  // Left paddle bounds
  const leftPaddleX = this.leftPaddle.position.x; // should be -12 as set in constructor
  const leftPaddleTop = leftPaddleWorldY + paddleHeightWorld / 2;
  const leftPaddleBottom = leftPaddleWorldY - paddleHeightWorld / 2;
  const leftPaddleRight = leftPaddleX + paddleWidthWorld / 2;
  const leftPaddleLeft = leftPaddleX - paddleWidthWorld / 2;

  // Right paddle bounds
  const rightPaddleX = this.rightPaddle.position.x; // should be 12
  const rightPaddleTop = rightPaddleWorldY + paddleHeightWorld / 2;
  const rightPaddleBottom = rightPaddleWorldY - paddleHeightWorld / 2;
  const rightPaddleRight = rightPaddleX + paddleWidthWorld / 2;
  const rightPaddleLeft = rightPaddleX - paddleWidthWorld / 2;

  // Check collision with left paddle
  const collidesLeft =
    ballRight > leftPaddleLeft &&
    ballLeft < leftPaddleRight &&
    ballBottom < leftPaddleTop &&
    ballTop > leftPaddleBottom;

  // Check collision with right paddle
  const collidesRight =
    ballRight > rightPaddleLeft &&
    ballLeft < rightPaddleRight &&
    ballBottom < rightPaddleTop &&
    ballTop > rightPaddleBottom;

  // Paddle influence: calcul de la vitesse du paddle
  let leftPaddleDelta = 0;
  let rightPaddleDelta = 0;
  if (this.prevLeftPaddleY !== undefined) {
    leftPaddleDelta = this.leftPaddleY - this.prevLeftPaddleY;
  }
  if (this.prevRightPaddleY !== undefined) {
    rightPaddleDelta = this._rightPaddleY - this.prevRightPaddleY;
  }

  // Limite l'angle de rebond pour éviter des vitesses verticales extrêmes
  const maxBallSpeedY = 7;

  if (collidesLeft) {
    this.ballSpeedX = Math.abs(this.ballSpeedX); // Toujours vers la droite
    this.ballSpeedY += leftPaddleDelta * 0.25;
    this.ballSpeedY = Math.max(Math.min(this.ballSpeedY, maxBallSpeedY), -maxBallSpeedY);
    this.ballSpeedMultiplier += 0.05;
    this.createHitParticles(this.ball.position);
  } else if (collidesRight) {
    this.ballSpeedX = -Math.abs(this.ballSpeedX); // Toujours vers la gauche
    this.ballSpeedY += rightPaddleDelta * 0.25;
    this.ballSpeedY = Math.max(Math.min(this.ballSpeedY, maxBallSpeedY), -maxBallSpeedY);
    this.ballSpeedMultiplier += 0.05;
    this.createHitParticles(this.ball.position);
  }

  // Ball goes off screen left/right in canvas coords
  if (this.ballX <= 0 || this.ballX >= this.canvas.width)
  {
    if (this.ballX <= 0) this.player2_score += 1;
    else this.player1_score += 1;

    // Reset la balle au centre et la vitesse
    this.ballX = this.canvas.width / 2;
    this._ballY = this.canvas.height / 2;
    this.ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 4;
    this.ballSpeedY = (Math.random() - 0.5) * 6;
    this.ballSpeedMultiplier = 1;
    this.createHitParticles(this.ball.position);
  }

  const paddleY = worldHeight / 2 - (this.leftPaddleY / this.canvas.height) * worldHeight;

  // interpolate camera position
  const damping = 0.1; // Lower = smoother
  this.cameraCurrentY += (paddleY - this.cameraCurrentY) * damping;

  const tiltAmount = (paddleY - this.cameraTargetY) * 0.03;
  this.cameraTilt += (tiltAmount - this.cameraTilt) * damping;

  this.camera.position.y = this.cameraCurrentY;
  this.camera.rotation.x = this.cameraTilt;

  this.cameraTargetY = paddleY;

  
  this.ball.position.x = ballWorldX;
  this.ball.position.y = ballWorldY;
  this.ball.position.z = 0;

  this.leftPaddle.position.y = leftPaddleWorldY;
  this.leftPaddle.position.z = 0;

  this.rightPaddle.position.y = rightPaddleWorldY;
  this.rightPaddle.position.z = 0;

  // Update scores display if needed
  this.scoreText1.text = `${this.player1}: ${this.player1_score}`;
  this.scoreText2.text = `${this.player2}: ${this.player2_score}`;

  // Sauvegarde la position précédente des paddles pour le prochain frame
  this.prevLeftPaddleY = this.leftPaddleY;
  this.prevRightPaddleY = this._rightPaddleY;
}


  render(): HTMLElement {
    return this.container;
  }

  destroy() {
    // Cleanup animation frame and event listeners if needed
    window.removeEventListener('keydown', this.setupInputListeners);
    window.removeEventListener('keyup', this.setupInputListeners);
  }
}

export default PongComponent;