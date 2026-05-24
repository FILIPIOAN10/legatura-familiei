# ExitusRO

Platformă pentru digitalizarea procedurilor post-deces (eliberare CMCD,
înregistrare SIIEASC, emitere certificat de deces, servicii funerare).

## Structură

- `src/` — frontend (React + TanStack Router + Vite + Tailwind)
- `backend/` — backend Spring Boot 3 (vezi [backend/README.md](backend/README.md))

## Pornire locală

### 1. Backend (port 8080)

```bash
cd backend
mvn spring-boot:run
```

Backend-ul rulează pe `http://localhost:8080` și seedează automat patru conturi
demo (vezi tabelul din `backend/README.md`). Parolă pentru toate: `password123`.

### 2. Frontend (port 3000)

Într-un alt terminal, din rădăcina repo-ului:

```bash
npm install
npm run dev
```

Frontend-ul rulează pe `http://localhost:3000` și consumă API-ul de pe 8080
(cookie-based auth, `credentials: include`).

## Conturi de test

| Rol                       | Email                          | Parolă         |
|---------------------------|--------------------------------|----------------|
| Aparținător (familie)     | apartinator@exitusro.ro        | password123    |
| Medic constatator         | medic@exitusro.ro              | password123    |
| Funcționar Stare Civilă   | functionar@exitusro.ro         | password123    |
| Casă funerară             | casa.funerara@exitusro.ro      | password123    |

## Variabile de mediu

Frontend (`.env.local` opțional):

```
VITE_API_URL=http://localhost:8080
```

Backend (opțional):

```
JWT_SECRET=<Base64 random ≥ 32 bytes>
```
# frontend_medical
