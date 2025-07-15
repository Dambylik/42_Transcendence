import BasePongPage from '../../core/templates/basePongPage';
import { Router } from '../../../router/Router.ts';
import localGame from '../../assets/local_game.png';
import PongComponent from '../../core/components/pong/pong.ts';
import { showNotification } from '../../utils/notifications';
import { createFormContainer, createCanvasWrapper } from '../../core/components/pong/pongFormUtils.ts';
// import { createCyberButton, createPageHeader, createBackgroundLayers, createFormFieldGroup, createGameRules, createEndGameScreen, createAnimatedContainer } from '../../core/components/pong/pongUtils.ts';
import { createCyberButton, createPageHeader, createBackgroundLayers, createFormFieldGroup, createGameRules, createAnimatedContainer } from '../../core/components/pong/pongUtils.ts';

    type matchs_round_type = {
        id:number;
        first_player: string;
        second_player: string;
        finished : boolean;
        winner: string | null;
    };

    type users_local = {
        player_id : number;
        username: string;
        eliminated : boolean;
    };


class tournamentLocalPong extends BasePongPage {


    // Tous les conteneurs a utiliser pour faire un tournoi local
    private matchs_rounds : matchs_round_type[] = []; // Tableau qui contient des objets représetnants tous les matchs 1v1 locaux pour ce round
    private players_list : users_local[] = []; // Tableau qui contient toute la liste des joueurs(objets) pour le tournoi local

    static readonly TextObject = {
        MainTitle: 'LOCAL PONG',
        Subtitle: 'CHALLENGE YOUR FRIEND',
        EnterNames: 'ENTER PLAYER NAMES (TOURNAMENT)',
        ChooseChallengers: 'CHOOSE YOUR CHALLENGERS',
        StartGame: 'START GAME',
        ReturnHome: 'RETURN HOME',
        Controls: 'PLAYER 1: W/S KEYS | PLAYER 2: UP/DOWN ARROWS'
    };

    private gameEndedNaturally: boolean = false;
    
    constructor(id: string = 'local-pong', router?: Router) {
        super(id, router);
    }

    async render(): Promise<HTMLElement> {
        this.container.innerHTML = '';
        await super.setupHeaderListeners();
        this.setupKeyHandlers();
        const sidebarHtml = await this.createSidebar();

        const localPongContent = document.createElement('div');
        localPongContent.className = 'min-h-screen pt-4 relative overflow-hidden flex flex-row bg-cyber-dark';
        
        const backgroundLayers = createBackgroundLayers(localGame, 'Local Pong Background');
        const pageHeader = createPageHeader(tournamentLocalPong.TextObject.MainTitle, tournamentLocalPong.TextObject.Subtitle);
        
        localPongContent.innerHTML = sidebarHtml;
        
        const main = document.createElement('main');
        main.className = 'flex-1 flex flex-col';
        main.appendChild(backgroundLayers);
        main.appendChild(pageHeader);
        
        const contentArea = document.createElement('div');
        contentArea.className = 'flex-1 px-8 pb-8 pt-4 relative z-10 flex flex-col items-center';
        contentArea.innerHTML = `
            <div id="player-setup-container" class="max-w-5xl mx-auto w-full"></div>
            <div id="pong-container" class="mt-4 max-w-5xl mx-auto cyber-border relative w-full flex flex-col items-center"></div>
        `;
        
        main.appendChild(contentArea);
        localPongContent.appendChild(main);
        this.container.appendChild(localPongContent);
        this.renderPlayerSetup();
        await super.setupSidebarListeners();
        
        return this.container;
    }

    private renderPlayerSetup(): void {
        const setupContainer = this.container.querySelector('#player-setup-container');
        if (!setupContainer) return;
        
        const setupDiv = createAnimatedContainer('flex flex-col items-center justify-center gap-8');
        const subtitle = document.createElement('p');
        subtitle.className = 'text-gray-300 font-tech text-sm mb-8 text-center';
        subtitle.textContent = tournamentLocalPong.TextObject.ChooseChallengers;
        
        // Create form container
        const formContainer = createFormContainer({
            title: tournamentLocalPong.TextObject.EnterNames,
            maxWidth: 'max-w-2xl',
            centered: true
        });

        const form = document.createElement('form');
        form.className = 'flex flex-col gap-6 max-w-md mx-auto';
        
        const fieldsDiv = document.createElement('div');
        fieldsDiv.className = 'space-y-4';
        
        const fieldsGroup = createFormFieldGroup({
            fields: [
                {
                    id: 'player1',
                    placeholder: 'PLAYER 1 USERNAME',
                    colorTheme: 'cyan',
                    required: true
                },
                {
                    id: 'player2', 
                    placeholder: 'PLAYER 2 USERNAME',
                    colorTheme: 'cyan',
                    required: true
                },
                {
                    id: 'player3', 
                    placeholder: 'PLAYER 3 USERNAME',
                    colorTheme: 'cyan',
                    required: true
                },
                {
                    id: 'player4', 
                    placeholder: 'PLAYER 4 USERNAME',
                    colorTheme: 'cyan',
                    required: true
                }
            ]
        });
        
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'flex flex-col gap-4';
        
        const startButton = createCyberButton({
            text: tournamentLocalPong.TextObject.StartGame,
            type: 'gradient',
            fullWidth: true
        });
        (startButton as HTMLButtonElement).type = 'submit';
        
        const returnButton = createCyberButton({
            text: tournamentLocalPong.TextObject.ReturnHome,
            type: 'secondary',
            fullWidth: true,
            onClick: () => this.router?.navigate('/dashboard')
        });
        
        buttonGroup.appendChild(startButton);
        buttonGroup.appendChild(returnButton);
        
        fieldsDiv.appendChild(fieldsGroup);
        form.appendChild(fieldsDiv);
        form.appendChild(buttonGroup);
        formContainer.appendChild(form);
        
        setupDiv.appendChild(subtitle);
        setupDiv.appendChild(formContainer);
        setupContainer.innerHTML = '';
        setupContainer.appendChild(setupDiv);
        
        // Setup form event listener
        form.addEventListener('submit', (e) => this.handleGameStart(e));
    }


    private showInfosGame()
    {
        const setupContainer = this.container.querySelector('#player-setup-container');
        if (!setupContainer) return;
        
        // Pour empecher le fade out
        if (setupContainer) {
            setupContainer.classList.remove('animate-fade-out');
        }

        // Cache le jeu pong
        const pongDiv = document.querySelector('#pong-container');
        if (pongDiv)
        {
            (pongDiv as HTMLElement).style.display = "none";
        }

        // Create main container with cyber styling
        const setupDiv = createAnimatedContainer('flex flex-col items-center justify-center gap-8 max-w-4xl mx-auto');
        
        // Title section
        const titleSection = document.createElement('div');
        titleSection.className = 'text-center mb-8';
        
        const title = document.createElement('h2');
        title.className = 'text-4xl font-cyber text-neon-pink animate-glow-pulse mb-4 tracking-wider';
        title.textContent = "TOURNAMENT BRACKET";
        
        const subtitle = document.createElement('p');
        subtitle.className = 'text-xl font-tech text-neon-cyan mb-2';
        subtitle.textContent = "Order of play for the new round";
        
        const divider = document.createElement('div');
        divider.className = 'h-1 w-32 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto';
        
        titleSection.appendChild(title);
        titleSection.appendChild(subtitle);
        titleSection.appendChild(divider);

        // Matchups container
        const matchupsContainer = document.createElement('div');
        matchupsContainer.className = 'w-full space-y-6';
        
        let matchNumber = 1;
        for (const round of this.matchs_rounds)
        {
            // Individual matchup card
            const matchupCard = document.createElement('div');
            matchupCard.className = 'bg-cyber-darker/90 backdrop-blur-md p-6 rounded-lg border-2 border-neon-cyan/40 shadow-lg shadow-neon-cyan/20 hover:shadow-neon-cyan/30 transition-all duration-300';
            
            // Match number header
            const matchHeader = document.createElement('div');
            matchHeader.className = 'text-center mb-4';
            
            const matchTitle = document.createElement('h3');
            matchTitle.className = 'text-2xl font-cyber text-neon-pink mb-2';
            matchTitle.innerHTML = `MATCH ${matchNumber}`;
            
            const matchDivider = document.createElement('div');
            matchDivider.className = 'h-0.5 w-16 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto';
            
            matchHeader.appendChild(matchTitle);
            matchHeader.appendChild(matchDivider);
            
            // Players section
            const playersSection = document.createElement('div');
            playersSection.className = 'flex items-center justify-center gap-8';
            
            // Player 1
            const player1Container = document.createElement('div');
            player1Container.className = 'flex-1 text-center';
            
            const player1Label = document.createElement('p');
            player1Label.className = 'text-sm font-tech text-gray-400 mb-2';
            player1Label.textContent = 'PLAYER 1';
            
            const player1Name = document.createElement('p');
            player1Name.className = 'text-xl font-cyber text-neon-cyan bg-cyber-dark/50 px-4 py-2 rounded border border-neon-cyan/30';
            player1Name.textContent = round.first_player;
            
            player1Container.appendChild(player1Label);
            player1Container.appendChild(player1Name);
            
            // VS divider
            const vsContainer = document.createElement('div');
            vsContainer.className = 'flex items-center justify-center';
            
            const vsText = document.createElement('span');
            vsText.className = 'text-3xl font-cyber text-neon-pink animate-pulse px-4';
            vsText.textContent = 'VS';
            
            vsContainer.appendChild(vsText);
            
            // Player 2
            const player2Container = document.createElement('div');
            player2Container.className = 'flex-1 text-center';
            
            const player2Label = document.createElement('p');
            player2Label.className = 'text-sm font-tech text-gray-400 mb-2';
            player2Label.textContent = 'PLAYER 2';
            
            const player2Name = document.createElement('p');
            player2Name.className = 'text-xl font-cyber text-neon-cyan bg-cyber-dark/50 px-4 py-2 rounded border border-neon-cyan/30';
            player2Name.textContent = round.second_player;
            
            player2Container.appendChild(player2Label);
            player2Container.appendChild(player2Name);
            
            // Assemble players section
            playersSection.appendChild(player1Container);
            playersSection.appendChild(vsContainer);
            playersSection.appendChild(player2Container);
            
            // Assemble matchup card
            matchupCard.appendChild(matchHeader);
            matchupCard.appendChild(playersSection);
            
            matchupsContainer.appendChild(matchupCard);
            matchNumber++;
        }
        
        // Loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'text-center mt-8';
        
        const loadingText = document.createElement('p');
        loadingText.className = 'text-lg font-tech text-gray-300 mb-4';
        loadingText.textContent = 'Preparing matches...';
        
        const loadingBar = document.createElement('div');
        loadingBar.className = 'w-64 h-2 bg-cyber-dark rounded-full mx-auto overflow-hidden';
        
        const loadingProgress = document.createElement('div');
        loadingProgress.className = 'h-full bg-gradient-to-r from-neon-pink to-neon-cyan animate-pulse';
        loadingProgress.style.width = '100%';
        
        loadingBar.appendChild(loadingProgress);
        loadingIndicator.appendChild(loadingText);
        loadingIndicator.appendChild(loadingBar);

        // Assemble everything
        setupDiv.appendChild(titleSection);
        setupDiv.appendChild(matchupsContainer);
        setupDiv.appendChild(loadingIndicator);
        
        setupContainer.innerHTML = '';
        setupContainer.appendChild(setupDiv);
    }

    // Masque le jeu pong et affiche le pseudo du gagnant dans une div
    private showWinner()
    {
        const setupContainer = this.container.querySelector('#player-setup-container');
        if (!setupContainer) return;
        
        // Pour empecher le fade out
        if (setupContainer) {
            setupContainer.classList.remove('animate-fade-out');
        }

        // Cache le jeu pong
        const pongDiv = document.querySelector('#pong-container');
        if (pongDiv)
        {
            (pongDiv as HTMLElement).style.display = "none";
        }

        // Obtient le nom du gagnant du tournoi
        let winner_username;
        for (let i = 0; i < this.players_list.length; i++)
        {
            if (this.players_list[i].eliminated == false)
            {
                winner_username = this.players_list[i].username;
            }
        }

        // Main container
        const setupDiv = createAnimatedContainer('flex flex-col items-center justify-center gap-8 max-w-3xl mx-auto');
        
        // Title section
        const titleSection = document.createElement('div');
        titleSection.className = 'text-center mb-8';
        
        const title = document.createElement('h2');
        title.className = 'text-5xl font-cyber text-neon-pink animate-glow-pulse mb-4 tracking-wider';
        title.textContent = "TOURNAMENT COMPLETE";
        
        const subtitle = document.createElement('p');
        subtitle.className = 'text-xl font-tech text-neon-cyan mb-2';
        subtitle.textContent = "Congratulations to our champion!";
        
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
        trophyIcon.textContent = '🏆';
        
        // Winner label
        const winnerLabel = document.createElement('p');
        winnerLabel.className = 'text-lg font-tech text-gray-300 mb-4';
        winnerLabel.textContent = 'TOURNAMENT WINNER';
        
        // Winner name
        const winnerName = document.createElement('p');
        winnerName.className = 'text-4xl font-cyber text-neon-pink bg-cyber-dark/50 px-8 py-6 rounded border-2 border-neon-pink/40 shadow-lg mb-6';
        winnerName.textContent = winner_username || 'Unknown';
        
        // Victory message
        const victoryMessage = document.createElement('p');
        victoryMessage.className = 'text-xl font-tech text-neon-cyan';
        victoryMessage.textContent = 'Victory achieved through skill and determination!';
        
        // Assemble winner card
        winnerCard.appendChild(trophyIcon);
        winnerCard.appendChild(winnerLabel);
        winnerCard.appendChild(winnerName);
        winnerCard.appendChild(victoryMessage);
        
        // Return button
        const returnButton = document.createElement('button');
        returnButton.className = 'bg-gradient-to-r from-neon-cyan to-neon-pink text-white font-cyber px-8 py-4 rounded-lg text-xl hover:shadow-lg hover:shadow-neon-cyan/50 transition-all duration-300 mt-8';
        returnButton.textContent = 'RETURN TO DASHBOARD';
        returnButton.addEventListener('click', () => {
            this.router?.navigate('/dashboard');
        });

        setupDiv.appendChild(titleSection);
        setupDiv.appendChild(winnerCard);
        setupDiv.appendChild(returnButton);
        
        setupContainer.innerHTML = '';
        setupContainer.appendChild(setupDiv);
    }

    // Masque le jeu pong et affiche les pseudos des deux joueurs pour le prochain match
    private showNextMatch()
    {
        const setupContainer = this.container.querySelector('#player-setup-container');
        if (!setupContainer) return;
        
        // Pour empecher le fade out
        if (setupContainer) {
            setupContainer.classList.remove('animate-fade-out');
        }

        // Cache le jeu pong
        const pongDiv = document.querySelector('#pong-container');
        if (pongDiv)
        {
            (pongDiv as HTMLElement).style.display = "none";
        }

        // Obtient les usernames du prochain match
        let actual_match;
        let first_username = "";
        let second_username = "";
        for (const new_match of this.matchs_rounds)
        {
            if (new_match.finished == false)
            {
                actual_match = new_match;
                first_username = actual_match.first_player;
                second_username = actual_match.second_player;
                break;
            }
        }

        // Create main container with cyber styling
        const setupDiv = createAnimatedContainer('flex flex-col items-center justify-center gap-8 max-w-3xl mx-auto');
        
        // Title section
        const titleSection = document.createElement('div');
        titleSection.className = 'text-center mb-8';
        
        const title = document.createElement('h2');
        title.className = 'text-4xl font-cyber text-neon-pink animate-glow-pulse mb-4 tracking-wider';
        title.textContent = "NEXT MATCH";
        
        const subtitle = document.createElement('p');
        subtitle.className = 'text-xl font-tech text-neon-cyan mb-2';
        subtitle.textContent = "Get ready for the upcoming battle";
        
        const divider = document.createElement('div');
        divider.className = 'h-1 w-32 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto';
        
        titleSection.appendChild(title);
        titleSection.appendChild(subtitle);
        titleSection.appendChild(divider);

        // Next match card
        const matchCard = document.createElement('div');
        matchCard.className = 'bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border-2 border-neon-cyan/40 shadow-lg shadow-neon-cyan/20 w-full';
        
        // Players section
        const playersSection = document.createElement('div');
        playersSection.className = 'flex items-center justify-center gap-8';
        
        // Player 1
        const player1Container = document.createElement('div');
        player1Container.className = 'flex-1 text-center';
        
        const player1Label = document.createElement('p');
        player1Label.className = 'text-sm font-tech text-gray-400 mb-3';
        player1Label.textContent = 'PLAYER 1';
        
        const player1Name = document.createElement('p');
        player1Name.className = 'text-2xl font-cyber text-neon-cyan bg-cyber-dark/50 px-6 py-4 rounded border border-neon-cyan/30 shadow-lg';
        player1Name.textContent = first_username;
        
        player1Container.appendChild(player1Label);
        player1Container.appendChild(player1Name);
        
        // VS divider with animation
        const vsContainer = document.createElement('div');
        vsContainer.className = 'flex items-center justify-center';
        
        const vsText = document.createElement('span');
        vsText.className = 'text-4xl font-cyber text-neon-pink animate-pulse px-6';
        vsText.textContent = 'VS';
        
        vsContainer.appendChild(vsText);
        
        // Player 2
        const player2Container = document.createElement('div');
        player2Container.className = 'flex-1 text-center';
        
        const player2Label = document.createElement('p');
        player2Label.className = 'text-sm font-tech text-gray-400 mb-3';
        player2Label.textContent = 'PLAYER 2';
        
        const player2Name = document.createElement('p');
        player2Name.className = 'text-2xl font-cyber text-neon-cyan bg-cyber-dark/50 px-6 py-4 rounded border border-neon-cyan/30 shadow-lg';
        player2Name.textContent = second_username;
        
        player2Container.appendChild(player2Label);
        player2Container.appendChild(player2Name);
        
        // Assemble players section
        playersSection.appendChild(player1Container);
        playersSection.appendChild(vsContainer);
        playersSection.appendChild(player2Container);
        
        matchCard.appendChild(playersSection);
        
        // Loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'text-center mt-8';
        
        const loadingText = document.createElement('p');
        loadingText.className = 'text-lg font-tech text-gray-300 mb-4';
        loadingText.textContent = 'Starting match...';
        
        const loadingBar = document.createElement('div');
        loadingBar.className = 'w-64 h-2 bg-cyber-dark rounded-full mx-auto overflow-hidden';
        
        const loadingProgress = document.createElement('div');
        loadingProgress.className = 'h-full bg-gradient-to-r from-neon-pink to-neon-cyan animate-pulse';
        loadingProgress.style.width = '100%';
        
        loadingBar.appendChild(loadingProgress);
        loadingIndicator.appendChild(loadingText);
        loadingIndicator.appendChild(loadingBar);

        setupDiv.appendChild(titleSection);
        setupDiv.appendChild(matchCard);
        setupDiv.appendChild(loadingIndicator);
        
        setupContainer.innerHTML = '';
        setupContainer.appendChild(setupDiv);
    }

    // private startGame(player1: string, player2: string): void {
    //     const setupContainer = this.container.querySelector('#player-setup-container');
    //     if (setupContainer) {
    //         setupContainer.classList.add('animate-fade-out');
    //         setTimeout(() => {
    //             if (setupContainer) setupContainer.innerHTML = '';
    //             this.initializeGame(player1, player2);
    //         }, 300);
    //     } else {
    //         this.initializeGame(player1, player2);
    //     }
    // }
    
    // Appelé lorsque j'envoie le formulaire de création de tournoi (avec pseudos) au tout début lors du chargement de la page
    private handleGameStart(e: Event): void {
        e.preventDefault();
        

        // A FAIRE : générer les conteneurs pour le tournoi (new)
        // Je modifie ca pour avoir 4 joueurs

        const player1Input = this.container.querySelector<HTMLInputElement>('#player1');
        const player2Input = this.container.querySelector<HTMLInputElement>('#player2');
        const player3Input = this.container.querySelector<HTMLInputElement>('#player3');
        const player4Input = this.container.querySelector<HTMLInputElement>('#player4');



        if (!player1Input?.value.trim() || !player2Input?.value.trim()|| !player3Input?.value.trim()|| !player4Input?.value.trim()) {
            showNotification('Please enter both usernames!', 'error');
            return;
        }

        const player1 = player1Input.value.trim();
        const player2 = player2Input.value.trim();
        const player3 = player3Input.value.trim();
        const player4 = player4Input.value.trim();

        // Ajoute tous les joueurs dans la liste des joueurs local
        this.players_list.push({player_id:1, username:player1, eliminated:false});
        this.players_list.push({player_id:2, username:player2, eliminated:false});
        this.players_list.push({player_id:3, username:player3, eliminated:false});
        this.players_list.push({player_id:4, username:player4, eliminated:false});

        // Génère la liste de tous les matchs 1V1 générés pour ce round
        this.generateRound();

        // A FAIRE : afficher la liste des rounds

        // this.launchMatch(); // COMMENTE

        this.showInfosGame();
        setTimeout(() => {this.launchMatch()}, 5000);


        // this.showInfosGame(); // TEST

        
        // this.startGame(player1, player2);
    }

    // Lance le premier match disponible a partir du conteneur matchs_rounds
    private launchMatch()
    {
        // Je vérifie si il y a un match de disponible (cad que le round n'est pas terminé)
        let actual_match;
        for (const new_match of this.matchs_rounds)
        {
            if (new_match.finished == false)
            {
                actual_match = new_match;
                break;
            }
        }

        // J'affiche la liste des joueurs


        // Je reaffiche la div Pong
        const pongDiv = document.querySelector('#pong-container');
        if (pongDiv)
        {
            (pongDiv as HTMLElement).style.display = "block";
        }


        // A FAIRE : charger le canvas
        if (actual_match?.first_player && actual_match?.second_player)
        {
            // alert("New match. This match : " + actual_match?.first_player + " (first player) VS " + actual_match?.second_player + " (second player)");
        
        
            const setupContainer = this.container.querySelector('#player-setup-container');
            if (setupContainer) {
                setupContainer.classList.add('animate-fade-out');
                setTimeout(() => {
                    if (setupContainer) setupContainer.innerHTML = '';
                    this.initializeGame(actual_match?.first_player, actual_match?.second_player);;
                }, 300);
            } else {
                this.initializeGame(actual_match?.first_player, actual_match?.second_player);;
            }

            
            
            
            // this.initializeGame(actual_match?.first_player, actual_match?.second_player);
        }
        else
        {
            alert("No 1v1 local match available");
        }
        

    }

    // Génère les prochains matchs 1v1 en local et met tout ca dans un tableau
    private generateRound()
    {
        const new_players_list : users_local[] = [];
        let nb_players = 0;
        const new_matchs_rounds : matchs_round_type[] = [];

        // Je récupère tous les joueurs qui n'ont pas encore été éliminés
        for (const player_list of this.players_list)
        {
            if (player_list.eliminated == false)
            {
                new_players_list.push(player_list);
                nb_players++;
            }
        }

        // J'insert tous les nouveaux matchs 1v1 pour le nouveau round dans un tableau temporaire
        let id_for = 1;
        for (let i = 0; i < nb_players; i+=2)
        {
            new_matchs_rounds.push({id:id_for,first_player: new_players_list[i].username, second_player: new_players_list[i + 1].username, finished:false, winner: null});
            id_for++;
        }

        // Je remplace le tableau matchs_round de la classe par le nouveau
        this.matchs_rounds = new_matchs_rounds;
        console.log(this.matchs_rounds);

        // Affiche l'ordre des matchs 1v1 pour le nouveau round
        // let i = 1;
        // alert("Order of the round");
        // for (const round of this.matchs_rounds)
        // {
        //     alert(`${i}) : ${round.first_player} (first player) VS ${round.second_player} (second player)`);
        //     i++;
        // }
    }

    private initializeGame(player1: string, player2: string): void {
        const pongContainer = this.container.querySelector('#pong-container');
        if (!pongContainer) return;

        pongContainer.innerHTML = '';
        pongContainer.classList.remove('hidden');
        pongContainer.classList.add('animate-scale-in');

        // Add level indicator for local mode
        const levelIndicator = document.createElement('div');
        levelIndicator.className = 'mb-4 text-center animate-scale-in w-full';
        
        const levelTitle = document.createElement('h2');
        levelTitle.className = 'text-2xl font-cyber text-neon-pink mb-1';
        levelTitle.innerHTML = `MODE: <span class="text-neon-cyan">LOCAL MULTIPLAYER</span>`;
        
        const divider = document.createElement('div');
        divider.className = 'h-0.5 w-24 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto my-2';
        
        const controlsInfo = document.createElement('p');
        controlsInfo.className = 'text-gray-300 font-tech text-sm mt-2';
        controlsInfo.textContent = tournamentLocalPong.TextObject.Controls;
        
        levelIndicator.appendChild(levelTitle);
        levelIndicator.appendChild(divider);
        levelIndicator.appendChild(controlsInfo);
        pongContainer.appendChild(levelIndicator);

        // Add game rules
        const gameRules = createGameRules('local');
        pongContainer.appendChild(gameRules);

        const { wrapper: canvasWrapper, inner: canvasInner } = createCanvasWrapper();

        // Reset game end flag
        this.gameEndedNaturally = false;

        this.pongComponent = new PongComponent(player1, player2, {
            onGameEnd: (winner: string) => {
                this.gameEndedNaturally = true;
                this.handleGameEnd(winner, player1, player2);
            }
        });
        if (this.pongComponent) {
            canvasInner.appendChild(this.pongComponent.render());
        }
        
        canvasWrapper.appendChild(canvasInner);
        pongContainer.appendChild(canvasWrapper);
        
    }
    // Gère la fin du match en générant de nouveaux matchs ou en affichant le résultat si le tournoi est fini
    private handleNextGame(winner: string, player1: string, player2: string) : boolean
    {
        // Je met a jour players_list pour indiquer qui a perdu
        let loser : string | null = null;
        for (const match_for of this.matchs_rounds)
        {
            if(match_for.first_player == winner)
            {
                loser = match_for.second_player;
                break;
            }
            else if (match_for.second_player == winner)
            {
                loser = match_for.first_player;
                break;
            }
        }
        if (loser)
        {
            for (let i = 0; i < this.players_list.length; i++)
            {
                if (loser == this.players_list[i].username)
                {
                    this.players_list[i].eliminated = true;
                }
            }
        }

        // Je met a jour matchs_rounds pour indiquer que le match est fini ainsi que le vainqueur
        for (let i = 0; i < this.matchs_rounds.length; i++)
        {
            if(this.matchs_rounds[i].first_player == winner || this.matchs_rounds[i].second_player == winner)
            {
                this.matchs_rounds[i].finished = true;
                this.matchs_rounds[i].winner = winner;
            }
        }



        // alert("The 1v1 local match ended, a new match will be generated. THE WINNER IS : " + winner);

        // Je vérifie si tous les matchs du round ne sont pas finis
        let finished_round = true;
        for (const match_for of this.matchs_rounds)
        {
            if(match_for.finished == false)
            {
                // Il y a encore des matchs pour ce round : je lance le prochain match
                finished_round = false;
                // alert("Lancement du prochain match 1v1");
                // this.launchMatch();
                return true;
            }
        }

        // Je génère et lance le prochain round si il y en a un prochain SINON arrete le tournoi
        if (finished_round)
        {
            // Je compte le nombre de joueurs restants
            let players_available = 0;
            for (const player_check of this.players_list)
            {
                if (player_check.eliminated == false)
                {
                    players_available++;
                }
            }
            if (players_available >= 2)
            {
                // A FAIRE : afficher les prochains matchs du round ET afficher l'ordre du jeu
                this.generateRound();
                // this.launchMatch();
                return true;
            }
            else
            {
                // alert("The tournament is finished ! The winner is " + winner);
                return false;
            }
        }
        else
        {
            return true;
        }
    }

    private handleGameEnd(winner: string, player1: string, player2: string): void {
        if (!this.gameEndedNaturally) {
            return;
        }

        const pongContainer = this.container.querySelector('#pong-container');
        if (!pongContainer) return;

        // const endGameScreen = createEndGameScreen(
        //     winner,
        //     () => {
        //         pongContainer.removeChild(endGameScreen);
        //         this.initializeGame(player1, player2);
        //     },
        //     () => {
        //         pongContainer.removeChild(endGameScreen);
        //         this.router?.navigate('/dashboard');
        //     }
        // );
        
        // pongContainer.appendChild(endGameScreen);



        // this.handleNextGame(winner, player1, player2);
        if (this.handleNextGame(winner, player1, player2))
        {
            // Il y aura un prochain match

            // Je vérifie si c'est le début d'un nouveau round
            let new_round = true;
            for (const match_for of this.matchs_rounds)
            {
                if(match_for.finished == true)
                {
                    new_round = false;
                    break;
                }
            }
            if (new_round)
            {
                // C'est un nouveau round ET il y a un nouveau match
                this.showInfosGame();
                setTimeout(() => {this.launchMatch()}, 5000);
            }
            else
            {
                // Ce n'est pas un nouveau round ET il y a un match au moins avant de finir le round
                this.showNextMatch();
                setTimeout(() => {this.launchMatch()}, 5000);
            }
        }
        else
        {
            // C'est la fin du tournoi : il ne reste qu'un seul joueur
            this.showWinner();
        }
        return ;

    }
}

export default tournamentLocalPong;