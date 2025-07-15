const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/index-CspSaxt6.js","assets/index-D3Eed0Yt.css"])))=>i.map(i=>d[i]);
var g=Object.defineProperty;var f=(s,i,e)=>i in s?g(s,i,{enumerable:!0,configurable:!0,writable:!0,value:e}):s[i]=e;var c=(s,i,e)=>f(s,typeof i!="symbol"?i+"":i,e);import{B as E,s as C,c as w,a as S,b as L,_ as T,d as k}from"./index-CspSaxt6.js";const r=class r extends E{constructor(e="local-pong",t){super(e,t);c(this,"gameEndedNaturally",!1)}async render(){this.container.innerHTML="",await super.setupHeaderListeners(),this.setupKeyHandlers();const e=await this.createSidebar(),t=document.createElement("div");return t.className="min-h-screen pt-16 relative overflow-hidden flex flex-row bg-cyber-dark",t.innerHTML=`
			${e}
			
			<!-- Main Content -->
			<main class="flex-1 flex flex-col relative">
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
				
				<!-- Header Section -->
				<div class="relative z-10 text-center pt-8 pb-4">
					<h1 class="text-4xl font-cyber text-neon-pink animate-glow-pulse mb-4 tracking-wider">${r.TextObject.MainTitle}</h1>
					<div class="h-1 w-32 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto mb-4"></div>
					<p class="text-neon-cyan font-cyber text-xl">${r.TextObject.Subtitle}</p>
				</div>

				<!-- Game Mode Selection -->
				<div id="mode-selection" class="relative z-10 flex-1 px-8 pb-8">
					<div class="max-w-4xl mx-auto">
						<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
							<!-- Local Game Section -->
							<div class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border-2 border-neon-cyan/40 shadow-lg shadow-neon-cyan/20">
								<h2 class="text-3xl font-cyber text-neon-cyan mb-6 text-center">LOCAL GAME</h2>
								<div class="space-y-4">
									<div>
										<label class="block text-neon-cyan font-tech text-sm mb-2">Player 1 Name</label>
										<input type="text" id="player1" class="w-full bg-cyber-dark border-2 border-neon-cyan/30 text-white px-4 py-3 rounded font-tech" placeholder="Enter Player 1 name" required>
									</div>
									<div>
										<label class="block text-neon-cyan font-tech text-sm mb-2">Player 2 Name</label>
										<input type="text" id="player2" class="w-full bg-cyber-dark border-2 border-neon-cyan/30 text-white px-4 py-3 rounded font-tech" placeholder="Enter Player 2 name" required>
									</div>
									<div class="text-center text-gray-300 font-tech text-sm mb-4">
										${r.TextObject.Controls}
									</div>
									<button id="start-local-game" class="w-full bg-gradient-to-r from-neon-cyan to-neon-pink text-white font-cyber px-6 py-3 rounded-lg text-xl hover:shadow-lg hover:shadow-neon-cyan/50 transition-all duration-300">${r.TextObject.StartGame}</button>
								</div>
							</div>

							<!-- Local Tournament Section -->
							<div class="bg-cyber-darker/90 backdrop-blur-md p-8 rounded-lg border-2 border-neon-pink/40 shadow-lg shadow-neon-pink/20">
								<h2 class="text-3xl font-cyber text-neon-pink mb-6 text-center">LOCAL TOURNAMENT</h2>
								<div class="space-y-4">
									<div class="text-center mb-6">
										<div class="text-6xl mb-4">🏆</div>
										<p class="text-white font-tech text-lg mb-4">Compete in a local tournament!</p>
									</div>
									<button id="start-tournament" class="w-full bg-gradient-to-r from-neon-pink to-neon-cyan text-white font-cyber px-6 py-3 rounded-lg text-xl hover:shadow-lg hover:shadow-neon-pink/50 transition-all duration-300">START TOURNAMENT</button>
								</div>
								<div class="mt-4 pt-4 border-t border-neon-pink/20">
									<button id="return-dashboard" class="w-full bg-cyber-dark border-2 border-gray-500/50 text-gray-400 font-cyber px-6 py-2 rounded hover:border-gray-500 hover:shadow-lg hover:shadow-gray-500/20 transition-all duration-300">${r.TextObject.ReturnHome}</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				<!-- Game Container (hidden by default) -->
				<div id="pong-container" class="hidden relative z-10 flex-1 px-8 pb-8">
					<div class="max-w-5xl mx-auto cyber-border relative w-full flex flex-col items-center"></div>
				</div>
			</main>
		`,this.container.appendChild(t),this.setupEventListeners(),await super.setupSidebarListeners(),this.container}setupEventListeners(){const e=this.container.querySelector("#start-local-game");e==null||e.addEventListener("click",()=>this.handleLocalGameStart());const t=this.container.querySelector("#start-tournament");t==null||t.addEventListener("click",()=>{var n;(n=this.router)==null||n.navigate("/game/localTournament")});const a=this.container.querySelector("#return-dashboard");a==null||a.addEventListener("click",()=>{var n;(n=this.router)==null||n.navigate("/dashboard")})}handleLocalGameStart(){const e=this.container.querySelector("#player1"),t=this.container.querySelector("#player2");if(!(e!=null&&e.value.trim())||!(t!=null&&t.value.trim())){C("Please enter both player names!","error");return}const a=e.value.trim(),n=t.value.trim();this.startGame(a,n)}showModeSelection(){this.pongComponent&&(this.pongComponent=null);const e=this.container.querySelector("#pong-container"),t=this.container.querySelector("#mode-selection");e&&t&&(e.classList.add("animate-fade-out"),setTimeout(()=>{e.classList.add("hidden");const a=e.querySelector("div");a&&(a.innerHTML=""),t.classList.remove("hidden"),t.classList.add("animate-scale-in");const n=this.container.querySelector("#player1"),o=this.container.querySelector("#player2");n&&(n.value=""),o&&(o.value="")},300))}handleGameEnd(e,t,a){if(!this.gameEndedNaturally)return;const n=this.container.querySelector("#pong-container > div");if(!n)return;const o=w(e,()=>{n.removeChild(o),this.initializeGame(t,a)},()=>{n.removeChild(o),this.showModeSelection()});n.appendChild(o)}startGame(e,t){const a=this.container.querySelector("#mode-selection"),n=this.container.querySelector("#pong-container");a&&n?(a.classList.add("animate-fade-out"),setTimeout(()=>{a.classList.add("hidden"),n.classList.remove("hidden"),n.classList.add("animate-scale-in"),this.initializeGame(e,t)},300)):this.initializeGame(e,t)}async initializeGame(e,t){const a=this.container.querySelector("#pong-container > div");if(!a)return;a.innerHTML="";const n=document.createElement("div");n.className="mb-4 text-center animate-scale-in w-full";const o=document.createElement("h2");o.className="text-2xl font-cyber text-neon-pink mb-1",o.innerHTML='MODE: <span class="text-neon-cyan">LOCAL MULTIPLAYER</span>';const p=document.createElement("div");p.className="h-0.5 w-24 bg-gradient-to-r from-neon-pink to-neon-cyan mx-auto my-2";const l=document.createElement("p");l.className="text-gray-300 font-tech text-sm mt-2",l.textContent=r.TextObject.Controls,n.appendChild(o),n.appendChild(p),n.appendChild(l),a.appendChild(n);const u=S("local");a.appendChild(u);const{wrapper:m,inner:h}=L();this.gameEndedNaturally=!1;const{default:v}=await T(async()=>{const{default:d}=await import("./index-CspSaxt6.js").then(x=>x.p);return{default:d}},__vite__mapDeps([0,1]));this.pongComponent=new v(e,t,{onGameEnd:d=>{this.gameEndedNaturally=!0,this.handleGameEnd(d,e,t)}}),this.pongComponent&&h.appendChild(this.pongComponent.render()),m.appendChild(h),a.appendChild(m);const y=k([{id:"restart-btn",text:"RESTART",type:"primary",onClick:()=>this.initializeGame(e,t)}]);a.appendChild(y)}};c(r,"TextObject",{MainTitle:"LOCAL PONG",Subtitle:"CHALLENGE YOUR FRIEND",EnterNames:"ENTER PLAYER NAMES",ChooseChallengers:"CHOOSE YOUR CHALLENGERS",StartGame:"START GAME",ReturnHome:"RETURN HOME",Controls:"PLAYER 1: W/S KEYS | PLAYER 2: UP/DOWN ARROWS"});let b=r;export{b as default};
