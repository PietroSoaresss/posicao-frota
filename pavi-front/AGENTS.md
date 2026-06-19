# Repository Guidelines

## Project Overview

PAVI is an Angular 21 fleet management system. The app displays a trips/viagens table with filtering, KPIs, and a detail modal for editing trips (with drill-down into Motorista, Veículo, and Embarcador forms).

## Project Structure

```
src/
├── app/
│   ├── core/
│   │   ├── models/models.ts          # Interfaces: Viagem, Motorista, Veiculo, Empresa, etc.
│   │   └── services/data.service.ts # API integration + helper methods (brl, fmtData, etc.)
│   ├── shared/
│   │   ├── components/
│   │   │   ├── icon/               # SVG icon component (30+ icons from shell.jsx)
│   │   │   ├── status-pill/       # Colored status badge (StatusPill)
│   │   │   └── page-title/        # Page header with title + action buttons
│   │   └── form-primitives/
│   │       ├── form-field/         # Label + required marker + hint
│   │       ├── text-input/         # Input with prefix/suffix/icon support
│   │       ├── select-input/       # Styled <select> dropdown
│   │       ├── money-input/        # BRL currency input (stores cents)
│   │       └── date-input/         # Date input with calendar icon
│   ├── shell/
│   │   ├── sidebar/               # Sidebar navigation
│   │   └── topbar/                 # Top bar with search, breadcrumb
│   └── features/viagens/
│       ├── viagens.component        # Main page: table, filters, KPIs
│       └── detail-modal/
│           ├── detail-modal          # Modal container + drill-down logic
│           ├── viagem-form          # Edit viagem form
│           ├── motorista-form       # Edit driver form
│           ├── veiculo-form        # Edit vehicle form (Cavalo/Carreta)
│           └── embarcador-form     # Edit shipper form
├── styles.scss                      # All CSS design tokens + global styles
└── index.html
```

## Build & Development Commands

```bash
cd pavi
npm install          # Install dependencies
npm run build        # Production build → dist/
npm start            # Dev server at http://localhost:4200
```

## Design Tokens

All CSS variables are defined in `styles.scss` `:root`:

| Token | Value | Usage |
|---|---|---|
| `--pv-accent` | `#1565c0` | Primary blue, header, focus rings |
| `--pv-ok` | `#2e7d32` | Destination dot, "Concluída" status |
| `--pv-warn` | `#ef6c00` | "Em Andamento" status, dirty indicator |
| `--pv-danger` | `#c62828` | "Cancelada" status, required asterisk |
| `--pv-font` | Inter | Main font |
| `--pv-mono` | IBM Plex Mono | Codes, plates, CNPJ, monetary values |

## Coding Conventions

- **Angular 21 standalone components** — no NgModules
- **Signals** (`signal()`, `computed()`) for reactive state
- **CSS design tokens** via `--pv-*` CSS variables — never hardcode colors
- **SCSS** with nesting, no Tailwind
- **Icons** — use `app-icon` component with name prop (see `shell.jsx` for available icon names)
- **StatusPill** — always use `app-status-pill` with `[status]="viagem.status"`
- **MoneyInput** — stores value in **cents** (integer), displays formatted BRL
- **DateInput** — native `<input type="date">` with `calendar-days` icon trigger; `[compact]="true"` for filter bars; value is ISO `YYYY-MM-DD`

## Component Patterns

### Form inputs
```html
<app-form-field label="Nome" [required]="true" hint="Aparece no app do motorista">
  <app-text-input [value]="form().nome" icon="user" (valueChange)="upd('nome', $event)"></app-text-input>
</app-form-field>
```

### Modal drill-down
- Parent `DetailModalComponent` holds `view` (signal) and `dirty` (signal)
- Child forms emit `(onOpen)` and `(onDirty)` events
- Back button calls `goBack()` → sets `view` back to `{kind: 'viagem'}`

## Data Layer

`DataService` centralizes API synchronization and exposes the read models used by the UI: `ESTADOS`, `CIDADES`, `VEICULOS`, `EMPRESAS`, `MOTORISTAS`, `VIAGENS`. Helper methods: `brl()`, `brlCents()`, `fmtData()`, `cidadeLabel()`, `modeloCompleto()`.
