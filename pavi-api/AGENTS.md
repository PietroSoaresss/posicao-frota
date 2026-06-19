# Repository Guidelines

## Project Overview

`pavi_api` is a REST API built with Spring Boot 4.0.5 and Java 25 for managing transportation and logistics data (drivers, vehicles, trips, companies, cities, states, manufacturers, vehicle models).

## Project Structure

```
src/main/java/br/com/pavi/api/
├── auth/              # JWT authentication (JwtUtil, JwtFilter, SecurityConfig, User model)
├── config/            # Configuration (PortFallbackCustomizer)
├── controller/        # REST controllers (City, Company, Driver, Manufacturer, State, Trip, Vehicle, VehicleModel)
├── model/             # JPA entities (City, Company, Driver, Manufacturer, Origin, Destination, State, Trip, Vehicle, VehicleModel)
├── repository/        # Spring Data repositories
├── service/           # Business logic services
└── PaviApiApplication.java

src/main/resources/
├── application.properties    # Configuration (DB, JWT secret, server port)
└── sql/                     # Database schema migrations (V1_create_users_table.sql)

src/test/                    # Unit tests
```

## Build & Development Commands

```bash
# Build
./mvnw clean package

# Run locally (uses application.properties)
./mvnw spring-boot:run

# Run tests
./mvnw test

# Skip tests during build
./mvnw clean package -DskipTests
```

## Coding Style

- **Java**: Java 25, Spring Boot conventions
- **Indentation**: 4 spaces
- **Architecture**: Controller → Service → Repository (layered)
- **Entities**: JPA with `@Entity`, `@Table`, `@Id`, `@GeneratedValue(strategy = GenerationType.IDENTITY)`
- **REST Controllers**: Annotate with `@RestController`, `@RequestMapping`; use constructor injection
- **Naming**: PascalCase for classes, camelCase for methods/fields; package-private visibility preferred

## Testing

Tests use Spring Boot Test (`spring-boot-starter-test`). Run with `./mvnw test`.

## Database

- PostgreSQL (`localhost:5432/pavi`, credentials in `application.properties`)
- Schema managed via SQL files in `src/main/resources/sql/`
- Sensitive config (JWT secret, DB password) stored in `application.properties` - do not commit secrets

## Security

- JWT-based authentication via `JwtFilter` and `SecurityConfig`
- Endpoints under `/auth/**` are public; most other endpoints require Bearer token
- Never expose secrets in code or logs
