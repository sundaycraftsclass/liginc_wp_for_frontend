# Makefile
dbimport:
	docker exec -i "$$(docker-compose ps -q db)" sh -c 'exec mysql -uroot -p"$$MYSQL_ROOT_PASSWORD"' < ./dump.sql
dbdump:
	docker exec "$$(docker-compose ps -q db)" sh -c 'exec mysqldump --all-databases -uroot -p"$$MYSQL_ROOT_PASSWORD"' > ./dump.sql

