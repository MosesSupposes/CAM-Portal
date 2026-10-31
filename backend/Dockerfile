FROM php:8.3-cli-alpine

RUN docker-php-ext-install pdo pdo_mysql

WORKDIR /app
COPY . /app

# Render injects PORT
CMD ["sh", "-c", "php -S 0.0.0.0:${PORT:-10000} server.php"]
