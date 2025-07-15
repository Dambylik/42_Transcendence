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
  private socket: WebSocket | null = null;

  private camera!: BABYLON.FreeCamera;

  private container: HTMLElement;

  private _paddleHeight = 120;
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

  private isMultiplayer: boolean = false;
  private isPlayer1: boolean = true;
  private gameStarted: boolean = false;
  private lastPaddleUpdate: number = 0;
  private gameEnded: boolean = false;
  private winner: string = '';
  private maxScore: number = 5;
  private onGameEnd?: (winner: string) => void;

  // Event listener references for cleanup
  private keyDownHandler?: (e: KeyboardEvent) => void;
  private keyUpHandler?: (e: KeyboardEvent) => void;

  // private aiType?: string; // Ajout: type d'IA (si nécessaire)
  public setSocket(socket: WebSocket) {
      this.socket = socket;
      // Écoute les messages WebSocket
      this.socket.addEventListener('message', (event) => {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
      });
  }

  public handleWebSocketMessage(data: any) {
      switch (data.type) {
          case 'game_start':
              this.gameStarted = true;
              //console.log('Game started!');
              break;
          case 'paddle_update':
              if (this.isMultiplayer) {
                  //console.log(`Received paddle update: player=${data.player}, position=${data.position}, isPlayer1=${this.isPlayer1}`);
                  // Player1 always controls left paddle, Player2 always controls right paddle
                  if (data.player === 'player1') {
                      // This is a left paddle update - only update if we're not player1
                      if (!this.isPlayer1) {
                          //console.log(`Player2 updating left paddle (from player1): ${data.position}`);
                          this.leftPaddleY = data.position;
                      }
                  } else if (data.player === 'player2') {
                      // This is a right paddle update - only update if we're not player2
                      if (this.isPlayer1) {
                          //console.log(`Player1 updating right paddle (from player2): ${data.position}`);
                          this._rightPaddleY = data.position;
                      }
                  }
              }
              break;
          case 'ball_update':
              if (this.isMultiplayer) {
                  // Server has authority over ball position
                  this.ballX = data.ballX;
                  this._ballY = data.ballY;
                  this.ballSpeedX = data.ballSpeedX;
                  this.ballSpeedY = data.ballSpeedY;
              }
              break;
          case 'score_update':
              this.player1_score = data.player1Score;
              this.player2_score = data.player2Score;
              break;
          case 'game_end':
              // Handle game end
              break;
      }
  }

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

  public sendGameState(state: any) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          const message = { type: "pong_update", state };
          this.socket.send(JSON.stringify(message));
      }
  }

  private sendPaddleUpdate(position: number) {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
          const playerKey = this.isPlayer1 ? 'player1' : 'player2';
          const message = { 
              type: "paddle_update", 
              player: playerKey, 
              position: position 
          };
          //console.log(`Sending paddle update: player=${playerKey}, position=${position}`);
          this.socket.send(JSON.stringify(message));
      }
  }

  public onPlayerMove(position: number) {
      const state = { player: this.player1, position };
      this.sendGameState(state);
  }

  public updateGameState(state: any) {
      // Mettre à jour les positions des raquettes, la balle, le score, etc.
      console.log("Updating game state:", state);
      // Implémentez ici la logique pour synchroniser l'état du jeu
  }

  constructor(player1: string, player2: string, options?: { aiType?: string; socket?: WebSocket; isMultiplayer?: boolean; isPlayer1?: boolean; onGameEnd?: (winner: string) => void })
  {
        this.player1 = player1;
        this.player2 = player2;

        // Handle multiplayer options
        if (options?.isMultiplayer) {
          this.isMultiplayer = true;
          this.isPlayer1 = options.isPlayer1 ?? true; // Fix: use nullish coalescing instead of ||
          //console.log(`PongComponent initialized: isMultiplayer=${this.isMultiplayer}, isPlayer1=${this.isPlayer1}, options.isPlayer1=${options.isPlayer1}`);
        }

        if (options?.socket) {
          this.setSocket(options.socket);
        }

        if (options?.onGameEnd) {
          this.onGameEnd = options.onGameEnd;
        }

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
          this.update();
          scene.render();
        });
  }

  private setupInputListeners()
  {
    // Store references to event handlers for cleanup
    this.keyDownHandler = (e: KeyboardEvent) => {
      // Only block input if multiplayer and game hasn't started yet
      if (!this.gameStarted && this.isMultiplayer) return;
      
      switch (e.key) {
        case 'w':
        case 'W':
            e.preventDefault();
            // Player1 always controls left paddle with W/S
            if (!this.isMultiplayer || this.isPlayer1) {
              //console.log('Player1 pressing W - left paddle up');
              this.leftPaddleUp = true;
            }
            break;
        case 's':
        case 'S':
            e.preventDefault();
            // Player1 always controls left paddle with W/S
            if (!this.isMultiplayer || this.isPlayer1) {
              //console.log('Player1 pressing S - left paddle down');
              this.leftPaddleDown = true;
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            // Player2 always controls right paddle with arrows
            if (!this.isMultiplayer || !this.isPlayer1) {
              //console.log('Player2 pressing ArrowUp - right paddle up');
              this._rightPaddleUp = true;
            }
            break;
        case 'ArrowDown':
            e.preventDefault();
            // Player2 always controls right paddle with arrows
            if (!this.isMultiplayer || !this.isPlayer1) {
              //console.log('Player2 pressing ArrowDown - right paddle down');
              this._rightPaddleDown = true;
            }
            break;
      }
    };

    this.keyUpHandler = (e: KeyboardEvent) => {
      // Only block input if multiplayer and game hasn't started yet
      if (!this.gameStarted && this.isMultiplayer) return;
      
      switch (e.key) {
        case 'w':
        case 'W':
            e.preventDefault();
            if (!this.isMultiplayer || this.isPlayer1) {
              this.leftPaddleUp = false;
              this.leftPaddleUpFrames = 0;
            }
            break;
        case 's':
        case 'S':
            e.preventDefault();
            if (!this.isMultiplayer || this.isPlayer1) {
              this.leftPaddleDown = false;
              this.leftPaddleDownFrames = 0;
            }
            break;
        case 'ArrowUp':
            e.preventDefault();
            if (!this.isMultiplayer || !this.isPlayer1) {
              this._rightPaddleUp = false;
              this.rightPaddleUpFrames = 0;
            }
            break;
        case 'ArrowDown':
            e.preventDefault();
            if (!this.isMultiplayer || !this.isPlayer1) {
              this._rightPaddleDown = false;
              this.rightPaddleDownFrames = 0;
            }
            break;
      }
    };

    window.addEventListener('keydown', this.keyDownHandler);
    window.addEventListener('keyup', this.keyUpHandler);
  }

  // Ajout: expose propriétés pour IA
  get ballY() { return this._ballY; }
  get rightPaddleY() { return this._rightPaddleY; }
  get paddleHeight() { return this._paddleHeight; }
  set paddleSpeed(val: number) { this._paddleSpeed = val; }
  set rightPaddleUp(val: boolean) { this._rightPaddleUp = val; }
  set rightPaddleDown(val: boolean) { this._rightPaddleDown = val; }

private update() {
  if (this.isMultiplayer && !this.gameStarted) return;
  if (this.gameEnded)
      return;

  // Constants for converting canvas to world coordinates
  const worldWidth = 30;
  const worldHeight = 20;

  // Limites pour la vitesse paddle
  const baseSpeed = this._paddleSpeed;
  const accel = 0.5;
  const maxPaddleSpeed = 16;

  let leftUpSpeed = Math.min(baseSpeed + this.leftPaddleUpFrames * accel, maxPaddleSpeed);
  let leftDownSpeed = Math.min(baseSpeed + this.leftPaddleDownFrames * accel, maxPaddleSpeed);
  let rightUpSpeed = Math.min(baseSpeed + this.rightPaddleUpFrames * accel, maxPaddleSpeed);
  let rightDownSpeed = Math.min(baseSpeed + this.rightPaddleDownFrames * accel, maxPaddleSpeed);

  // Move left paddle - only update locally if we control it
  if (!this.isMultiplayer || this.isPlayer1) {
    if (this.leftPaddleUp && !this.leftPaddleDown) {
      this.leftPaddleUpFrames++;
      this.leftPaddleY = Math.max(-this._paddleHeight / 2, this.leftPaddleY - leftUpSpeed);
    } else {
      this.leftPaddleUpFrames = 0;
    }
    if (this.leftPaddleDown && !this.leftPaddleUp) {
      this.leftPaddleDownFrames++;
      this.leftPaddleY = Math.min(this.canvas.height - this._paddleHeight / 2, this.leftPaddleY + leftDownSpeed);
    } else {
      this.leftPaddleDownFrames = 0;
    }
  }

  // Move right paddle - only update locally if we control it
  if (!this.isMultiplayer || !this.isPlayer1) {
    if (this._rightPaddleUp && !this._rightPaddleDown) {
      this.rightPaddleUpFrames++;
      this._rightPaddleY = Math.max(-this._paddleHeight / 2, this._rightPaddleY - rightUpSpeed);
    } else {
      this.rightPaddleUpFrames = 0;
    }
    if (this._rightPaddleDown && !this._rightPaddleUp) {
      this.rightPaddleDownFrames++;
      this._rightPaddleY = Math.min(this.canvas.height - this._paddleHeight / 2, this._rightPaddleY + rightDownSpeed);
    } else {
      this.rightPaddleDownFrames = 0;
    }
  }

  // Only update ball physics if not multiplayer (server handles it)
  if (!this.isMultiplayer) {
    // Accélération progressive de la balle
    this.ballSpeedMultiplier += this.ballSpeedIncrement;
    if (this.ballSpeedMultiplier > 2.5) this.ballSpeedMultiplier = 2.5;

    let speedX = this.ballSpeedX * this.ballSpeedMultiplier;
    let speedY = this.ballSpeedY * this.ballSpeedMultiplier;

    this.ballX += speedX;
    this._ballY += speedY;

    // Ball collision with top/bottom walls
    if (this._ballY - this.ballRadius < 0) {
      this._ballY = this.ballRadius;
      this.ballSpeedY = Math.abs(this.ballSpeedY);
    }
    if (this._ballY + this.ballRadius > this.canvas.height) {
      this._ballY = this.canvas.height - this.ballRadius;
      this.ballSpeedY = -Math.abs(this.ballSpeedY);
    }

    // Convert ball to world coordinates
    const ballWorldX = (this.ballX / this.canvas.width) * worldWidth - worldWidth / 2;
    const ballWorldY = worldHeight / 2 - (this._ballY / this.canvas.height) * worldHeight;

    // Convert paddles to world Y positions
    const leftPaddleCenterY = this.leftPaddleY + this._paddleHeight / 2;
    const rightPaddleCenterY = this._rightPaddleY + this._paddleHeight / 2;
    const leftPaddleWorldY = worldHeight / 2 - (leftPaddleCenterY / this.canvas.height) * worldHeight;
    const rightPaddleWorldY = worldHeight / 2 - (rightPaddleCenterY / this.canvas.height) * worldHeight;

    // Paddle sizes in world coords (match your CreateBox)
    const paddleWidthWorld = 0.5;
    const paddleHeightWorld = 4;

    // Ball size in world coords
    const ballRadiusWorld = 0.5; // diameter=1, so radius=0.5

    // Calculate bounding boxes for collision
    const ballLeft = ballWorldX - ballRadiusWorld;
    const ballRight = ballWorldX + ballRadiusWorld;
    const ballTop = ballWorldY + ballRadiusWorld;
    const ballBottom = ballWorldY - ballRadiusWorld;

    // Left paddle bounds
    const leftPaddleX = this.leftPaddle.position.x;
    const leftPaddleTop = leftPaddleWorldY + paddleHeightWorld / 2;
    const leftPaddleBottom = leftPaddleWorldY - paddleHeightWorld / 2;
    const leftPaddleRight = leftPaddleX + paddleWidthWorld / 2;
    const leftPaddleLeft = leftPaddleX - paddleWidthWorld / 2;

    // Right paddle bounds
    const rightPaddleX = this.rightPaddle.position.x;
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
      this.ballSpeedX = Math.abs(this.ballSpeedX);
      this.ballSpeedY += leftPaddleDelta * 0.25;
      this.ballSpeedY = Math.max(Math.min(this.ballSpeedY, maxBallSpeedY), -maxBallSpeedY);
      this.ballSpeedMultiplier += 0.05;
      this.createHitParticles(this.ball.position);
    } else if (collidesRight) {
      this.ballSpeedX = -Math.abs(this.ballSpeedX);
      this.ballSpeedY += rightPaddleDelta * 0.25;
      this.ballSpeedY = Math.max(Math.min(this.ballSpeedY, maxBallSpeedY), -maxBallSpeedY);
      this.ballSpeedMultiplier += 0.05;
      this.createHitParticles(this.ball.position);
    }

    // Ball goes off screen left/right
    if (this.ballX <= 0 || this.ballX >= this.canvas.width) {
      if (this.ballX <= 0) this.player2_score += 1;
      else this.player1_score += 1;

      if (this.player1_score >= this.maxScore) {
        this.winner = this.player1;
        this.gameEnded = true;
        if (this.onGameEnd) {
          this.onGameEnd(this.winner);
        }
        return;
      } else if (this.player2_score >= this.maxScore) {
        this.winner = this.player2;
        this.gameEnded = true;
        if (this.onGameEnd) {
          this.onGameEnd(this.winner);
        }
        return;
      }

      this.ballX = this.canvas.width / 2;
      this._ballY = this.canvas.height / 2;
      this.ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 4;
      this.ballSpeedY = (Math.random() - 0.5) * 6;
      this.ballSpeedMultiplier = 1;
      this.createHitParticles(this.ball.position);
    }
  }

  // Convert coordinates for rendering (always needed)
  const ballWorldX = (this.ballX / this.canvas.width) * worldWidth - worldWidth / 2;
  const ballWorldY = worldHeight / 2 - (this._ballY / this.canvas.height) * worldHeight;
  
  const leftPaddleCenterY = this.leftPaddleY + this._paddleHeight / 2;
  const rightPaddleCenterY = this._rightPaddleY + this._paddleHeight / 2;
  const leftPaddleWorldY = worldHeight / 2 - (leftPaddleCenterY / this.canvas.height) * worldHeight;
  const rightPaddleWorldY = worldHeight / 2 - (rightPaddleCenterY / this.canvas.height) * worldHeight;

  // Keep camera static at center position
  this.camera.position.y = 0;
  this.camera.rotation.x = 0;

  // Update 3D positions
  this.ball.position.x = ballWorldX;
  this.ball.position.y = ballWorldY;
  this.ball.position.z = 0;

  this.leftPaddle.position.y = leftPaddleWorldY;
  this.leftPaddle.position.z = 0;

  this.rightPaddle.position.y = rightPaddleWorldY;
  this.rightPaddle.position.z = 0;

  // Update scores display
  this.scoreText1.text = `${this.player1}: ${this.player1_score}`;
  this.scoreText2.text = `${this.player2}: ${this.player2_score}`;

  // Sauvegarde la position précédente des paddles pour le prochain frame
  this.prevLeftPaddleY = this.leftPaddleY;
  this.prevRightPaddleY = this._rightPaddleY;

  // Send paddle updates for multiplayer (throttled) - send actual paddle position
  if (this.isMultiplayer && this.gameStarted) {
    const now = Date.now();
    if (!this.lastPaddleUpdate || now - this.lastPaddleUpdate > 16) {
      if (this.isPlayer1) {
        //console.log(`Player1 sending left paddle update: ${this.leftPaddleY}`);
        this.sendPaddleUpdate(this.leftPaddleY);
      } else {
        //console.log(`Player2 sending right paddle update: ${this._rightPaddleY}`);
        this.sendPaddleUpdate(this._rightPaddleY);
      }
      this.lastPaddleUpdate = now;
    }
  }
}

  render(): HTMLElement {
    return this.container;
  }

  destroy() {
    // Cleanup event listeners
    if (this.keyDownHandler) {
      window.removeEventListener('keydown', this.keyDownHandler);
    }
    if (this.keyUpHandler) {
      window.removeEventListener('keyup', this.keyUpHandler);
    }
    
    // Clean up references
    this.keyDownHandler = undefined;
    this.keyUpHandler = undefined;
    
    // Cleanup socket if exists
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }
}

export default PongComponent;