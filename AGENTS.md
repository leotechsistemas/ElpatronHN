# AGENTS.md — EL PATRÓN HN ERP

## Stack
- **Frontend**: Vite + React 19 + TypeScript + Tailwind v4 + lucide-react + motion + jspdf
- **Backend**: Spring Boot 3.4 + Java 21 + JPA/Hibernate + H2 (dev) / PostgreSQL (prod)
- **Auth**: JWT (jjwt 0.12.6), credentials: `admin@patron.hn` / `Admin123!`
- **JSON**: Jackson `SNAKE_CASE` globally; `api.ts::toSnakeCase()` auto-converts camelCase keys before POST/PUT

## Commands
| Action | Command |
|--------|---------|
| Frontend dev | `npm run dev` (port 3002, proxies `/api` → localhost:8080) |
| Backend dev | `cd backend-java && .\mvnw spring-boot:run` |
| TypeScript check | `npx tsc --noEmit` |
| Backend compile | `cd backend-java && .\mvnw compile -q` |
| Backend test | `cd backend-java && .\mvnw test` (no tests exist yet) |
| Build all | `npm run build` (vite → `dist/`, then copied to Spring Boot `static/`) |
| Docker build | `docker build -t patron-erp .` (multi-stage: Node 22 → Maven 3.9+Java 21 → JRE 21) |

## Architecture
- **SPA routing**: `WebConfig.java` forwards all non-API paths to `index.html` (React Router)
- **Controller → Service → Repository**: thin controllers, transactional services, JPA entities (no business logic)
- **Profiles**: `dev` = H2 file DB (`./data/patron-erp`), `prod` = PostgreSQL via env vars
- **Payment soft-delete**: `DELETE /payments/:id` → sets `estado = "Anulado"` (reverses accounting), keeps row visible
- **Accounting**: correlative `AS-YYYY-MM-NNNN`, period validation, revert entry instead of delete
- **Users = Employees**: `User.java` entity extends RH fields: dni, telefono, direccion, puesto, departamento, salario, fecha_contratacion, fecha_nacimiento, contacto_emergencia, telefono_emergencia. "Empleados" in sidebar links to `EmployeesView.tsx`
- **Seed users**: `DataInitializer.java` creates 4 users (USR-0001 to USR-0004); user inserts removed from `data.sql`
- **RRHH reports**: `GET /api/users/stats/departments`, `/stats/positions`, `/stats/active-count`; `GET /api/users/active`

## Key Conventions
- **No tests exist** for backend or frontend — create if needed
- **Frontend** is monolithic: 1166-line `App.tsx` contains all CRUD handlers, navigation, PDF generation
- **No schemas/migrations**: `ddl-auto: update` in both profiles; `schema.sql` only for reference / fresh H2
- **No `.env` in repo**: backend uses env vars `PORT`, `JWT_SECRET`, `SPRING_DATASOURCE_*` in prod
- **No opencode.json**: config lives in `.opencode/skills/` (contabilidad-general, contabilidad-auditoria, java-avanzado)

## Branching
- Current branch: `feat/pos-redesign-payment-anular` (soft-delete pagos + POS orig layout)
