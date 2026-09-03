# Repository instructions

## Backend rules

- The backend is a Spring Boot application. Use Maven only: keep `backend/pom.xml` as the source of dependency and build configuration.
- Do not add Gradle files, Gradle wrappers, or Gradle commands. Do not introduce `build.gradle`, `build.gradle.kts`, `settings.gradle`, or `gradlew`.
- Flyway owns the database schema. Every schema change must be a versioned migration under `backend/src/main/resources/db/migration/`, using the `V<version>__<description>.sql` naming convention.
- Follow the migration-then-entity pattern: create and verify the Flyway migration first, then add or change the JPA entity and repository to match it. Never use Hibernate to create or modify production tables.
- Controllers must accept and return DTOs. Do not expose JPA entities from controller methods, and do not use entities as request bodies. Map between DTOs and entities at the service boundary.
- Keep validation on request DTOs with Bean Validation annotations and handle validation errors consistently at the API boundary.
- Prefer small, focused services and repositories. Preserve existing public API behavior unless the task explicitly changes the contract.

## Configuration and security

- Configure runtime values through environment variables or external configuration. Never hardcode passwords, tokens, API keys, JDBC credentials, or private connection strings.
- Never set `spring.jpa.hibernate.ddl-auto=update` (or any other automatic schema mutation mode). Use Flyway migrations and a non-mutating Hibernate setting such as `validate` when JPA schema validation is needed.
- Keep secrets out of source control, logs, test fixtures, screenshots, and documentation. Use safe placeholders in examples.
- Database configuration must use separate URL, username, and password values. Do not pass a Render `postgres://` URL directly to Spring as a JDBC URL.

## Change workflow

1. Inspect the existing migration, entity, DTO, service, and controller behavior before editing.
2. Add or update the Flyway migration.
3. Add or update the entity and repository to reflect the migration.
4. Add or update DTOs, services, and controllers without leaking entities.
5. Run the relevant Maven tests and package check before declaring the change complete.

When instructions conflict, protect data and existing API contracts first, then ask for clarification rather than silently adding a second build system or changing the schema automatically.
