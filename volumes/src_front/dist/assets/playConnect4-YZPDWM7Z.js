const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/connect4-BbXMBGIx.js","assets/index-CspSaxt6.js","assets/index-D3Eed0Yt.css"])))=>i.map(i=>d[i]);
var m=Object.defineProperty;var u=(c,a,e)=>a in c?m(c,a,{enumerable:!0,configurable:!0,writable:!0,value:e}):c[a]=e;var l=(c,a,e)=>u(c,typeof a!="symbol"?a+"":a,e);import{P as g,_ as p}from"./index-CspSaxt6.js";class f extends g{constructor(e,t){super(e,t);l(this,"connect4Component",null);l(this,"gameSocket",null);l(this,"isPlayer1",!0)}async render(){var t;this.container.innerHTML="",await super.setupHeaderListeners();const e=document.createElement("div");return e.className="min-h-screen pt-16 relative overflow-hidden flex flex-row bg-cyber-dark",e.innerHTML=`
      ${await super.createSidebar()}
      
      <!-- Main Content -->
      <main class="flex-1 flex flex-col">
        <!-- Background Effects -->
        <div class="absolute inset-0 z-0">
          <div class="absolute inset-0 bg-grid-overlay opacity-20"></div>
          <div class="absolute inset-0 scanlines"></div>
          <!-- Cyber borders -->
          <div class="absolute top-8 left-8 w-16 h-16 border-l-2 border-t-2 border-neon-pink opacity-50"></div>
          <div class="absolute top-8 right-8 w-16 h-16 border-r-2 border-t-2 border-neon-cyan opacity-50"></div>
          <div class="absolute bottom-8 left-8 w-16 h-16 border-l-2 border-b-2 border-neon-cyan opacity-50"></div>
          <div class="absolute bottom-8 right-8 w-16 h-16 border-r-2 border-b-2 border-neon-pink opacity-50"></div>
        </div>
        
        <div id="mainContainer" class="container mx-auto flex items-center justify-center min-h-[calc(100vh-4rem)] px-4 relative z-10">
          <div id="gameDiv" class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border border-neon-pink/30 shadow-lg shadow-neon-pink/10 text-center">
            
            <!-- Loading View -->
            <div id="divLoading">
              <div id="gameLoading" class="text-2xl font-cyber text-neon-cyan mb-4">Waiting for the second player...</div>
              <div class="animate-spin w-8 h-8 border-4 border-neon-cyan border-t-transparent rounded-full mx-auto mb-4"></div>
              <br>
            </div>

            <!-- Finished View -->
            <div id="divFinished">
              <div id="divMessage"></div>
              <br>
              <div id="divJoinRoom" class="bg-neon-cyan text-black px-4 py-2 rounded text-xl cursor-pointer hover:bg-cyan-400 transition">
                <a data-route="/game/connect4_online" href="/game/connect4_online" id="joinRoomInGame">Go back to the tournament</a>
              </div>
            </div>

            <!-- Game Started View -->
            <div id="divStarted">
              <div id="connect4-container" class="mt-4 cyber-border relative w-full flex-col items-center"></div>
              <div class="mt-4">
                <div class="bg-red-600 text-white text-xs px-4 py-2 rounded">
                  <button id="buttonStop">Give up (lose)</button>
                </div>
              </div>
            </div>

            <!-- Return to Room View -->
            <div id="divReturnRoom">
              <h1 class="text-2xl">You can't exit and go back to a 1v1 match. Eliminated</h1>
              <p>You must wait for the next player to join the 1v1 match to continue</p>
            </div>

            <!-- Can't Join View -->
            <div id="divCantJoin">
              <h1 class="text-2xl">You can't access this match. Only one page per browser or no match available for you</h1>
            </div>

          </div>
        </div>
      </main>
    `,this.container.appendChild(e),await this.checkIfTournamentFinished()||await this.checkIfTournamentFinishedWithError()?((t=this.router)==null||t.navigate("/game/connect4_online"),this.container):(await this.hasSessionStorage()?await this.checkIfAlreadyConnected()?(alert("You cannot leave and return to a Connect4 match. You have been eliminated."),await this.updateGaveUp(),await this.showReturnRoom()):await this.join_match():await this.showCantJoin(),await this.stopClickEvent(),await super.setupSidebarListeners(),this.container)}async hasSessionStorage(){const e=sessionStorage.getItem("room"),t=sessionStorage.getItem("match_id");return e!==null&&t!==null}async join_match(){const e=sessionStorage.getItem("match_id");e!==null?await this.connect_match_ws(Number(e)):(console.error("Error: no match ID in sessionStorage"),await this.showCantJoin())}async connect_match_ws(e){var t;try{console.log(`Connecting to Connect4 match WebSocket for match ${e}`),this.gameSocket=new WebSocket(`wss://localhost:4430/api/ws/play/connect4/${e}?game=connect4`),this.gameSocket.addEventListener("open",()=>{console.log("Connected to Connect4 match WebSocket"),this.showLoading(),this.gameSocket&&(console.log("Sending connection message to server"),this.gameSocket.send(JSON.stringify({type:"connection",gameType:"connect4"})))}),this.gameSocket.addEventListener("message",n=>{const o=JSON.parse(n.data);if(console.log("Received WebSocket message:",o),o.gameType&&o.gameType!=="connect4"){console.warn("Ignoring message for incorrect game type:",o.gameType);return}this.handleWebSocketMessage(o)}),this.gameSocket.addEventListener("close",()=>{console.log("Connect4 match WebSocket disconnected")}),this.gameSocket.addEventListener("error",n=>{var o;console.error("Connect4 match WebSocket error:",n),alert("WebSocket connection error. Please try again."),(o=this.router)==null||o.navigate("/game/connect4_online")}),setInterval(()=>{this.gameSocket&&this.gameSocket.readyState===WebSocket.OPEN&&this.gameSocket.send(JSON.stringify({type:"ping"}))},5e3)}catch(n){console.error("Failed to connect to Connect4 match:",n),alert("Failed to connect to the match. Please try again."),(t=this.router)==null||t.navigate("/game/connect4_online")}}handleWebSocketMessage(e){if(console.log("Received Connect4 WebSocket message:",e),e.error){console.error("WebSocket error:",e.error),alert(`Game error: ${e.error}`);return}if(e.type==="ball_update"){console.warn("Ignoring Pong message in Connect4 game");return}switch(e.type){case"connection":e.message==="both_players"?console.log("Both players connected!"):(console.log("Connected to match, waiting for second player"),this.showLoading());break;case"game_start":console.log("Game starting with players:",e.player1,"vs",e.player2),this.isPlayer1=e.isPlayer1,this.initializeConnect4Game(e);break;case"move":this.connect4Component&&e.board&&(console.log("Received move update:",e),this.connect4Component.currentPlayer=e.currentPlayer,e.lastMove&&e.lastMove.row!==void 0&&e.lastMove.column!==void 0&&e.lastMove.player!==void 0?this.connect4Component.addSingleDisc(e.lastMove.row,e.lastMove.column,e.lastMove.player):this.connect4Component.updateGameState(e.board,e.currentPlayer));break;case"game_end":console.log("Game ended, winner:",e.winner);const t=e.winner===1?this.isPlayer1?"YOU":"OPPONENT":this.isPlayer1?"OPPONENT":"YOU";this.handleGameEnd(t);break;default:console.log("Unknown message type:",e.type,e)}}async initializeConnect4Game(e){var s,h;await this.showGame();const t=this.container.querySelector("#connect4-container");if(!t){console.error("Connect4 container not found");return}t.innerHTML="",console.log(`Initializing Connect4 game with isPlayer1: ${e.isPlayer1}`),this.isPlayer1=e.isPlayer1;const n=document.createElement("div");n.className="text-center mb-4";const o=this.isPlayer1?"Player 1 (Red)":"Player 2 (Yellow)";n.innerHTML=`
      <div class="text-neon-cyan font-tech text-lg mb-2">CONNECT4 TOURNAMENT MATCH</div>
      <div class="text-gray-300 font-tech text-sm">
        CLICK COLUMNS TO DROP DISCS
      </div>
      <div class="text-yellow-400 font-tech text-xs mt-2">
        You are ${o}
      </div>
    `,t.appendChild(n);try{const{default:d}=await p(async()=>{const{default:r}=await import("./connect4-BbXMBGIx.js");return{default:r}},__vite__mapDeps([0,1,2]));this.connect4Component=new d(e.player1||"Player 1",e.player2||"Player 2",{onGameEnd:r=>{console.log("Local game ended, winner:",r)}}),this.connect4Component.setMultiplayerCallbacks({onMove:r=>{this.gameSocket&&this.gameSocket.readyState===WebSocket.OPEN&&(console.log("Sending move to server:",r),this.gameSocket.send(JSON.stringify({type:"move",column:r})))}}),t.appendChild(this.connect4Component.render()),console.log("Connect4 game component rendered successfully"),(s=this.gameSocket)==null||s.addEventListener("message",r=>{const i=JSON.parse(r.data);i.type==="move"&&this.connect4Component?i.lastMove&&i.lastMove.row!==void 0&&i.lastMove.column!==void 0&&i.lastMove.player!==void 0?this.connect4Component.addSingleDisc(i.lastMove.row,i.lastMove.column,i.lastMove.player):this.connect4Component.updateGameState(i.board,i.currentPlayer):i.type==="game_end"&&this.connect4Component&&this.connect4Component.showWinner(i.winner)})}catch(d){console.error("Error loading Connect4 component:",d),alert("Error loading Connect4 game. Please try again."),(h=this.router)==null||h.navigate("/game/connect4_online")}}handleGameEnd(e){console.log("Game ended, winner:",e);let t="";typeof e=="string"?t=e:typeof e=="number"?t=e===1?"Player 1":"Player 2":t="Unknown",this.showFinished(t)}async showLoading(){await this.hideAll();const e=this.container.querySelector("#divLoading");e&&(e.style.display="block")}async showGame(){await this.hideAll();const e=this.container.querySelector("#divStarted");e&&(e.style.display="block")}async showFinished(e){await this.hideAll();const t=this.container.querySelector("#divFinished");t&&(t.style.display="block");const n=document.createElement("h1");n.textContent="The winner is "+e;const o=this.container.querySelector("#divMessage");o&&(o.innerHTML="",o.appendChild(n))}async showReturnRoom(){await this.hideAll();const e=this.container.querySelector("#divReturnRoom");e&&(e.style.display="block")}async showCantJoin(){await this.hideAll();const e=this.container.querySelector("#divCantJoin");e&&(e.style.display="block")}async hideAll(){["#divFinished","#divStarted","#divLoading","#divReturnRoom","#divCantJoin"].forEach(t=>{const n=this.container.querySelector(t);n&&(n.style.display="none")})}async checkIfTournamentFinished(){const e=sessionStorage.getItem("room");if(!e)return!1;try{const n=JSON.parse(e).room_id,o=await fetch(`https://localhost:4430/api/tournament_finished/${n}`,{method:"GET",credentials:"include"});if(!o.ok)return!1;const s=await o.json();return s.success&&s.finished}catch{return!1}}async checkIfTournamentFinishedWithError(){const e=sessionStorage.getItem("room");if(!e)return!1;try{const n=JSON.parse(e).room_id,o=await fetch(`https://localhost:4430/api/tournament_finished_with_error/${n}`,{method:"GET",credentials:"include"});if(!o.ok)return!1;const s=await o.json();return s.success&&s.finished}catch{return!1}}async checkIfAlreadyConnected(){const e=sessionStorage.getItem("match_id");if(!e)return!1;try{const t=await fetch(`https://localhost:4430/api/check_connected_to_match/${e}`,{method:"GET",credentials:"include"});return t.ok?(await t.json()).connected===!0?!0:(await fetch(`https://localhost:4430/api/update_connected_to_match/${e}`,{method:"GET",credentials:"include"}),!1):!1}catch{return!1}}async updateGaveUp(){const e=sessionStorage.getItem("match_id");if(e)try{await fetch(`https://localhost:4430/api/update_gave_up/${e}`,{method:"GET",credentials:"include"})}catch(t){console.error("Error updating gave up status:",t)}}async stopClickEvent(){const e=this.container.querySelector("#buttonStop");e&&e.addEventListener("click",async()=>{confirm("Are you sure you want to give up? Your opponent will win automatically.")&&await this.handleAbandonGame()})}async handleAbandonGame(){var t;this.connect4Component&&(this.connect4Component.destroy(),this.connect4Component=null),this.gameSocket&&(this.gameSocket.close(),this.gameSocket=null);const e=sessionStorage.getItem("match_id");if(e)try{(await fetch(`https://localhost:4430/api/stop_match/${e}`,{credentials:"include"})).ok&&alert("You have given up the match. Returning to tournament.")}catch(n){console.error("Error stopping match:",n)}(t=this.router)==null||t.navigate("/game/connect4_online")}destroy(){var e;this.connect4Component&&(this.connect4Component.destroy(),this.connect4Component=null),this.gameSocket&&(this.gameSocket.close(),this.gameSocket=null),(e=super.destroy)==null||e.call(this)}}export{f as default};
