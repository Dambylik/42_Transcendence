var d=Object.defineProperty;var l=(o,r,e)=>r in o?d(o,r,{enumerable:!0,configurable:!0,writable:!0,value:e}):o[r]=e;var i=(o,r,e)=>l(o,typeof r!="symbol"?r+"":r,e);import{P as c}from"./index-CspSaxt6.js";import{c as b}from"./connect4local-C1Y4Ok6J.js";import{c as m}from"./connect4ai-CPyC_wIM.js";const g="/assets/connect4online-q1YAh9SW.png";class u extends c{constructor(e,a){super(e,a);i(this,"gameModes");this.gameModes=[{id:"connect4_local",title:"LOCAL CONNECT 4",description:"CHALLENGE YOUR FRIENDS IN LOCAL MULTIPLAYER CONNECT 4! TAKE TURNS DROPPING YOUR COLORED DISCS AND BE THE FIRST TO CONNECT FOUR IN A ROW. PERFECT FOR STRATEGIC BATTLES WITH FRIENDS SITTING SIDE BY SIDE!",image:b},{id:"connect4_ai",title:"AI CONNECT 4",description:"TEST YOUR STRATEGIC SKILLS AGAINST AN INTELLIGENT AI OPPONENT! THE AI WILL CHALLENGE YOUR TACTICAL THINKING AND FORCE YOU TO PLAN SEVERAL MOVES AHEAD. CAN YOU OUTSMART THE COMPUTER IN THIS CLASSIC STRATEGY GAME?",image:m},{id:"connect4_online",title:"ONLINE CONNECT 4",description:"COMPETE AGAINST PLAYERS FROM AROUND THE WORLD IN ONLINE CONNECT 4 MATCHES! GET MATCHED WITH OPPONENTS OF SIMILAR SKILL LEVEL AND PROVE YOUR STRATEGIC SUPERIORITY IN THIS TIMELESS GAME OF TACTICS!",image:g}]}async render(){this.container.innerHTML="",await super.setupHeaderListeners();const e=await super.createSidebar(),a=document.createElement("div");return a.className="min-h-screen pt-4 relative overflow-hidden flex flex-row bg-cyber-dark",a.innerHTML=`
      ${e}
      <!-- Main Content -->
      <main class="flex-1 flex flex-col">
        <!-- Header Section -->
        <div class="p-4 pb-2">
          <div class="flex flex-col items-center mb-6">
            <h1 class="text-4xl font-cyber text-amber-400 animate-glow-pulse mb-2 tracking-wider">CONNECT 4 DASHBOARD</h1>
            <div class="h-1 w-48 bg-gradient-to-r from-amber-600 to-orange-600 mx-auto"></div>
          </div>
        </div>

        <!-- Strategy Games Section -->
        <div class="flex-1 px-8 pb-8">
          <div class="mb-12">
            <div class="flex items-center mb-8">
              <div class="h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent flex-1"></div>
              <h2 class="text-2xl font-cyber text-amber-400 mx-6 tracking-wider">STRATEGY GAME MODES</h2>
              <div class="h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent flex-1"></div>
            </div>
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              ${this.renderConnect4GameCards()}
            </div>
          </div>
        </div>
      </main>
    `,this.container.appendChild(a),this.setupEventListeners(),await super.setupSidebarListeners(),this.container}renderConnect4GameCards(){return this.gameModes.map((e,a)=>{const t={connect4_local:{border:"border-emerald-500/50",glow:"hover:shadow-emerald-500/50",accent:"border-emerald-400/80"},connect4_ai:{border:"border-violet-500/50",glow:"hover:shadow-violet-500/50",accent:"border-violet-400/80"},connect4_online:{border:"border-sky-500/50",glow:"hover:shadow-sky-500/50",accent:"border-sky-400/80"}}[e.id];return`
        <div class="cyber-panel cursor-pointer transition-all duration-300 hover:scale-105 corner-brackets relative group ${t.border}" data-mode-id="${e.id}">
          <div class="p-6 h-full flex flex-col">
            <!-- Game Mode Visualization -->
            <div class="relative mb-6 h-80 rounded border border-amber-500/40 overflow-hidden">
              
              <!-- Image Background -->
              <img src="${e.image}" alt="${e.title}" class="absolute inset-0 w-full h-full object-cover" />
              
              <!-- Strategy game specific glow effects -->
              <div class="absolute inset-0 bg-gradient-to-t from-amber-600/10 via-transparent to-orange-500/10 pointer-events-none"></div>
              
              <!-- Corner brackets with game-specific colors -->
              <div class="absolute top-2 left-2 w-6 h-6 border-l-2 border-t-2 ${t.accent}"></div>
              <div class="absolute top-2 right-2 w-6 h-6 border-r-2 border-t-2 ${t.accent}"></div>
              <div class="absolute bottom-2 left-2 w-6 h-6 border-l-2 border-b-2 ${t.accent}"></div>
              <div class="absolute bottom-2 right-2 w-6 h-6 border-r-2 border-b-2 ${t.accent}"></div>
            </div>

            <!-- Game Mode Info -->
            <div class="flex-1 flex flex-col">
              <h3 class="text-xl font-cyber font-bold text-amber-400 mb-4 tracking-wider text-center">${e.title}</h3>
              <p class="text-sm text-gray-300 leading-relaxed mb-6 font-tech flex-1 text-center">
                ${e.description}
              </p>

              <!-- Start Button -->
              <a href="/game/${e.id}" class="mt-auto">
                <button 
                  class="w-full bg-gradient-to-r from-amber-600 to-orange-600 text-white font-bold text-lg px-12 py-3 
                        border border-amber-500 hover:shadow-lg ${t.glow}
                        transition-all duration-300 animate-scale-in font-cyber tracking-wider
                        before:absolute before:inset-0 before:bg-gradient-to-r before:from-amber-600/20 before:to-orange-600/20
                        before:opacity-0 hover:before:opacity-100 before:transition-opacity 
                        relative overflow-hidden group start-game-btn rounded-lg"
                  data-game-mode="${e.id}"
                >
                  <span class="relative z-10">START CONNECT 4</span>
                  <div class="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                </button>
              </a>
            </div>
          </div>
        </div>
      `}).join("")}setupEventListeners(){this.container.querySelectorAll("[data-mode-id]").forEach(s=>{s.addEventListener("click",t=>{const n=s.dataset.modeId;t.target.closest(".start-game-btn")||(this.router?this.router.navigate(`/game/${n}`):console.log("Router is not defined in game mode cards."))})}),this.container.querySelectorAll(".start-game-btn").forEach(s=>{s.addEventListener("click",t=>{t.preventDefault();const n=s.dataset.gameMode;this.router?this.router.navigate(`/game/${n}`):console.log("Router is not defined in game buttons.")})}),super.setupSidebarListeners()}}export{u as default};
