# Deployment

This runbook deploys the Spring Boot backend to Render with PostgreSQL and the static portfolio to GitHub Pages (or another static host).

## Important repository check

The intended deployment contract is Maven + Flyway. At the time this document was written, this checkout contains `backend/build.gradle.kts` and does not contain `backend/pom.xml`, a `Dockerfile`, a Flyway migration, or a form controller. Do not deploy until those files are migrated/added. The commands below intentionally use Maven only.

## 1. Create the Render PostgreSQL database

1. In Render, create a PostgreSQL database in the same region as the Web Service.
2. Copy the **Internal Database URL**. It has this shape:

```text
postgres://portfolio_user:replace-with-password@dpg-portfolio-abc123-a/portfolio_db
```

Spring needs a JDBC URL plus separate credentials. Convert it as follows:

```text
Render URL:  postgres://portfolio_user:replace-with-password@dpg-portfolio-abc123-a/portfolio_db
JDBC URL:    jdbc:postgresql://dpg-portfolio-abc123-a/portfolio_db
Username:    portfolio_user
Password:    replace-with-password
```

Do not merely prepend `jdbc:` to the Render value. Remove the `user:password@` portion from the URL and set those values separately.

## 2. Create the Render Web Service

Create a **Web Service** from the GitHub repository. Set the backend root directory to `backend` if Render supports a root directory for the service.

Use these build and start commands:

```text
Build Command: ./mvnw clean package -DskipTests
Start Command: java -jar target/backend-0.0.1-SNAPSHOT.jar
```

If the Maven wrapper has not been committed, install Maven in the build environment or add `backend/mvnw` and `backend/.mvn/wrapper/` before deploying. Do not replace these commands with Gradle commands.

Set the following four environment variables on the Render Web Service. Use the database values from step 1 and the exact variable names shown here:

```text
SPRING_DATASOURCE_URL=jdbc:postgresql://dpg-portfolio-abc123-a/portfolio_db
SPRING_DATASOURCE_USERNAME=portfolio_user
SPRING_DATASOURCE_PASSWORD=replace-with-the-render-database-password
SPRING_FLYWAY_ENABLED=true
```

Also set the service's health check path to an endpoint that actually exists, for example `/actuator/health` after Actuator is added. Render provides `PORT`; the application must bind to it with `server.port=${PORT:8080}`.

Never commit the values above with a real password. The host, database name, username, and password shown are deployment examples because this repository does not contain a live Render service URL or credentials.

## 3. Configure Spring

Use environment placeholders in `backend/src/main/resources/application.properties`:

```properties
spring.application.name=backend
server.port=${PORT:8080}
spring.datasource.url=${SPRING_DATASOURCE_URL}
spring.datasource.username=${SPRING_DATASOURCE_USERNAME}
spring.datasource.password=${SPRING_DATASOURCE_PASSWORD}
spring.flyway.enabled=${SPRING_FLYWAY_ENABLED:true}
spring.jpa.hibernate.ddl-auto=validate
```

Flyway must run before the application uses the tables. Add and test versioned migrations under `src/main/resources/db/migration/`. Do not use `ddl-auto=update`.

## 4. Verify the boot logs

A successful deployment includes messages equivalent to these:

```text
... HikariDataSource       : HikariPool-1 - Start completed.
... FlywayExecutor         : Database: jdbc:postgresql://.../portfolio_db
... DbMigrate               : Successfully applied 1 migration to schema "public"
... TomcatWebServer         : Tomcat started on port 8080
```

The exact logger names and migration count can vary by Spring Boot/Flyway version. The important signals are a successful database connection, successful Flyway migration, and a listening web server.

A failed deployment commonly looks like this:

```text
... Failed to configure a DataSource: 'url' attribute is not specified
... org.postgresql.util.PSQLException: The connection attempt failed.
... FlywayException: Validate failed: Migrations have failed validation
```

For a missing URL, check `SPRING_DATASOURCE_URL`. For a connection failure, check the Render database's internal host, region, credentials, and network access. For validation failure, do not delete or edit an already-applied migration; add a new migration or repair the database deliberately.

## 5. Point the static frontend at the backend

Replace the placeholder URL with the deployed Render Web Service URL and the actual controller route. The backend currently has no form endpoint, so `/api/contact` is the intended example contract, not a live route in this checkout.

```js
const backendUrl = "https://portfolio-api.onrender.com";

const form = document.querySelector("#contact-form");
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const response = await fetch(`${backendUrl}/api/contact`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: form.elements.name.value,
      email: form.elements.email.value,
      message: form.elements.message.value
    })
  });

  if (!response.ok) {
    throw new Error(`Contact request failed: ${response.status}`);
  }

  form.reset();
});
```

Configure CORS on the backend for the exact static-site origin, such as `https://efatha.github.io`. Do not use `*` when the endpoint accepts authenticated or sensitive data.

## 6. Verify data through the API

After the controller and migration exist, submit a test record from the deployed site or with `curl`:

```bash
curl -i -X POST "https://portfolio-api.onrender.com/api/contact" \
  -H "Content-Type: application/json" \
  -d '{"name":"Deployment Check","email":"check@example.com","message":"Render verification"}'
```

Expect a successful `2xx` response and the DTO-shaped response defined by the API. Then use the API's read endpoint, if one is intentionally exposed, to confirm the record. Avoid creating an unauthenticated public list endpoint solely for debugging production data.

## 7. Verify directly with psql

Use the Render database's **External Database URL** from a trusted local terminal. `psql` accepts the `postgres://` URL directly:

```bash
psql "postgres://portfolio_user:replace-with-password@your-external-host/portfolio_db?sslmode=require"
```

Then inspect Flyway and the application table:

```sql
SELECT installed_rank, version, description, success
FROM flyway_schema_history
ORDER BY installed_rank;

SELECT *
FROM contact_messages
ORDER BY created_at DESC
LIMIT 10;
```

Replace `contact_messages` and `created_at` with the names used by the migration. A successful check shows the migration marked `success = true` and the test record in the application table. Exit with `\\q`.

## 8. Final deployment checklist

- `backend/pom.xml` and the Maven wrapper are committed.
- No Gradle files or Gradle commands remain in the backend deployment path.
- Every production table is created by Flyway.
- Hibernate is set to `validate`, never `update`.
- Controllers use DTOs rather than JPA entities.
- Render has all four environment variables set.
- No secret is committed or printed in logs.
- The frontend uses the live HTTPS backend URL and the backend allows the exact frontend origin.
- A test request succeeds and the resulting row is visible in PostgreSQL.
