# Application Environments

The frontend selects its API with `VITE_API_ENV` (`dev`, `staging`, or `prod`).
Set the matching `VITE_API_URL_DEV`, `VITE_API_URL_STAGING`, or
`VITE_API_URL_PROD` to override that environment's default. These values are
public API addresses, not secrets.

| Command or build mode | Default API | Database |
| --- | --- | --- |
| `cd frontend && npm run dev` | `http://localhost:8000/api/v1` | Local dev MySQL |
| `cd frontend && npm run build` | `https://cam-backend.fly.dev/api/v1` | Production MySQL through `cam-backend` |
| `cd frontend && npm run build:staging` | `https://cam-backend-staging.fly.dev/api/v1` | Separate staging MySQL |

Production defaults to `prod` because Vite's production mode selects that
environment. Development defaults to `dev`. An explicit `VITE_API_ENV` always
takes precedence. All three API URLs are available in every mode, so for example
`VITE_API_ENV=staging npm run build` selects the staging API even though Vite is
building in production mode. Override the corresponding `VITE_API_URL_*` value
to point at a different backend.

## Environment Files

The frontend `.env` files are optional: `frontend/src/api.js` already defines
the API URL defaults, and it selects `dev`, `prod`, or `staging` from the Vite
mode. Keep local `.env` files out of commits unless the team intentionally
chooses to commit public, non-secret defaults. `VITE_*` values are included in
the browser bundle, so they must never contain credentials or other secrets.
For cloud frontend builds, configure `VITE_API_ENV` or a `VITE_API_URL_*`
override in the hosting provider only when you need to change those defaults.

This does not apply to backend database settings. Each backend needs its own
`DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` at runtime.
Supply database usernames and passwords through local untracked configuration
or the hosting provider's secret store. Never commit actual credentials.

## Local Development

The local MySQL service in `docker/docker-compose.yml` is the dev database. Start
it with `docker compose -f docker/docker-compose.yml up -d mysql`. Set
`DB_USERNAME` and `DB_PASSWORD` in your local shell, then run the PHP API from
the repository root:

```sh
APP_ENV=dev DB_HOST=127.0.0.1 DB_PORT=3306 DB_DATABASE=cam_astrology_db \
php -S 127.0.0.1:8000 backend/server.php
```

Do not reuse development credentials outside a local machine.

## Staging

Local staging is isolated from both dev and production. Start its separate
MySQL container and volume:

```sh
docker compose --profile staging -f docker/docker-compose.yml up -d staging-mysql
```

Set `STAGING_DB_USERNAME` and `STAGING_DB_PASSWORD` locally, then run the API
on a separate port, connected to that database:

```sh
APP_ENV=staging DB_HOST=127.0.0.1 DB_PORT=3307 DB_DATABASE=cam_astrology_db \
DB_USERNAME="$STAGING_DB_USERNAME" DB_PASSWORD="$STAGING_DB_PASSWORD" \
php -S 127.0.0.1:8001 backend/server.php
```

Run the frontend against that API with
`VITE_API_ENV=staging VITE_API_URL_STAGING=http://localhost:8001/api/v1 npm run dev -- --mode staging`.
The staging MySQL service uses a separate persistent volume from dev.

For hosted staging, `database/fly.staging.toml` and
`backend/fly.staging.toml` are templates for separate Fly apps; the backend
points only to `cam-mysql-staging`. Create/deploy those apps and set
`MYSQL_ROOT_PASSWORD`, `MYSQL_PASSWORD`, and backend `DB_PASSWORD` as Fly
secrets. Use the same generated database-user password for `MYSQL_PASSWORD` and
`DB_PASSWORD`. Hosted staging is not provisioned by these configuration files
alone.

For a staging frontend on Netlify or Vercel, set `VITE_API_ENV=staging` and
`VITE_API_URL_STAGING=https://cam-backend-staging.fly.dev/api/v1` in that
deployment environment. Do not use a relative `/api/v1` staging URL on the
production site: its existing proxy routes to the production backend.

## Backend Database Selection

The PHP API connects only to the `DB_HOST`, `DB_PORT`, `DB_DATABASE`,
`DB_USERNAME`, and `DB_PASSWORD` variables supplied to that backend process.
Fly production uses `cam-mysql.internal`; staging uses
`cam-mysql-staging.internal`. Keep the credentials in the hosting provider's
secret store, not in frontend `VITE_*` variables or committed files. The API
health endpoint reports `APP_ENV` so the selected backend environment can be
checked without exposing database connection details.
