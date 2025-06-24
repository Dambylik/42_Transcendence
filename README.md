# DEVELOPEMENT (new)

## Nouveaux PORTS et URL pour dev
http://localhost:5173/ pour tester vite fait vite
https://localhost:4430/ pour les vrais tests avec HTTPS (fetch vers API par ex) et le push final

## A savoir
http://localhost:5173/ pour que les changements soit toujours appliqués sans refaire de docker compose
Les requetes fetch (en JS / TS) vers https://localhost/api (sur port 443) fonctionnent normalement, elles seront redirigées par nginx qui redirigera vesr le backend node.js fastify

Les fichiers du front (vite) sont a mettre dans : volumes/src_front

Les fichiers du back (Fastify) sont a mettre dans : volumes/src_back

Vous pouvez aussi accéder a localhost sur : https://localhost/ mais apres avoir compilé le ts avec vite a l'aide de conteneur de prod

Le Google Sign In ne fonctionne qu'en mode prod (make up) a cause d'un probleme de variable d'environnement du coté de Vite

## Comment démarrer et stopper l'environnement de dev
pour lancer l'environnement de developpement : make up-dev

pour arreter l'environnement de developpement : make down-dev

## Si vous souhaitez remplacer tout le code de test que j'ai mis dans les volumes :
Il faut créer l'environnement avec vite (pour le front end) puis écraser tous les fichiers dans volumes/src_front
Pareil pour le back end node.js (fastify) mais dans volumes/src_back

## Notes importantes

Pour faire appel au backend (API), on peut lancer les conteneurs en mode dev. Ensuite aller sur http://localhost:5173/ (temps réel).
Puis faire des requetes au backend (sur le port 443 et non 5173) https://localhost/api/2 (par ex). http://localhost:5173/api/2 ne marchera pas ! Faites attention aux ports.

Dans certains cas, vous aurez besoin d'accéder au site via HTTPS : relancez avec make down-dev puis make up pour avoir la version finale


## La bonne méthode pour travailler sur le front-end :
- Je fais un make up-dev
- Je vais grace a mon shell dans le dossier volume pour le src_front
- Je code comme je le souhaite :
	- Soit j'écris du code simple et je regarde directement le résultat a l'adresse : http://localhost:5173/
	- Soit je veux tester mon code pour voir s'il n'y a pas d'erreur TS : npx tsc -- noEmit
	- Si tout est bon je peux tester mon code tel qu'il sera lors de l'envoi final (utile pour les requetes fetch, appel a un API et sur HTTPS) : npm run build



docker ps
docker exec -it f8f7eec3d1d7 bash

f8f7eec3d1d7   transcendence-front_end_vite_new
npm run build