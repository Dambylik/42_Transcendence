document.addEventListener("DOMContentLoaded", () => {



function changeRoomPage(in_or_out : string)
{
  if (in_or_out === "in")
  {
    changeRoomPageInformations();
    (document.getElementById('room_in') as HTMLElement).style.display = "block";
    (document.getElementById('room_out') as HTMLElement).style.display = "none";
  }
  else
  {
    (document.getElementById('room_in') as HTMLElement).style.display = "none";
    (document.getElementById('room_out') as HTMLElement).style.display = "block";
  }
}


// Change le nom et l'id de la room dans la page in ainsi que la liste des joueurs
async function changeRoomPageInformations()
{

    const localstorage_room = localStorage.getItem('room');

  if (localstorage_room !== null)
  {

    const localvar = JSON.parse(localstorage_room);

    (document.getElementById('nameRoomNew') as HTMLElement).textContent = (localvar.room_name);
    (document.getElementById('idRoomNew') as HTMLElement).textContent = ("ID : " + localvar.room_id);


    let room_id = localvar.room_id;
    try {
      const response = await fetch('https://localhost:4430/api/rooms_players/' + room_id, {
        method: 'GET',
        credentials: 'include'
      });

      if (!response.ok)
      {
        throw new Error('erreur http : ' + response.status);
      }

      const result = await response.json();

      const players = result.tabl_players;
      (document.getElementById('tablePlayersRoom') as HTMLElement).innerHTML = '';
      let i = 0;
      for (const player of players)
      {

        // Ajoute une ligne dans la table de la liste des joueurs

        const tdTableUsername = document.createElement('td');
        const tdTableRemoveUser = document.createElement('td');
        tdTableUsername.className = "border border-gray-300 px-4 py-2";
        tdTableRemoveUser.className = "text-center text-red-500";
        tdTableUsername.textContent = player.username;
        tdTableRemoveUser.innerHTML = `<button data-id="${player.user_id}" id="reject_player" class="hover:bg-gray-400">X</button>`;
        const lineTable = document.createElement("tr");
        lineTable.appendChild(tdTableUsername);

        if (localvar.admin && i != 0)
        {
          lineTable.appendChild(tdTableRemoveUser);
        }
        (document.getElementById('tablePlayersRoom') as HTMLElement).appendChild(lineTable);
        i++;
      }

      enable_kick_button();

    } catch (err)
    {
      alert("erreur denvoi formulaire create room");
    }
  }
  else
  {
    (document.getElementById('nameRoomNew') as HTMLElement).textContent = ("NULL");
    (document.getElementById('idRoomNew') as HTMLElement).textContent = ("ID : NULL");
  }
}




// Affichage du bon menu pour les rooms
if (localStorage.getItem('room') !== null)
{
  // Je suis dans déja dans une room : je dois afficher la liste des joueurs, le nom de la room et le bouton inviter (si je suis admin)
  const elt = document.getElementById('room_in');
  if(elt)
  {
    elt.style.display = "block";
  }
    changeRoomPageInformations();
}
else
{
  // Je ne suis pas dans une room : j'affiche le contenu pour rejoindre une room ou en créer une
  const elt = document.getElementById('room_out');
  if (elt)
  {
    elt.style.display = "block";
  }
}





function connect_join_room(room_id : number)
{

  // const id_room = val;

  // let room_id = document.getElementById('idRoom').value;


  const socket = new WebSocket("wss://localhost:4430/api/ws/join_room/" + room_id);

  socket.addEventListener('open', ()=> {
    // alert("Connexion WS pour join");
    if (socket.readyState === WebSocket.OPEN)
    {
      // alert("ok");
      // socket.send("hello");
    }

    // Keepalive ping
    setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) socket.send("ping");
    }, 30000);
  });


  // Donnée recue du serveur
  socket.addEventListener('message', (event) =>
  {
    // alert("WS recu du serveur : actualisation de la liste des joueurs");
    changeRoomPageInformations();
    alert(event.data);
        const localstorage_room = localStorage.getItem('room');

      if (localstorage_room !== null)
      {

        const localvar = JSON.parse(localstorage_room);

    alert("mon user id = " + localvar.user_id);

        

        const obj_serv_ws = JSON.parse(event.data);

        alert("obj = " + obj_serv_ws);

        if (obj_serv_ws.success == true && obj_serv_ws.cause == "kick" && Number(obj_serv_ws.id_player) == Number(localvar?.user_id))
        {

          // J'ai été kick de la room
          alert("je dois partir de la room");
          localStorage.removeItem('room');
          changeRoomPage("out");
          
        }


      }
  });

  socket.addEventListener('close', (event) => {
    // Only alert if the close was not a normal navigation/refresh (code !== 1000)
    if (event.code !== 1000) {
      alert("WebSocket disconnected unexpectedly");
    }
    // else: do nothing on normal close (refresh/navigation)
  });

  socket.addEventListener('error', (err) => {
    alert(err);
  });


  // Envoi un message toutes les 1 sec pour éviter la deconnexion et indiquer qu'on est encore en ligne
  setInterval(() => {
    socket.send("ping"); // A DECOMMENTER APRES TEST
  }, 5000);
}

async function join_room_http(room_id : number)
{

  // let room_id = document.getElementById('idRoom').value;
  try {
    const response = await fetch('https://localhost:4430/api/join_room/' + room_id, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok)
    {
      throw new Error('erreur http : ' + response.status);
    }

    const result = await response.json();
    alert("resultat envoi formulaire (join room) : " + JSON.stringify(result));
    return (result);
  } catch (err)
  {
    alert("erreur denvoi formulaire create room");
  }
}

// Rejoint une room
(document.getElementById('buttonJoin') as HTMLElement).addEventListener('click', async () => {


  let roomId = Number((document.getElementById('roomIdJoin') as HTMLInputElement).value);

    // Je rejoins la room créée
    const room = await join_room_http(roomId);
    connect_join_room(roomId);

    // Je stocke le numero de la room dans un localstorage
    localStorage.setItem('room', JSON.stringify({room_id : room.room_id, admin:false, room_name : room.room_name, user_id:room.user_id}));

    // Je change le contenu de la roomPage
    await changeRoomPageInformations();
    changeRoomPage("in");


});

// Crée une room en appuyant sur un bouton
(document.getElementById('buttonCreate') as HTMLElement).addEventListener('click', async () => {
  let roomName : string = (document.getElementById('roomNameCreate') as HTMLInputElement).value;
        try {
          const response = await fetch('https://localhost:4430/api/create_room', {
            method: 'POST',
            headers : {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({name: roomName}),
            credentials: 'include'
          });

          if (!response.ok)
          {
            throw new Error('erreur http : ' + response.status);
          }

          const result = await response.json();
          // alert("envoi reussi create room");

          if (result.success)
          {

            // Je stocke le numero de la room dans un localstorage
            localStorage.setItem('room', JSON.stringify({room_id : result.room_id, admin:true, room_name : result.room_name, user_id:result.user_id}));
            
            // Je rejoins la room créée
            await join_room_http(result.room_id);
            connect_join_room(result.room_id);

            // Je change le contenu de la roomPage
            await changeRoomPageInformations();
            changeRoomPage("in");

          }
          else
          {
            alert("error when creating room");
          }


        } catch (err)
        {
          alert("erreur denvoi formulaire create room");
        }

});



async function kick_player(room_id : number, player_id : number)
{
    try {
    const response = await fetch('https://localhost:4430/api/reject_from_room/' + player_id + '/' + room_id, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok)
    {
      throw new Error('erreur http : ' + response.status);
    }

    const result = await response.json();
    alert("The player has been kicked successfully : " + JSON.stringify(result));
    return (result);
  } catch (err)
  {
    alert("erreur denvoi kick player");
  }

}

// Ajoute les addEventListeners sur les boutons de kick dans la room
async function enable_kick_button()
{
  const buttons = document.querySelectorAll('button[data-id]');
  buttons.forEach(button => {
    button.addEventListener('click', async (event) => {
      const target = event.currentTarget as HTMLButtonElement;
      const id = Number(target.dataset.id);
      alert('Bouton cliqué avec id:'+ id);
        const localstorage_room = localStorage.getItem('room');
        if (localstorage_room !== null)
        {
          const localvar = JSON.parse(localstorage_room);

          const room_id = localvar?.room_id;
          // const user_id = localvar?.user_id;
          // alert("i will kick : roomid : " + room_id + " userid : " + user_id);
          await kick_player(room_id, id);
        }
    });
  });
}


});