const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/connect4-BbXMBGIx.js","assets/index-CspSaxt6.js","assets/index-D3Eed0Yt.css"])))=>i.map(i=>d[i]);
var h=Object.defineProperty;var f=(o,e,t)=>e in o?h(o,e,{enumerable:!0,configurable:!0,writable:!0,value:t}):o[e]=t;var m=(o,e,t)=>f(o,typeof e!="symbol"?e+"":e,t);import{P as p,_ as y}from"./index-CspSaxt6.js";import{c as v}from"./connect4local-C1Y4Ok6J.js";class g extends p{constructor(e,t){super(e,t)}async render(){this.container.innerHTML="",await super.setupHeaderListeners();const e=await super.createSidebar(),t=document.createElement("div");return t.className="min-h-screen pt-4 relative overflow-hidden flex flex-row bg-cyber-dark",t.innerHTML=`
      ${e}
      <div class="absolute inset-0 z-0">
          <img src="${v}" alt="Connect 4 Local Background" 
               class="absolute inset-0 w-full h-full object-cover opacity-50" />
          <div class="absolute inset-0 bg-black bg-opacity-10"></div>
      </div>

      <!-- Main Content -->
      <main class="flex-1 flex flex-col">
        <div class="relative z-10 min-h-screen flex flex-col items-center justify-start px-4 pt-24 md:pt-32">
          <!-- Title -->
          <h1 class="font-cyber text-6xl md:text-8xl font-bold mb-4 text-center mt-12">
            <span class="text-amber-400 animate-glow-pulse">LET'S PLAY !</span> <br/>
            <span class="text-orange-400">LOCAL CONNECT 4<br/></span>
          </h1>


          <!-- Username form with dashboard return -->
          <div id="username-form" class="mt-8 text-center text-white inset-0 z-0">        
            <form class="flex flex-col gap-4 max-w-sm mx-auto">
              <input type="text" id="player1" placeholder="Player 1 Username" class="p-3 rounded bg-gray-800 text-white border border-amber-500/50 focus:border-amber-400 focus:outline-none" required />
              <input type="text" id="player2" placeholder="Player 2 Username" class="p-3 rounded bg-gray-800 text-white border border-orange-500/50 focus:border-orange-400 focus:outline-none" required />
              <button type="submit" class="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 transition rounded py-3 font-bold text-white shadow-lg">
                START CONNECT 4 GAME
              </button>
            </form>
            <button id="dashboard-btn" class="mt-6 bg-neon-cyan text-black font-cyber px-6 py-3 rounded shadow-lg hover:bg-cyan-400 transition text-xl">
              ← Back to Connect4 Dashboard
            </button>
          </div>

          <!-- Connect4 container -->
          <div id="connect4-container" class="mt-8 hidden"></div>
          
          <!-- Return to menu button -->
          <div id="return-menu" class="mt-4 hidden">
            <button id="return-btn" class="bg-gray-700 hover:bg-gray-600 transition rounded py-2 px-4 font-bold text-white">
              Return to Menu
            </button>
          </div>
        </div>
      </main>
    `,this.container.appendChild(t),this.container.querySelector("#username-form form").addEventListener("submit",d=>{d.preventDefault();const n=this.container.querySelector("#player1"),r=this.container.querySelector("#player2");if(!(n!=null&&n.value.trim())||!(r!=null&&r.value.trim())){alert("Please enter both usernames!");return}const s=n.value.trim(),l=r.value.trim(),i=this.container.querySelector("#username-form"),a=this.container.querySelector("#connect4-container"),u=this.container.querySelector("#return-menu");i&&a&&u&&(i.classList.add("hidden"),a.classList.remove("hidden"),u.classList.remove("hidden"),y(async()=>{const{default:c}=await import("./connect4-BbXMBGIx.js");return{default:c}},__vite__mapDeps([0,1,2])).then(({default:c})=>{const b=new c(s,l);a.appendChild(b.render())}).catch(c=>{console.error("Error loading Connect4 component:",c),alert("Error loading Connect4 game")}))}),this.container.addEventListener("click",d=>{const n=d.target;if(n.id==="return-btn"){const r=this.container.querySelector("#username-form"),s=this.container.querySelector("#connect4-container"),l=this.container.querySelector("#return-menu");if(r&&s&&l){r.classList.remove("hidden"),s.classList.add("hidden"),l.classList.add("hidden"),s.innerHTML="";const i=this.container.querySelector("#player1"),a=this.container.querySelector("#player2");i&&(i.value=""),a&&(a.value="")}}n.id==="dashboard-btn"&&(this.router?this.router.navigate("/game/connect4_dashboard"):window.location.href="/game/connect4_dashboard")}),await super.setupSidebarListeners(),this.container}}m(g,"TextObject",{ReturnHome:"RETURN HOME"});export{g as default};
