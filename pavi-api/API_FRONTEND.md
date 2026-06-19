# Pavi API - Frontend Integration Guide

## Base URL
```
http://localhost:8080
```

## CORS
The API is configured to allow requests from any origin (`*`) during development. This includes support for:
- **Methods:** GET, POST, PUT, DELETE, OPTIONS, PATCH
- **Headers:** All headers are allowed, and the `Authorization` header is exposed.

## Authentication

All endpoints (except `/auth/**`) require a Bearer token in the `Authorization` header.

### Login
```
POST /auth/login
Content-Type: application/json

Request:
{
  "username": "string",
  "password": "string"
}

Response:
{
  "token": "jwt_token_string"
}
```

**Frontend tip:** After login, store the token and include it in all subsequent requests:
```javascript
headers: { 'Authorization': `Bearer ${token}` }
```

---

## Endpoints

### Cities
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/cities` | List all cities (optional `?stateId=` filter) | Yes |
| GET | `/cities/{id}` | Get city by ID | Yes |
| POST | `/cities` | Create city | Yes |
| PUT | `/cities/{id}` | Update city | Yes |
| DELETE | `/cities/{id}` | Delete city | Yes |

**City body:**
```json
{ "name": "string", "state": { "id": 1 } }
```

### States
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/states` | List all states | Yes |
| GET | `/states/{id}` | Get state by ID | Yes |
| POST | `/states` | Create state | Yes |
| PUT | `/states/{id}` | Update state | Yes |
| DELETE | `/states/{id}` | Delete state | Yes |

**State body:**
```json
{ "name": "string", "abbreviation": "string" }
```

### Companies
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/companies` | List all companies | Yes |
| GET | `/companies/{id}` | Get company by ID | Yes |
| POST | `/companies` | Create company | Yes |
| PUT | `/companies/{id}` | Update company | Yes |
| DELETE | `/companies/{id}` | Delete company | Yes |

**Company body:**
```json
{
  "corporateName": "string",
  "cnpj": "string",
  "zipCode": "string",
  "neighborhood": "string",
  "street": "string",
  "complement": "string",
  "number": "string",
  "city": { "id": 1 }
}
```

### Drivers
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/drivers` | List all drivers | Yes |
| GET | `/drivers/{id}` | Get driver by ID | Yes |
| POST | `/drivers` | Create driver | Yes |
| PUT | `/drivers/{id}` | Update driver | Yes |
| DELETE | `/drivers/{id}` | Delete driver | Yes |

**Driver body:**
```json
{
  "name": "string",
  "sex": "string",
  "licenseNumber": "string",
  "birthDate": "1990-05-15",
  "licenseExpiration": "2030-05-15",
  "city": { "id": 1 }
}
```

### Manufacturers
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/manufacturers` | List all manufacturers | Yes |
| GET | `/manufacturers/{id}` | Get manufacturer by ID | Yes |
| POST | `/manufacturers` | Create manufacturer | Yes |
| PUT | `/manufacturers/{id}` | Update manufacturer | Yes |
| DELETE | `/manufacturers/{id}` | Delete manufacturer | Yes |

**Manufacturer body:**
```json
{ "name": "string" }
```

### Vehicle Models
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/vehicle-models` | List all vehicle models | Yes |
| GET | `/vehicle-models/{id}` | Get vehicle model by ID | Yes |
| POST | `/vehicle-models` | Create vehicle model | Yes |
| PUT | `/vehicle-models/{id}` | Update vehicle model | Yes |
| DELETE | `/vehicle-models/{id}` | Delete vehicle model | Yes |

**VehicleModel body:**
```json
{ "name": "string", "manufacturer": { "id": 1 } }
```

### Vehicles
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/vehicles` | List all vehicles | Yes |
| GET | `/vehicles/{id}` | Get vehicle by ID | Yes |
| POST | `/vehicles` | Create vehicle | Yes |
| PUT | `/vehicles/{id}` | Update vehicle | Yes |
| DELETE | `/vehicles/{id}` | Delete vehicle | Yes |

**Vehicle body:**
```json
{
  "plate": "string",
  "type": "string",
  "chassis": "string",
  "renavam": "string",
  "modelYear": 2024,
  "manufacturingYear": 2023,
  "vehicleModel": { "id": 1 }
}
```

### Trips
| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/trips` | List all trips | Yes |
| GET | `/trips/{id}` | Get trip by ID | Yes |
| POST | `/trips` | Create trip | Yes |
| PUT | `/trips/{id}` | Update trip | Yes |
| DELETE | `/trips/{id}` | Delete trip | Yes |

**Trip body:**
```json
{
  "startDate": "2026-05-01",
  "endDate": "2026-05-03",
  "freightValue": 1500.00,
  "tollValue": 120.50,
  "status": "EM_ANDAMENTO",
  "driver": { "id": 1 },
  "horse": { "id": 1 },
  "trailer": { "id": 2 },
  "origins": [
    { "company": { "id": 1 }, "order": 1 }
  ],
  "destinations": [
    { "company": { "id": 2 }, "order": 1 }
  ]
}
```

---

## Common HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request (validation error, missing required fields, malformed body) |
| 401 | Unauthorized (missing/invalid token) |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Internal Server Error |

---

## JavaScript Fetch Example

```javascript
const API_BASE = 'http://localhost:8080';

async function apiRequest(endpoint, method, body = null, token = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

// Login
const { token } = await apiRequest('/auth/login', 'POST', { username: 'user', password: 'pass' });

// Get cities
const cities = await apiRequest('/cities', 'GET', null, token);

// Create city
const newCity = await apiRequest('/cities', 'POST', { name: 'São Paulo', state: { id: 1 } }, token);
```
