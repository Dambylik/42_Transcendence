all : up

up :
	docker compose -f docker-compose.yml up --build -d

down :
	docker compose -f docker-compose.yml down

up-dev :
	docker compose -f docker-compose.dev.yml up --build -d

down-dev :
	docker compose -f docker-compose.dev.yml down



fullclean : down
	docker system prune -a -f