# Deployment Guide

This repository has a static frontend at https://efatha.github.io/my-portofolio/ and a separate Spring Boot backend for the contact form.

## What is deployed

- Frontend: GitHub Pages at `https://efatha.github.io/my-portofolio/`
- Backend service name: `my-portofolio-backend`
- Backend URL after Render creates it: `https://my-portofolio-backend.onrender.com`
- Database: Render PostgreSQL
- Internal hostname: `dpg-dacltgvqj5pc73dc89u0-a`
- Database name: `my_portofolio`
- API: `POST /api/contact`
- Database table: `contact_messages`

Flyway runs inside the backend container during startup. It creates the table; it is not visible in the GitHub Pages browser screen.

## 1. Push the repository

Push the branch containing these files to GitHub. The repository root must contain `Dockerfile` and `render.yaml`; the backend must contain `pom.xml` and `src/main/resources/db/migration/V1__create_contact_messages.sql`.

## 2. Create the Render Web Service

In Render, choose **New > Blueprint** and select this repository. Render reads `render.yaml`, or create the service manually with:

- Runtime: Docker
- Root Directory: leave blank
- Dockerfile Path: `./Dockerfile`
- Docker Context: `.`
- Health Check Path: `/actuator/health`
- Port: `8080`

The root Dockerfile copies `backend/pom.xml` and `backend/src`, then builds the jar with Maven and Java 17.

## 3. Connect the Render PostgreSQL database

The application must use the internal Render hostname, not `localhost` and not the external hostname. Set these environment variables on the Web Service:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://dpg-dacltgvqj5pc73dc89u0-a/my_portofolio
SPRING_DATASOURCE_USERNAME=my_portofolio_user
SPRING_DATASOURCE_PASSWORD=<set this privately in Render>
SPRING_FLYWAY_ENABLED=true
APP_FRONTEND_ORIGIN=https://efatha.github.io
```

The JDBC URL deliberately contains only the host and database. Do not put `username:password@` into it. Never commit the password. Because the password was previously shared in chat, rotate it in Render and use the new value here.

## 4. Deploy and verify Flyway

Save the environment variables and deploy the service. Open:

```text
https://my-portofolio-backend.onrender.com/actuator/health
```

A healthy response is similar to:

```json
{"status":"UP"}
```

In Render logs, look for a successful PostgreSQL connection, a Flyway migration message, and `Tomcat started`. If logs say `Connection to localhost:5432 refused`, the Render service still has an old `SPRING_DATASOURCE_URL`; edit it, save, and redeploy.

## 5. Verify the API before the website

Run this from PowerShell after the service is healthy:

```powershell
$body = @{ name = 'Deployment Check'; email = 'check@example.com'; message = 'Render verification' } | ConvertTo-Json
Invoke-WebRequest -Method Post -Uri 'https://my-portofolio-backend.onrender.com/api/contact' -ContentType 'application/json' -Body $body
```

A successful request returns HTTP `201` and JSON containing `id`, `name`, `email`, `message`, and `submittedAt`.

The backend also accepts `contact` instead of `message` for compatibility with an older form, but the current frontend sends the canonical `message` field.

## 6. Verify the database with psql

Use the Render database's external host from a secure local terminal, not in source code. Replace the placeholders with the current rotated password:

```powershell
$env:PGPASSWORD = '<current database password>'
psql -h dpg-dacltgvqj5pc73dc89u0-a.oregon-postgres.render.com -U my_portofolio_user -d my_portofolio
```

Run:

```sql
SELECT installed_rank, version, description, success
FROM flyway_schema_history
ORDER BY installed_rank;

SELECT id, name, email, message, submitted_at
FROM contact_messages
ORDER BY submitted_at DESC
LIMIT 10;
```

The first query should show migration `1` with `success = true`. The second should show the deployment test message and its UTC timestamp. Clear the password from PowerShell after exiting `psql`:

```powershell
Remove-Item Env:PGPASSWORD
```

## 7. Publish and test GitHub Pages

Commit and push the frontend changes. GitHub Pages may take a short time to publish. Open `https://efatha.github.io/my-portofolio/`, fill in name, email, and message, and submit.

The frontend JavaScript sends:

```json
{
  "name": "your name",
  "email": "you@example.com",
  "message": "your message"
}
```

to `https://my-portofolio-backend.onrender.com/api/contact`. CORS is configured for the exact GitHub Pages origin `https://efatha.github.io`.

## Troubleshooting

- `Dockerfile not found`: use Docker runtime, leave Root Directory blank, and set Dockerfile Path to `./Dockerfile`.
- `localhost:5432 refused`: replace the Render URL with `jdbc:postgresql://dpg-dacltgvqj5pc73dc89u0-a/my_portofolio` and redeploy.
- `CORS` error: verify `APP_FRONTEND_ORIGIN=https://efatha.github.io` and that the page is using the current `index.js`.
- `404 /api/contact`: verify the backend deployment is on the latest commit and that the service URL in `index.js` is correct.
- `Flyway validation failed`: do not edit an applied migration; add a new versioned migration.
