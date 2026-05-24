# Project Context: ExitusRO

ExitusRO is a platform for the digitalization of post-death procedures in Romania. It handles functions such as:
1. **CMCD release** (Certificat Medical Constatator al Decesului)
2. **SIIEASC registration**
3. **Death certificate issuance** (Certificat de Deces)
4. **Funeral services orchestration**

## Repository Structure
- `src/` - Frontend built with React 19, TanStack Router + Start, Vite, and Tailwind CSS v4.
- `backend/` - Backend services built with Spring Boot 3.

## Roles / Users
- **Aparținător (Family)**: `apartinator@exitusro.ro`
- **Medic constatator (Doctor)**: `medic@exitusro.ro`
- **Funcționar Stare Civilă (Civil Officer)**: `functionar@exitusro.ro`
- **Casă funerară (Funeral House)**: `casa.funerara@exitusro.ro`
- **Default password**: `password123`

## Running Locally
- **Backend (Port 8080)**: Run `mvn spring-boot:run` in `backend/`
- **Frontend (Port 3000)**: Run `npm install` and `npm run dev` in the root directory.
