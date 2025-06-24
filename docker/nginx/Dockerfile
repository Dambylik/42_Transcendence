FROM nginx:stable

RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /etc/nginx/certs

RUN openssl req -x509 -nodes -days 3650 -newkey rsa:2048 \
    -keyout /etc/nginx/certs/server.key \
    -out /etc/nginx/certs/server.crt \
    -subj "/C=FR/ST=Paris/L=Paris/O=42/CN=localhost" && \
    chmod 600 /etc/nginx/certs/server.key && \
    chmod 644 /etc/nginx/certs/server.crt

# Les ports utilisés
EXPOSE 80
EXPOSE 443

# Config
COPY nginx.conf /etc/nginx/nginx.conf

# Lance NGINX (livre les fichiers front end et redirige les requetes API vers le backend)
CMD ["nginx", "-g", "daemon off;"]