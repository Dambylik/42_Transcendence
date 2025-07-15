import * as BABYLON from 'babylonjs';
import * as GUI from 'babylonjs-gui';
import { showNotification } from '../../../utils/notifications';
import { createAnimatedContainer } from '../../components/pong/pongUtils';
// Overlay loading spinner helpers (local, scoped to this component)

function showLoadingOverlay(container: HTMLElement) {
  // Remove any existing overlay
  hideLoadingOverlay(container);
  const overlay = document.createElement('div');
  overlay.className = `fixed left-0 top-0 w-screen h-screen flex items-center justify-center z-[9999] bg-black/70 pointer-events-auto`;
  overlay.style.backdropFilter = 'blur(2px)';
  overlay.style.transition = 'opacity 0.3s';
  overlay.id = 'connect4-loading-overlay';

  // Neon spinner with glow and shadow
  const spinner = document.createElement('div');
  spinner.className = 'flex flex-col items-center';
  spinner.innerHTML = `
    <div class="relative flex items-center justify-center">
      <svg class="animate-spin drop-shadow-neon-cyan" style="animation-duration:1.2s;" width="110" height="110" viewBox="0 0 110 110">
        <defs>
          <radialGradient id="neonGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#00fff7" stop-opacity="0.7"/>
            <stop offset="100%" stop-color="#00fff7" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <circle cx="55" cy="55" r="44" stroke="#00fff7" stroke-width="8" fill="none" opacity="0.18"/>
        <circle cx="55" cy="55" r="44" stroke="#00fff7" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="70 200" filter="url(#glow)"/>
        <circle cx="55" cy="55" r="44" fill="url(#neonGlow)"/>
      </svg>
      <div class="absolute w-[140px] h-[140px] rounded-full pointer-events-none" style="box-shadow:0 0 60px 20px #00fff7,0 0 120px 40px #00fff7AA;"></div>
    </div>
    <div class="mt-8 text-neon-cyan font-cyber text-3xl animate-glow-pulse drop-shadow-neon-cyan text-center select-none">
      Building the Connect4 board...
    </div>
  `;
  overlay.appendChild(spinner);

  // Centralise overlay in viewport (not just relative to container)
  document.body.appendChild(overlay);
}

function hideLoadingOverlay(container: HTMLElement) {
  const overlay = document.getElementById('connect4-loading-overlay');
  if (overlay) overlay.remove();
}

class Connect4Component {
  private multiplayerCallbacks: { onMove?: (column: number) => void } = {};
  // Permet d'utiliser le composant en mode online (callback pour le front)
  public setMultiplayerCallbacks(callbacks: { onMove?: (column: number) => void }) {
    this.multiplayerCallbacks = callbacks;
  }

  // Permet de mettre à jour l'état du plateau depuis le serveur (mode online)
  public updateGameState(board: number[][], currentPlayer: number) {
    this.board = board.map(row => [...row]);
    this.currentPlayer = currentPlayer;
    this.gameEnded = false;
    // Redessine le plateau
    this.refreshBoardDisplay();
  }

  // Redessine le plateau (simple, pour le mode online)
  private refreshBoardDisplay() {
    // Supprime tous les disques
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        if (this.discs[row][col]) {
          this.discs[row][col]?.dispose();
          this.discs[row][col] = null;
        }
      }
    }
    // Ajoute les disques selon l'état du board
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        if (this.board[row][col] === this.PLAYER1 || this.board[row][col] === this.PLAYER2) {
          this.createDiscAt(row, col, this.board[row][col]);
        }
      }
    }
  }

  // Ajoute un disque à une position précise (pour le redraw online)
  private createDiscAt(row: number, col: number, player: number) {
    // Crée un disque à la position demandée, avec animation de gravité comme en local
    const disc = BABYLON.MeshBuilder.CreateCylinder(`disc_${row}_${col}_${player}_${Date.now()}`, {
      diameter: 1.0, // Match hole diameter exactly like in local
      height: 0.3,
      tessellation: 32
    }, this.scene);
    
    // Rotate disc to stand upright (90 degrees on X axis) - COMME EN LOCAL
    disc.rotation.x = Math.PI / 2;
    
    // Set material like in local mode
    const discMaterial = new BABYLON.StandardMaterial(`discMaterial_${row}_${col}_${player}`, this.scene);
    if (player === this.PLAYER1) {
      // Red player with glow
      discMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
      discMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.0, 0.0);
      discMaterial.specularColor = new BABYLON.Color3(0.5, 0.1, 0.1);
    } else {
      // Blue player (néon) like in local
      discMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.5, 1.0);
      discMaterial.emissiveColor = new BABYLON.Color3(0.0, 0.3, 1.0);
      discMaterial.specularColor = new BABYLON.Color3(0.2, 0.7, 1.0);
    }
    disc.material = discMaterial;

    // SYSTÈME DE GRAVITÉ - Animation de chute comme en local
    const startY = this.ROWS * 1.2 + 3; // Start above the board
    const endY = ((this.ROWS - 1) - row) * 1.2; // Convert to Babylon coordinate system

    disc.position = new BABYLON.Vector3(col * 1.2, startY, 0);

    // Animation de chute avec rebond
    const animationDisc = new BABYLON.Animation(
      "discFall",
      "position.y",
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [];
    keys.push({ frame: 0, value: startY });
    keys.push({ frame: 30, value: endY });
    animationDisc.setKeys(keys);

    // Add easing for more realistic fall
    const easingFunction = new BABYLON.BounceEase();
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
    animationDisc.setEasingFunction(easingFunction);

    disc.animations = [animationDisc];

    this.scene.beginAnimation(disc, 0, 30, false, 1, () => {
      // Ensure disc is perfectly aligned
      disc.position.x = col * 1.2;
      disc.position.y = endY;
      disc.position.z = 0;
      
      // Pas de vérification de victoire ici car c'est géré par le serveur en mode online
    });

    this.discs[row][col] = disc;
  }
  private canvas: HTMLCanvasElement;
  private engine: BABYLON.Engine;
  private scene: BABYLON.Scene;
  private camera!: BABYLON.ArcRotateCamera;
  private container: HTMLElement;
  private gui!: GUI.AdvancedDynamicTexture;

  // Game state
  private readonly ROWS = 6;
  private readonly COLS = 7;
  private readonly EMPTY = 0;
  private readonly PLAYER1 = 1; // Red
  private readonly PLAYER2 = 2; // Yellow

  private board: number[][];
  private discs: (BABYLON.Mesh | null)[][];
  private columnDetectors: BABYLON.Mesh[] = [];
  public currentPlayer = this.PLAYER1; // Public pour l'accès externe en mode online
  private gameEnded = false;

  // Player info
  private player1Name: string;
  private player2Name: string;
  private currentPlayerText!: GUI.TextBlock;
  private gameStatusText!: GUI.TextBlock;
  private onGameEnd?: (winner: string) => void;

  // Winner

  // Animation
  private isAnimating = false;
  
  // Game mode
  private isTournamentMode = false;

  // AI properties
  private aiType?: string;
  private isAiGame = false;
  private aiMoveTimeout?: number;
  private transpositionTable = new Map<string, { score: number; depth: number; bestMove: number }>(); // For nightmare mode

  constructor(player1: string, player2: string, options?: { aiType?: string; onGameEnd?: (winner: string) => void; isTournamentMode?: boolean }) {
    this.player1Name = player1;
    this.player2Name = player2;
    this.onGameEnd = options?.onGameEnd;
    this.isTournamentMode = options?.isTournamentMode || false;

    // Setup AI if specified
    if (options?.aiType) {
      this.aiType = options.aiType;
      this.isAiGame = true;
      console.log('AI game configured with type:', this.aiType);
    } else {
      console.log('No AI configured, human vs human game');
    }

    // Initialize game board
    this.board = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(this.EMPTY));
    this.discs = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(null));

    // Create container and canvas
    this.container = document.createElement('div');
    this.container.className = 'connect4-container relative';
    this.container.style.width = '800px';
    this.container.style.height = '600px';

    this.canvas = document.createElement('canvas');
    this.canvas.width = 800;
    this.canvas.height = 600;
    this.canvas.className = 'rounded-lg shadow-lg';
    this.container.appendChild(this.canvas);

    // Show loading overlay while building the board
    showLoadingOverlay(this.container);

    // Initialize Babylon.js
    this.engine = new BABYLON.Engine(this.canvas, true);
    this.scene = new BABYLON.Scene(this.engine);

    this.setupScene();
    // Build the board asynchronously to allow the overlay to render
    setTimeout(() => {
      this.createBoard();
      this.setupGUI();
      this.setupClickHandlers();
      hideLoadingOverlay(this.container);
      this.startRenderLoop();
      // Initialize game state and trigger AI move if needed
      this.initializeGame();
    }, 50);
  }

  private setupScene(): void {
    // Camera setup with ArcRotateCamera for better 3D view
    this.camera = new BABYLON.ArcRotateCamera(
      "camera", 
      Math.PI / 2, 
      Math.PI / 3, 
      25, // Adjusted distance for new board size
      new BABYLON.Vector3((this.COLS - 1) * 1.2 / 2, (this.ROWS - 1) * 1.2 / 2, 0), 
      this.scene
    );
    this.camera.attachControl(this.canvas, true);
    this.camera.setTarget(new BABYLON.Vector3((this.COLS - 1) * 1.2 / 2, (this.ROWS - 1) * 1.2 / 2, 0));

    // Prevent wheel events from bubbling up to prevent page scroll
    this.canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      event.stopPropagation();
    }, { passive: false });

    // Try to enable physics, fallback to no physics if plugin not available
    try {
      this.scene.enablePhysics(new BABYLON.Vector3(0, -9.81, 0), new BABYLON.CannonJSPlugin());
    } catch (error) {
      console.warn("Physics engine not available, using animation fallback");
    }

    // Enhanced lighting for neon effect
    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), this.scene);
    light.intensity = 0.4; // Reduced for darker atmosphere

    const directionalLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-1, -1, 1), this.scene);
    directionalLight.position = new BABYLON.Vector3(10, 10, -10);
    directionalLight.intensity = 0.3; // Reduced for darker atmosphere

    // Add cyan point lights to enhance neon effect - updated positions
    const neonLight1 = new BABYLON.PointLight("neonLight1", new BABYLON.Vector3(-2, this.ROWS * 1.2 + 2, 3), this.scene);
    neonLight1.diffuse = new BABYLON.Color3(0, 1, 1);
    neonLight1.intensity = 0.8;

    const neonLight2 = new BABYLON.PointLight("neonLight2", new BABYLON.Vector3(this.COLS * 1.2 + 2, -2, 3), this.scene);
    neonLight2.diffuse = new BABYLON.Color3(0, 1, 1);
    neonLight2.intensity = 0.8;

    // Dark background for better neon effect
    this.scene.clearColor = new BABYLON.Color4(0.05, 0.05, 0.1, 1);
  }

  private createBoard(): void {
    // Create the main board with holes
    this.createConnect4Board();

    // Add NEON lights around the board
    this.createNeonLights();

    // Create invisible column detectors for clicking
    for (let col = 0; col < this.COLS; col++) {
      const detector = BABYLON.MeshBuilder.CreateBox(`detector_${col}`, {
        width: 1.2,
        height: this.ROWS * 1.2 + 2,
        depth: 1
      }, this.scene);
      
      detector.position = new BABYLON.Vector3(col * 1.2, (this.ROWS - 1) * 1.2 / 2, 0);
      detector.visibility = 0; // Make invisible but still clickable
      detector.metadata = { column: col };
      this.columnDetectors.push(detector);
    }
  }

  private createConnect4Board(): void {
    // Realistic board using CSG to carve holes
    const boardDepth = 0.8;
    const boardWidth = (this.COLS - 1) * 1.2 + 2;
    const boardHeight = (this.ROWS - 1) * 1.2 + 1.4;
    // Material and hole size (NEON style)
    const boardMat = new BABYLON.StandardMaterial("boardMat", this.scene);
    boardMat.diffuseColor = new BABYLON.Color3(0.05, 0.08, 0.18); // Bleu nuit
    boardMat.specularColor = new BABYLON.Color3(0.2, 0.8, 1.0); // Reflet bleu néon
    boardMat.emissiveColor = new BABYLON.Color3(0.0, 0.2, 0.5); // Glow bleu
    boardMat.alpha = 0.98;
    boardMat.reflectionFresnelParameters = new BABYLON.FresnelParameters();
    boardMat.reflectionFresnelParameters.bias = 0.2;
    boardMat.reflectionFresnelParameters.power = 2;
    const holeDiameter = 1.1;

    // Base box
    const baseBox = BABYLON.MeshBuilder.CreateBox("baseBoardCSG", {
      width: boardWidth,
      height: boardHeight,
      depth: boardDepth
    }, this.scene);
    // Center base for CSG
    baseBox.position = BABYLON.Vector3.Zero();

    // Convert to CSG
    let boardCSG = BABYLON.CSG.FromMesh(baseBox);
    baseBox.dispose();

    // 1. Trous visibles à chaque case (effet visuel classique)
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        const x = (col * 1.2) - (boardWidth / 2) + 1;
        const y = ((this.ROWS - 1 - row) * 1.2) - (boardHeight / 2) + 0.7;
        const hole = BABYLON.MeshBuilder.CreateCylinder(`csgHole_${row}_${col}`, {
          diameter: holeDiameter,
          height: boardDepth + 0.2
        }, this.scene);
        hole.rotation.x = Math.PI / 2;
        hole.position = new BABYLON.Vector3(x, y, 0);
        const holeCSG = BABYLON.CSG.FromMesh(hole);
        boardCSG = boardCSG.subtract(holeCSG);
        hole.dispose();
      }
    }


    // Create final mesh and apply material
    const finalBoard = boardCSG.toMesh("finalBoard", null, this.scene);
    finalBoard.material = boardMat;
    finalBoard.position = new BABYLON.Vector3((this.COLS - 1) * 1.2 / 2, (this.ROWS - 1) * 1.2 / 2, 0);
  }

  private createNeonLights(): void {
    // Create enhanced neon tubes around the board
    const neonMaterial = new BABYLON.StandardMaterial("neonMaterial", this.scene);
    neonMaterial.diffuseColor = new BABYLON.Color3(0, 1, 1); // Cyan
    neonMaterial.emissiveColor = new BABYLON.Color3(0, 2, 2); // Glow cyan fort
    neonMaterial.specularColor = new BABYLON.Color3(0.5, 1, 1);
    neonMaterial.alpha = 0.95;
    neonMaterial.reflectionFresnelParameters = new BABYLON.FresnelParameters();
    neonMaterial.reflectionFresnelParameters.bias = 0.4;
    neonMaterial.reflectionFresnelParameters.power = 3;
    neonMaterial.emissiveFresnelParameters = new BABYLON.FresnelParameters();
    neonMaterial.emissiveFresnelParameters.bias = 0.6;
    neonMaterial.emissiveFresnelParameters.power = 2;

    // Récupère les dimensions du plateau pour positionner le néon
    const boardDepth = 0.8;
    const boardWidth = (this.COLS - 1) * 1.2;
    const boardHeight = (this.ROWS - 1) * 1.2;

    // Positionnement précis pour encadrer le plateau
    const offset = 1.0 + (boardDepth / 2); // Décalage augmenté pour sortir le néon
    // Top neon
    const topNeon = BABYLON.MeshBuilder.CreateCylinder("topNeon", {
      height: boardWidth + 1.2,
      diameter: 0.22
    }, this.scene);
    topNeon.rotation.z = Math.PI / 2;
    topNeon.position = new BABYLON.Vector3(boardWidth / 2, boardHeight / 2 + boardHeight / 2 + offset, 0);
    topNeon.material = neonMaterial;

    // Bottom neon
    const bottomNeon = BABYLON.MeshBuilder.CreateCylinder("bottomNeon", {
      height: boardWidth + 1.2,
      diameter: 0.22
    }, this.scene);
    bottomNeon.rotation.z = Math.PI / 2;
    bottomNeon.position = new BABYLON.Vector3(boardWidth / 2, -offset, 0);
    bottomNeon.material = neonMaterial;

    // Left neon
    const leftNeon = BABYLON.MeshBuilder.CreateCylinder("leftNeon", {
      height: boardHeight + 1.2,
      diameter: 0.22
    }, this.scene);
    leftNeon.position = new BABYLON.Vector3(-offset, boardHeight / 2, 0);
    leftNeon.material = neonMaterial;

    // Right neon
    const rightNeon = BABYLON.MeshBuilder.CreateCylinder("rightNeon", {
      height: boardHeight + 1.2,
      diameter: 0.22
    }, this.scene);
    rightNeon.position = new BABYLON.Vector3(boardWidth + offset, boardHeight / 2, 0);
    rightNeon.material = neonMaterial;

    // Corner neons (gros halo, parfaitement aux coins)
    const corners = [
      [-offset, boardHeight + offset, 0], // Top-left
      [boardWidth + offset, boardHeight + offset, 0], // Top-right
      [-offset, -offset, 0], // Bottom-left
      [boardWidth + offset, -offset, 0] // Bottom-right
    ];

    corners.forEach((pos, index) => {
      const cornerNeon = BABYLON.MeshBuilder.CreateSphere(`cornerNeon_${index}`, {
        diameter: 0.5
      }, this.scene);
      cornerNeon.position = new BABYLON.Vector3(pos[0], pos[1], pos[2]);
      cornerNeon.material = neonMaterial;
    });

    // Add pulsing and color cycling animation (plus flashy)
    const neonAnimation = new BABYLON.Animation(
      "neonPulse",
      "material.emissiveColor",
      30,
      BABYLON.Animation.ANIMATIONTYPE_COLOR3,
      BABYLON.Animation.ANIMATIONLOOPMODE_CYCLE
    );

    const neonKeys = [];
    neonKeys.push({ frame: 0, value: new BABYLON.Color3(0, 1.5, 2) });
    neonKeys.push({ frame: 15, value: new BABYLON.Color3(0, 2, 1.2) });
    neonKeys.push({ frame: 30, value: new BABYLON.Color3(0, 1.5, 2) });
    neonAnimation.setKeys(neonKeys);

    [topNeon, bottomNeon, leftNeon, rightNeon].forEach(neon => {
      neon.animations = [neonAnimation];
      this.scene.beginAnimation(neon, 0, 30, true);
    });
  }

  private setupGUI(): void {
    this.gui = GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    // Current player text
    this.currentPlayerText = new GUI.TextBlock();
    this.currentPlayerText.text = `${this.player1Name}'s Turn`;
    this.currentPlayerText.color = "#ff4466";
    this.currentPlayerText.fontSize = 24;
    this.currentPlayerText.fontFamily = "Arial";
    this.currentPlayerText.top = "-250px";
    this.currentPlayerText.height = "30px";
    this.gui.addControl(this.currentPlayerText);

    // Game status text
    this.gameStatusText = new GUI.TextBlock();
    this.gameStatusText.text = "Click on a column to drop your disc!";
    this.gameStatusText.color = "#ffffff";
    this.gameStatusText.fontSize = 18;
    this.gameStatusText.fontFamily = "Arial";
    this.gameStatusText.top = "-220px";
    this.gameStatusText.height = "25px";
    this.gui.addControl(this.gameStatusText);
  }

  private setupClickHandlers(): void {
    this.scene.onPointerObservable.add((pointerInfo) => {
      if (pointerInfo.pickInfo?.hit && !this.isAnimating && !this.gameEnded) {
        const pickedMesh = pointerInfo.pickInfo.pickedMesh;
        if (pickedMesh && pickedMesh.metadata?.column !== undefined) {
          // Prevent human clicks during AI turn
          if (this.isAiGame && this.currentPlayer === this.PLAYER2) return;
          const column = pickedMesh.metadata.column;
          // Si on est en mode online, on délègue au callback
          if (this.multiplayerCallbacks.onMove) {
            this.multiplayerCallbacks.onMove(column);
          } else {
            this.dropDisc(column);
          }
        }
      }
    });
  }

  private dropDisc(column: number): void {
    if (this.gameEnded || this.isAnimating) return;

    // Find the lowest empty row in this column (bottom = ROWS-1, top = 0)
    let targetRow = -1;
    for (let r = this.ROWS - 1; r >= 0; r--) {
      if (this.board[r][column] === this.EMPTY) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) {
      showNotification("Column is full!", "error");
      return; // Column is full
    }

    this.isAnimating = true;

    // Update board state
    this.board[targetRow][column] = this.currentPlayer;

    // Create disc mesh - Align with holes
    const disc = BABYLON.MeshBuilder.CreateCylinder(`disc_${targetRow}_${column}`, {
      diameter: 1.0, // Match hole diameter exactly
      height: 0.3,
      tessellation: 32
    }, this.scene);

    // Rotate disc to stand upright (90 degrees on X axis)
    disc.rotation.x = Math.PI / 2;

    // Set disc material based on current player (bleu néon pour joueur 2)
    const discMaterial = new BABYLON.StandardMaterial(`discMaterial_${targetRow}_${column}`, this.scene);
    if (this.currentPlayer === this.PLAYER1) {
      // Red player with glow
      discMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2); // Red
      discMaterial.emissiveColor = new BABYLON.Color3(0.3, 0.0, 0.0);
      discMaterial.specularColor = new BABYLON.Color3(0.5, 0.1, 0.1);
    } else {
      // Blue player (néon)
      discMaterial.diffuseColor = new BABYLON.Color3(0.1, 0.5, 1.0); // Bleu vif
      discMaterial.emissiveColor = new BABYLON.Color3(0.0, 0.3, 1.0); // Glow bleu
      discMaterial.specularColor = new BABYLON.Color3(0.2, 0.7, 1.0);
    }
    disc.material = discMaterial;

    // Start disc at the TOP (high Y value) and animate it falling to the BOTTOM (low Y value)
    const startY = this.ROWS * 1.2 + 3; // Start above the board
    const endY = ((this.ROWS - 1) - targetRow) * 1.2; // Convert to Babylon coordinate system with new spacing

    disc.position = new BABYLON.Vector3(column * 1.2, startY, 0);

    // Fallback to animation if physics not available
    const animationDisc = new BABYLON.Animation(
      "discFall",
      "position.y",
      30,
      BABYLON.Animation.ANIMATIONTYPE_FLOAT,
      BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
    );

    const keys = [];
    keys.push({ frame: 0, value: startY });
    keys.push({ frame: 30, value: endY });
    animationDisc.setKeys(keys);

    // Add easing for more realistic fall
    const easingFunction = new BABYLON.BounceEase();
    easingFunction.setEasingMode(BABYLON.EasingFunction.EASINGMODE_EASEOUT);
    animationDisc.setEasingFunction(easingFunction);

    disc.animations = [animationDisc];

    this.scene.beginAnimation(disc, 0, 30, false, 1, () => {
      // Ensure disc is perfectly aligned with the ring
      disc.position.x = column * 1.2;
      disc.position.y = endY;
      disc.position.z = 0; // Ensure Z alignment

      this.discs[targetRow][column] = disc;
      
      // Attendre un peu pour que le joueur voie bien le disque tomber et se stabiliser
      setTimeout(() => {
        this.checkGameState(targetRow, column);
      }, 500); // Délai de 500ms après la fin de l'animation
    });
  }

  // Méthode optimisée pour ajouter un seul disque (mode online)
  public addSingleDisc(row: number, col: number, player: number) {
    // Vérifie qu'il n'y a pas déjà un disque à cette position
    if (this.discs[row] && this.discs[row][col]) {
      return; // Un disque existe déjà
    }
    
    // Met à jour le board state
    this.board[row][col] = player;
    
    // Crée le disque avec animation de gravité
    this.createDiscAt(row, col, player);
    
    // Met à jour l'interface (le currentPlayer est géré par le serveur)
    this.updateUI();
  }

  private checkGameState(row: number, column: number): void {
    this.isAnimating = false;
    
    // Check for win
    if (this.checkWin(row, column)) {
      this.endGame(this.currentPlayer === this.PLAYER1 ? this.player1Name : this.player2Name);
    } else if (this.isBoardFull()) {
      this.endGame("Draw");
    } else {
      // Switch players
      this.currentPlayer = this.currentPlayer === this.PLAYER1 ? this.PLAYER2 : this.PLAYER1;
      this.updateUI();
      
      console.log('Switched to player:', this.currentPlayer, 'isAiGame:', this.isAiGame);
      // If it's AI's turn, make AI move
      if (this.isAiGame && this.currentPlayer === this.PLAYER2) {
        console.log('AI turn detected, making move...');
        this.makeAiMove();
      }
    }
  }

  private checkWin(row: number, col: number): boolean {
    const player = this.board[row][col];
    
    // Check horizontal
    let count = 1;
    // Check left
    for (let c = col - 1; c >= 0 && this.board[row][c] === player; c--) count++;
    // Check right
    for (let c = col + 1; c < this.COLS && this.board[row][c] === player; c++) count++;
    if (count >= 4) return true;

    // Check vertical
    count = 1;
    // Check down
    for (let r = row + 1; r < this.ROWS && this.board[r][col] === player; r++) count++;
    if (count >= 4) return true;

    // Check diagonal (top-left to bottom-right)
    count = 1;
    // Check up-left
    for (let r = row - 1, c = col - 1; r >= 0 && c >= 0 && this.board[r][c] === player; r--, c--) count++;
    // Check down-right
    for (let r = row + 1, c = col + 1; r < this.ROWS && c < this.COLS && this.board[r][c] === player; r++, c++) count++;
    if (count >= 4) return true;

    // Check diagonal (top-right to bottom-left)
    count = 1;
    // Check up-right
    for (let r = row - 1, c = col + 1; r >= 0 && c < this.COLS && this.board[r][c] === player; r--, c++) count++;
    // Check down-left
    for (let r = row + 1, c = col - 1; r < this.ROWS && c >= 0 && this.board[r][c] === player; r++, c--) count++;
    if (count >= 4) return true;

    return false;
  }

  private isBoardFull(): boolean {
    for (let col = 0; col < this.COLS; col++) {
      if (this.board[0][col] === this.EMPTY) {
        return false;
      }
    }
    return true;
  }

  private updateUI(): void {
    if (this.currentPlayer === this.PLAYER1) {
      this.currentPlayerText.text = `${this.player1Name}'s Turn`;
      this.currentPlayerText.color = "#ff4466";
    } else {
      this.currentPlayerText.text = `${this.player2Name}'s Turn`;
      this.currentPlayerText.color = "#ffcc00"; // Yellow color for classic Connect 4
    }
  }

  private endGame(winner: string): void {
    this.gameEnded = true;

    // Show tournament complete page instead of simple popup
    if (this.isTournamentMode) {
      this.showTournamentComplete(winner);
    } else {
      this.showNormalGameEnd(winner);
    }

    if (this.onGameEnd) {
      this.onGameEnd(winner);
    }
  }

  // Show tournament complete page (similar to pong tournament)
  private showTournamentComplete(winner: string): void {
    // Hide the game container
    const gameContainer = this.container.querySelector('.connect4-container');
    if (gameContainer) {
      (gameContainer as HTMLElement).style.display = 'none';
    }

    // Create tournament complete page
    const tournamentDiv = createAnimatedContainer('flex flex-col items-center justify-center gap-8 max-w-3xl mx-auto');
    
    // Title section
    const titleSection = document.createElement('div');
    titleSection.className = 'text-center mb-8';
    
    const title = document.createElement('h2');
    title.className = 'text-5xl font-cyber text-neon-pink animate-glow-pulse mb-4 tracking-wider';
    title.textContent = "TOURNAMENT COMPLETE";
    
    const subtitle = document.createElement('p');
    subtitle.className = 'text-xl font-tech text-neon-cyan mb-2';
    subtitle.textContent = winner === "Draw" ? "Match ended in a draw!" : "Congratulations to our champion!";
    
    const divider = document.createElement('div');
    divider.className = 'h-1 w-32 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto';
    
    titleSection.appendChild(title);
    titleSection.appendChild(subtitle);
    titleSection.appendChild(divider);

    // Winner card
    const winnerCard = document.createElement('div');
    winnerCard.className = 'bg-cyber-darker/90 backdrop-blur-md p-12 rounded-lg border-2 border-neon-pink/60 shadow-lg shadow-neon-pink/30 w-full text-center';
    
    // Trophy icon
    const trophyIcon = document.createElement('div');
    trophyIcon.className = 'text-8xl mb-6';
    trophyIcon.textContent = winner === "Draw" ? '🤝' : '🏆';
    
    // Winner label
    const winnerLabel = document.createElement('p');
    winnerLabel.className = 'text-lg font-tech text-gray-300 mb-4';
    winnerLabel.textContent = winner === "Draw" ? 'MATCH RESULT' : 'TOURNAMENT WINNER';
    
    // Winner name
    const winnerName = document.createElement('p');
    winnerName.className = 'text-4xl font-cyber text-neon-pink bg-cyber-dark/50 px-8 py-6 rounded border-2 border-neon-pink/40 shadow-lg mb-6';
    winnerName.textContent = winner === "Draw" ? 'DRAW' : winner || 'Unknown';
    
    // Victory message
    const victoryMessage = document.createElement('p');
    victoryMessage.className = 'text-xl font-tech text-neon-cyan';
    victoryMessage.textContent = winner === "Draw" ? 'An excellent match from both players!' : 'Victory achieved through skill and determination!';
    
    // Assemble winner card
    winnerCard.appendChild(trophyIcon);
    winnerCard.appendChild(winnerLabel);
    winnerCard.appendChild(winnerName);
    winnerCard.appendChild(victoryMessage);
    
    // Button section
    const buttonSection = document.createElement('div');
    buttonSection.className = 'flex gap-4 mt-8';
    
    // Play again button
    const playAgainButton = document.createElement('button');
    playAgainButton.className = 'bg-gradient-to-r from-neon-cyan to-neon-pink text-white font-cyber px-8 py-4 rounded-lg text-xl hover:shadow-lg hover:shadow-neon-cyan/50 transition-all duration-300';
    playAgainButton.textContent = 'PLAY AGAIN';
    playAgainButton.addEventListener('click', () => {
      // Reset the game
      this.container.innerHTML = '';
      this.container.appendChild(this.canvas);
      this.resetGame();
      // Show the game container again
      if (gameContainer) {
        (gameContainer as HTMLElement).style.display = 'block';
      }
    });
    
    // Return to dashboard button
    const returnButton = document.createElement('button');
    returnButton.className = 'bg-gradient-to-r from-neon-pink to-red-500 text-white font-cyber px-8 py-4 rounded-lg text-xl hover:shadow-lg hover:shadow-red-500/50 transition-all duration-300';
    returnButton.textContent = 'RETURN TO DASHBOARD';
    returnButton.addEventListener('click', () => {
      // Navigate back to dashboard
      window.location.href = '/dashboard';
    });
    
    buttonSection.appendChild(playAgainButton);
    buttonSection.appendChild(returnButton);
    
    // Assemble everything
    tournamentDiv.appendChild(titleSection);
    tournamentDiv.appendChild(winnerCard);
    tournamentDiv.appendChild(buttonSection);
    
    // Replace container content
    this.container.innerHTML = '';
    this.container.appendChild(tournamentDiv);
  }

  // Show normal game end popup (like pong)
  private showNormalGameEnd(winner: string): void {
    // Affiche un pop-up de fin de partie façon Pong (rejouer ou revenir)
    const overlay = document.createElement('div');
    overlay.className = 'absolute inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in';

    const endGameContainer = document.createElement('div');
    endGameContainer.className = 'bg-cyber-dark border-2 border-neon-cyan p-8 text-center cyber-border animate-scale-in max-w-md mx-4';

    const winnerTitle = document.createElement('h2');
    winnerTitle.className = 'text-neon-cyan font-cyber text-4xl mb-2 animate-glow-pulse';
    winnerTitle.textContent = winner === "Draw" ? "DRAW" : "GAME OVER";

    const winnerText = document.createElement('p');
    winnerText.className = 'text-neon-cyan font-cyber text-2xl mb-6';
    winnerText.textContent = winner === "Draw" ? "It's a draw!" : `${winner} WINS!`;

    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'flex flex-col gap-4 mt-6';

    const replayButton = document.createElement('button');
    replayButton.textContent = 'REPLAY';
    replayButton.className = 'bg-neon-cyan text-black font-cyber px-6 py-3 rounded shadow-lg hover:bg-cyan-400 transition';
    replayButton.onclick = () => {
      overlay.remove();
      this.resetGame();
    };

    const backButton = document.createElement('button');
    backButton.textContent = 'BACK';
    backButton.className = 'bg-neon-pink text-white font-cyber px-6 py-3 rounded shadow-lg hover:bg-pink-500 transition';
    backButton.onclick = () => {
      overlay.remove();
      // Navigue en arrière dans l'historique ou recharge la page précédente
      window.history.back();
    };

    buttonContainer.appendChild(replayButton);
    buttonContainer.appendChild(backButton);

    endGameContainer.appendChild(winnerTitle);
    endGameContainer.appendChild(winnerText);
    endGameContainer.appendChild(buttonContainer);
    overlay.appendChild(endGameContainer);

    // Ajoute le pop-up à la racine du container du jeu
    this.container.appendChild(overlay);
  }

  private startRenderLoop(): void {
    this.engine.runRenderLoop(() => {
      this.scene.render();
    });

    // Handle window resize
    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  public resetGame(): void {
    // Clear AI timeout if exists
    if (this.aiMoveTimeout) {
      clearTimeout(this.aiMoveTimeout);
      this.aiMoveTimeout = undefined;
    }
    
    // Clear transposition table for nightmare mode
    if (this.aiType === 'nightmare') {
      this.transpositionTable.clear();
    }
    
    // Reset game state
    this.board = Array(this.ROWS).fill(null).map(() => Array(this.COLS).fill(this.EMPTY));
    this.gameEnded = false;

    // Remove all discs from scene
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        if (this.discs[row][col]) {
          this.discs[row][col]?.dispose();
          this.discs[row][col] = null;
        }
      }
    }

    // Reset UI
    this.gameStatusText.text = "Click on a column to drop your disc!";

    // Initialize game (this will set the starting player and trigger AI if needed)
    this.initializeGame();
  }

  public render(): HTMLElement {
    return this.container;
  }

  public destroy(): void {
    // Clear AI timeout if exists
    if (this.aiMoveTimeout) {
      clearTimeout(this.aiMoveTimeout);
      this.aiMoveTimeout = undefined;
    }
    
    if (this.engine) {
      this.engine.dispose();
    }
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
    }
  }

  // Game initialization
  private initializeGame(): void {
    console.log('initializeGame called - isAiGame:', this.isAiGame, 'currentPlayer:', this.currentPlayer);
    // In AI games, randomly decide who starts (50/50 chance)
    if (this.isAiGame && Math.random() < 0.5) {
      this.currentPlayer = this.PLAYER2; // AI starts
      this.updateUI();
      console.log('AI will start first');
      // AI makes the first move after a short delay
      setTimeout(() => {
        this.makeAiMove();
      }, 1000);
    } else {
      // Human starts or it's a human vs human game
      this.currentPlayer = this.PLAYER1;
      this.updateUI();
      console.log('Human starts first');
    }
  }

  // AI Methods
  private makeAiMove(): void {
    console.log('makeAiMove called - isAiGame:', this.isAiGame, 'gameEnded:', this.gameEnded, 'isAnimating:', this.isAnimating);
    if (!this.isAiGame || this.gameEnded || this.isAnimating) return;

    // Add delay to make AI moves feel more natural
    const delay = this.getAiDelay();
    console.log('AI will move in', delay, 'ms');
    this.aiMoveTimeout = window.setTimeout(() => {
      const column = this.getAiMove();
      console.log('AI chose column:', column);
      if (column !== -1) {
        this.dropDisc(column);
      } else {
        console.error('AI returned invalid column');
      }
    }, delay);
  }

  private getAiDelay(): number {
    switch (this.aiType) {
      case 'easy': return 800 + Math.random() * 1200; // 0.8-2s
      case 'medium': return 600 + Math.random() * 800; // 0.6-1.4s
      case 'hard': return 400 + Math.random() * 600; // 0.4-1s
      case 'nightmare': return 100 + Math.random() * 200; // 0.1-0.3s (lightning fast)
      default: return 1000;
    }
  }

  private getAiMove(): number {
    console.log('getAiMove called with aiType:', this.aiType);
    switch (this.aiType) {
      case 'easy': return this.getEasyAiMove();
      case 'medium': return this.getMediumAiMove();
      case 'hard': return this.getHardAiMove();
      case 'nightmare': return this.getNightmareAiMove();
      default: 
        console.warn('Unknown AI type, using random move');
        return this.getRandomMove();
    }
  }

  private getEasyAiMove(): number {
    // 70% random moves, 30% try to block obvious wins
    if (Math.random() < 0.7) {
      return this.getRandomMove();
    }
    return this.getMediumAiMove();
  }

  private getMediumAiMove(): number {
    // Try to win first, then block player wins, then random
    let move = this.findWinningMove(this.PLAYER2);
    if (move !== -1) return move;

    move = this.findWinningMove(this.PLAYER1);
    if (move !== -1) return move;

    return this.getRandomMove();
  }

  private getHardAiMove(): number {
    // Use minimax with limited depth
    return this.minimax(3, this.PLAYER2, -Infinity, Infinity).column;
  }

  private getNightmareAiMove(): number {
    // NIGHTMARE MODE: Nearly impossible to beat
    // Uses deep minimax with advanced heuristics and opening book
    
    // Opening book for optimal first moves
    if (this.isEarlyGame()) {
      const openingMove = this.getOptimalOpening();
      if (openingMove !== -1) return openingMove;
    }
    
    // Use very deep minimax (8-10 moves ahead)
    const depth = Math.min(10, this.getEmptySpaces()); // Adaptive depth
    return this.minimax(depth, this.PLAYER2, -Infinity, Infinity).column;
  }

  private getRandomMove(): number {
    const validMoves = this.getValidMoves();
    console.log('Valid moves available:', validMoves);
    if (validMoves.length === 0) return -1;
    const selectedMove = validMoves[Math.floor(Math.random() * validMoves.length)];
    console.log('Random move selected:', selectedMove);
    return selectedMove;
  }

  private getValidMoves(): number[] {
    const validMoves: number[] = [];
    for (let col = 0; col < this.COLS; col++) {
      if (this.board[0][col] === this.EMPTY) {
        validMoves.push(col);
      }
    }
    return validMoves;
  }

  private findWinningMove(player: number): number {
    for (let col = 0; col < this.COLS; col++) {
      if (this.board[0][col] === this.EMPTY) {
        // Find the row where the disc would land
        let row = -1;
        for (let r = this.ROWS - 1; r >= 0; r--) {
          if (this.board[r][col] === this.EMPTY) {
            row = r;
            break;
          }
        }
        
        if (row !== -1) {
          // Temporarily place the disc
          this.board[row][col] = player;
          const isWin = this.checkWin(row, col);
          // Remove the disc
          this.board[row][col] = this.EMPTY;
          
          if (isWin) {
            return col;
          }
        }
      }
    }
    return -1;
  }

  private minimax(depth: number, player: number, alpha: number, beta: number): { column: number; score: number } {
    const validMoves = this.getValidMoves();
    
    // Transposition table lookup (nightmare mode only)
    const boardKey = this.aiType === 'nightmare' ? this.getBoardKey() : '';
    if (this.aiType === 'nightmare' && boardKey) {
      const cached = this.transpositionTable.get(boardKey);
      if (cached && cached.depth >= depth) {
        return { column: cached.bestMove, score: cached.score };
      }
    }
    
    if (depth === 0 || validMoves.length === 0) {
      // Use advanced evaluation for nightmare mode
      const score = this.aiType === 'nightmare' ? this.evaluateBoardAdvanced() : this.evaluateBoard();
      return { column: -1, score };
    }

    let bestColumn = validMoves[0];
    
    if (player === this.PLAYER2) { // AI (maximizing)
      let maxScore = -Infinity;
      for (const col of validMoves) {
        const row = this.getNextRow(col);
        if (row !== -1) {
          this.board[row][col] = player;
          
          if (this.checkWin(row, col)) {
            this.board[row][col] = this.EMPTY;
            const result = { column: col, score: 1000000 + depth };
            
            // Cache result
            if (this.aiType === 'nightmare' && boardKey) {
              this.transpositionTable.set(boardKey, { score: result.score, depth, bestMove: col });
            }
            
            return result;
          }
          
          const score = this.minimax(depth - 1, this.PLAYER1, alpha, beta).score;
          this.board[row][col] = this.EMPTY;
          
          if (score > maxScore) {
            maxScore = score;
            bestColumn = col;
          }
          
          alpha = Math.max(alpha, score);
          if (beta <= alpha) break; // Alpha-beta pruning
        }
      }
      
      // Cache result
      if (this.aiType === 'nightmare' && boardKey) {
        this.transpositionTable.set(boardKey, { score: maxScore, depth, bestMove: bestColumn });
      }
      
      return { column: bestColumn, score: maxScore };
    } else { // Human (minimizing)
      let minScore = Infinity;
      for (const col of validMoves) {
        const row = this.getNextRow(col);
        if (row !== -1) {
          this.board[row][col] = player;
          
          if (this.checkWin(row, col)) {
            this.board[row][col] = this.EMPTY;
            const result = { column: col, score: -1000000 - depth };
            
            // Cache result
            if (this.aiType === 'nightmare' && boardKey) {
              this.transpositionTable.set(boardKey, { score: result.score, depth, bestMove: col });
            }
            
            return result;
          }
          
          const score = this.minimax(depth - 1, this.PLAYER2, alpha, beta).score;
          this.board[row][col] = this.EMPTY;
          
          if (score < minScore) {
            minScore = score;
            bestColumn = col;
          }
          
          beta = Math.min(beta, score);
          if (beta <= alpha) break; // Alpha-beta pruning
        }
      }
      
      // Cache result
      if (this.aiType === 'nightmare' && boardKey) {
        this.transpositionTable.set(boardKey, { score: minScore, depth, bestMove: bestColumn });
      }
      
      return { column: bestColumn, score: minScore };
    }
  }

  private getNextRow(col: number): number {
    for (let r = this.ROWS - 1; r >= 0; r--) {
      if (this.board[r][col] === this.EMPTY) {
        return r;
      }
    }
    return -1;
  }

  private evaluateBoard(): number {
    let score = 0;
    
    // Check all possible 4-in-a-row positions
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        // Horizontal
        if (col <= this.COLS - 4) {
          score += this.evaluateWindowAdvanced([
            this.board[row][col],
            this.board[row][col + 1],
            this.board[row][col + 2],
            this.board[row][col + 3]
          ]);
        }
        
        // Vertical
        if (row <= this.ROWS - 4) {
          score += this.evaluateWindowAdvanced([
            this.board[row][col],
            this.board[row + 1][col],
            this.board[row + 2][col],
            this.board[row + 3][col]
          ]);
        }
        
        // Diagonal (top-left to bottom-right)
        if (row <= this.ROWS - 4 && col <= this.COLS - 4) {
          score += this.evaluateWindowAdvanced([
            this.board[row][col],
            this.board[row + 1][col + 1],
            this.board[row + 2][col + 2],
            this.board[row + 3][col + 3]
          ]);
        }
        
        // Diagonal (top-right to bottom-left)
        if (row <= this.ROWS - 4 && col >= 3) {
          score += this.evaluateWindowAdvanced([
            this.board[row][col],
            this.board[row + 1][col - 1],
            this.board[row + 2][col - 2],
            this.board[row + 3][col - 3]
          ]);
        }
      }
    }
    
    return score;
  }


  // Advanced AI methods for NIGHTMARE mode
  private isEarlyGame(): boolean {
    const totalMoves = this.getTotalMoves();
    return totalMoves < 6; // First 6 moves are considered early game
  }

  private getTotalMoves(): number {
    let moves = 0;
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        if (this.board[row][col] !== this.EMPTY) moves++;
      }
    }
    return moves;
  }

  private getEmptySpaces(): number {
    return (this.ROWS * this.COLS) - this.getTotalMoves();
  }

  private getOptimalOpening(): number {
    const totalMoves = this.getTotalMoves();
    const center = Math.floor(this.COLS / 2); // Column 3 for 7-column board
    
    // AI's opening strategy (nearly unbeatable)
    if (totalMoves === 0) {
      // Always start in center - mathematically optimal
      return center;
    }
    
    if (totalMoves === 1) {
      // If human played center, play next to it
      if (this.board[this.ROWS - 1][center] === this.PLAYER1) {
        return center - 1; // Play left of center
      }
      // If human didn't play center, take center
      return center;
    }
    
    if (totalMoves === 2) {
      // Advanced opening theory - create threats
      if (this.board[this.ROWS - 1][center] === this.PLAYER2) {
        // AI has center, build around it
        return center + 1;
      }
    }
    
    // No specific opening pattern, use advanced minimax
    return -1;
  }

  // Enhanced evaluation function for nightmare mode
  private evaluateBoardAdvanced(): number {
    let score = 0;
    
    // 1. Check for immediate wins/losses (highest priority)
    for (let col = 0; col < this.COLS; col++) {
      if (this.board[0][col] === this.EMPTY) {
        const row = this.getNextRow(col);
        if (row !== -1) {
          // Check if this move wins for AI
          this.board[row][col] = this.PLAYER2;
          if (this.checkWin(row, col)) {
            this.board[row][col] = this.EMPTY;
            return 10000; // Winning move
          }
          this.board[row][col] = this.EMPTY;
          
          // Check if this move blocks human win
          this.board[row][col] = this.PLAYER1;
          if (this.checkWin(row, col)) {
            this.board[row][col] = this.EMPTY;
            score += 5000; // Blocking move
          }
          this.board[row][col] = this.EMPTY;
        }
      }
    }
    
    // 2. Center control bonus (center columns are more valuable)
    const center = Math.floor(this.COLS / 2);
    for (let row = 0; row < this.ROWS; row++) {
      if (this.board[row][center] === this.PLAYER2) score += 10;
      if (this.board[row][center] === this.PLAYER1) score -= 8;
      
      // Adjacent to center also valuable
      if (center > 0) {
        if (this.board[row][center - 1] === this.PLAYER2) score += 6;
        if (this.board[row][center - 1] === this.PLAYER1) score -= 5;
      }
      if (center < this.COLS - 1) {
        if (this.board[row][center + 1] === this.PLAYER2) score += 6;
        if (this.board[row][center + 1] === this.PLAYER1) score -= 5;
      }
    }
    
    // 3. Advanced pattern recognition
    score += this.evaluateAdvancedPatterns();
    
    // 4. Traditional window evaluation (enhanced)
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        // Horizontal
        if (col <= this.COLS - 4) {
          score += this.evaluateWindowAdvanced([
            this.board[row][col],
            this.board[row][col + 1],
            this.board[row][col + 2],
            this.board[row][col + 3]
          ]);
        }
        
        // Vertical
        if (row <= this.ROWS - 4) {
          score += this.evaluateWindowAdvanced([
            this.board[row][col],
            this.board[row + 1][col],
            this.board[row + 2][col],
            this.board[row + 3][col]
          ]);
        }
        
        // Diagonal (top-left to bottom-right)
        if (row <= this.ROWS - 4 && col <= this.COLS - 4) {
          score += this.evaluateWindowAdvanced([
            this.board[row][col],
            this.board[row + 1][col + 1],
            this.board[row + 2][col + 2],
            this.board[row + 3][col + 3]
          ]);
        }
        
        // Diagonal (top-right to bottom-left)
        if (row <= this.ROWS - 4 && col >= 3) {
          score += this.evaluateWindowAdvanced([
            this.board[row][col],
            this.board[row + 1][col - 1],
            this.board[row + 2][col - 2],
            this.board[row + 3][col - 3]
          ]);
        }
      }
    }
    
    return score;
  }

  private evaluateAdvancedPatterns(): number {
    let score = 0;
    
    // Look for multiple threats (forks)
    let aiThreats = 0;
    let humanThreats = 0;
    
    for (let col = 0; col < this.COLS; col++) {
      if (this.board[0][col] === this.EMPTY) {
        const row = this.getNextRow(col);
        if (row !== -1) {
          // Check for threats created by this move
          this.board[row][col] = this.PLAYER2;
          if (this.countThreats(row, col, this.PLAYER2) > 0) aiThreats++;
          this.board[row][col] = this.EMPTY;
          
          this.board[row][col] = this.PLAYER1;
          if (this.countThreats(row, col, this.PLAYER1) > 0) humanThreats++;
          this.board[row][col] = this.EMPTY;
        }
      }
    }
    
    // Multiple threats are exponentially more valuable
    if (aiThreats >= 2) score += 1000 * aiThreats;
    if (humanThreats >= 2) score -= 800 * humanThreats;
    
    return score;
  }

  private countThreats(row: number, col: number, player: number): number {
    let threats = 0;
    
    // Check all directions for 3-in-a-row with empty space
    const directions = [
      [0, 1], [1, 0], [1, 1], [1, -1] // horizontal, vertical, diagonal
    ];
    
    for (const [dr, dc] of directions) {
      let count = 1;
      let spaces = 0;
      
      // Check positive direction
      for (let i = 1; i < 4; i++) {
        const newRow = row + dr * i;
        const newCol = col + dc * i;
        
        if (newRow < 0 || newRow >= this.ROWS || newCol < 0 || newCol >= this.COLS) break;
        
        if (this.board[newRow][newCol] === player) {
          count++;
        } else if (this.board[newRow][newCol] === this.EMPTY) {
          spaces++;
          break;
        } else {
          break;
        }
      }
      
      // Check negative direction
      for (let i = 1; i < 4; i++) {
        const newRow = row - dr * i;
        const newCol = col - dc * i;
        
        if (newRow < 0 || newRow >= this.ROWS || newCol < 0 || newCol >= this.COLS) break;
        
        if (this.board[newRow][newCol] === player) {
          count++;
        } else if (this.board[newRow][newCol] === this.EMPTY) {
          spaces++;
          break;
        } else {
          break;
        }
      }
      
      if (count >= 3 && spaces > 0) threats++;
    }
    
    return threats;
  }

  private evaluateWindowAdvanced(window: number[]): number {
    let score = 0;
    const aiCount = window.filter(cell => cell === this.PLAYER2).length;
    const humanCount = window.filter(cell => cell === this.PLAYER1).length;
    const emptyCount = window.filter(cell => cell === this.EMPTY).length;
    
    // No mixed windows
    if (aiCount > 0 && humanCount > 0) return 0;
    
    // AI scoring (much more aggressive)
    if (aiCount === 4) return 1000000; // Instant win
    if (aiCount === 3 && emptyCount === 1) score += 1000;
    if (aiCount === 2 && emptyCount === 2) score += 100;
    if (aiCount === 1 && emptyCount === 3) score += 10;
    
    // Human blocking (extremely defensive)
    if (humanCount === 4) return -1000000; // Prevent loss
    if (humanCount === 3 && emptyCount === 1) score -= 10000; // Block critical threats
    if (humanCount === 2 && emptyCount === 2) score -= 500;
    if (humanCount === 1 && emptyCount === 3) score -= 50;
    
    return score;
  }

  private getBoardKey(): string {
    // Generate a unique string representation of the board state
    let key = '';
    for (let row = 0; row < this.ROWS; row++) {
      for (let col = 0; col < this.COLS; col++) {
        key += this.board[row][col].toString();
      }
    }
    return key;
  }

  // Ajout : méthode publique pour afficher le vainqueur (utilisée par PlayConnect4Page)
  public showWinner(winner: string): void {
    // Affiche la page de fin de tournoi (même logique que showTournamentComplete)
    this.endGame(winner);
  }
}

export default Connect4Component;
