FROM mysql:8.0

COPY schema.sql /docker-entrypoint-initdb.d/01_schema.sql
COPY seeds/members_import.sql /docker-entrypoint-initdb.d/02_seeds.sql

# Fly volumes contain lost+found, so the datadir must be a subfolder
CMD ["mysqld", "--datadir=/data/mysql", "--default-authentication-plugin=mysql_native_password"]
