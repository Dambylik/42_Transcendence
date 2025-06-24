# Étape de développement
FROM node:24

# Créer un dossier de travail dans le conteneur
WORKDIR /app

# Ancien
# COPY files/package*.json ./
# RUN npm install
# COPY ./files/ ./

# Port de Vite
EXPOSE 5173

# Lancer Vite en mode dev
# CMD ["npm", "run", "dev", "--", "--host"]

# Pour le push final (prod)
CMD ["npm", "run", "build"]
