// // JUSTE POUR TEST
// // ID client OAuth 2.0 obtenu dans la console Google Cloud
// // const CLIENT_ID = 'XXX';
// const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
// // alert(CLIENT_ID);

// function handleCredentialResponse(response: google.accounts.id.CredentialResponse) { // J'ai besoin de définir un template CredentialResponse dans un d.ts pour indiquer ce qu'il contient
//   console.log('JWT reçu :', response.credential);

//       // On envoie le token google (le JWT) au backend fastify pour pouvoir récupérer les infos sur l'utilisateur
//       fetch('/api/auth/google', {
//         method: 'POST',
//         headers: {'Content-Type': 'application/json'},
//         body: JSON.stringify({ id_token: response.credential })
//       })
//       .then(res => res.json())
//       .then(data => {
//         if (data.success == true)
//         {
//             alert("You have been logged in successfully with Google");
//         }
//         else
//         {
//             alert("Please try to reconnect to Google again");
//         }
//         console.log('Utilisateur connecté', data);
//       });
// }
// //// TOUT le code TS est dans google.d.ts (indique de quel type est client_id par ex)
// window.onload = () => {
//   google.accounts.id.initialize({
//     client_id: CLIENT_ID,
//     callback: handleCredentialResponse,
//   });

//   google.accounts.id.renderButton(
//     document.getElementById('buttonDivGoogle')!,
//     {
//       theme: 'outline',
//       size: 'large',
//     }
//   );

//   // Optionnel : demander une connexion automatique
//   // google.accounts.id.prompt();
// };