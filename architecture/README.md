# Farm Roots — Architettura del Sistema

---

## 1. I cinque macro-livelli

L'architettura è strutturata in cinque livelli che collaborano in modo **asincrono** per non appesantire l'esperienza utente sulla dashboard.

```mermaid
flowchart TB
    A["🖥️ A — Presentation Layer\nWeb App (React + MUI)"]
    B["🔌 B — Integration Layer\nERP Gateway / API Middleware"]
    C["⚙️ C — Business Logic & Orchestration\nBackend RESTful (FastAPI)"]
    D["🧠 D — Intelligence & Data Ingestion\nAI Layer (Risk Engine + Computer Vision)"]
    E["⛓️ E — Trust Layer\nBlockchain (Polygon)"]

    A <-->|"REST/JSON + WebSocket"| C
    B -->|"Fornitori, lotti, volumi"| C
    C -->|"Trigger analisi"| D
    C -->|"Firma + certifica"| E
    D -->|"Score rischio + alert"| C
    E -->|"txHash + stato certificato"| C
```

### A. Presentation Layer (Frontend)
È l'interfaccia con cui interagisce l'azienda.
- **Componente**: Web App
- **Funzioni**: visualizzazione mappa lotti (GeoJSON), gestione alert Red/Green, caricamento manuale fornitori, reportistica EUDR.

### B. Integration Layer (ERP Gateway)
Il ponte verso il mondo esterno.
- **Componente**: Middleware di integrazione (API Gateway)
- **Funzioni**: si collega via API o Webhook ai gestionali aziendali (SAP, Oracle, ecc.) per importare automaticamente l'anagrafica fornitori, le coordinate dei lotti e i volumi di merce.

### C. Business Logic & Orchestration (Backend)
Il "cervello" che coordina le operazioni.
- **Componente**: RESTful API (FastAPI)
- **Funzioni**: gestisce autenticazione, logica dei tier di abbonamento, e coordina le chiamate verso i moduli AI e la Blockchain.

### D. Intelligence & Data Ingestion (AI Layer)
Dove avviene la magia del monitoraggio.
- **Modulo Change Detection**: ingerisce dati Sentinel-1/2 e usa reti neurali (U-Net) per classificare il terreno e rilevare deforestazione.
- **Modulo Risk Prediction**: analizza trend storici e dati di prossimità per prevedere rischi futuri su 30/60/90 giorni.

### E. Trust Layer (Blockchain)
Garantisce la prova legale dell'audit.
- **Componente**: Geo-Oracle + Smart Contracts su Polygon
- **Funzioni**: firma digitale dei verdetti AI, creazione di certificati immutabili, blocco automatico dei lotti RED.

---

## 2. Stack tecnologico

| Componente | Tecnologia | Motivazione |
|------------|-----------|-------------|
| Frontend | React + TypeScript + MUI | Reattività, ecosistema vasto, librerie cartografiche (MapLibre GL) |
| Backend | Python — FastAPI | Linguaggio standard per AI; comunicazione nativa con modelli CV |
| Database primario | PostgreSQL + PostGIS | Gestione dati geografici, poligoni e query spaziali (GeoJSON) |
| Cache & code | Redis | Job asincroni Celery, cache API, WebSocket real-time |
| AI Framework | PyTorch / TensorFlow | Rete U-Net per segmentazione immagini satellitari |
| Data Engine | Google Earth Engine API | Ingestione e pre-processing immagini Sentinel-1/2 |
| Blockchain | Polygon (Layer 2) | Gas fee bassi, alta velocità per generazione certificati |
| Auth | OAuth2/OIDC (Keycloak) | SSO aziendale, integrazione Azure AD / Google Workspace |

---

## 3. Come si muovono i dati (stato attuale — MVP)

Nel prototipo attuale il backend non esiste ancora: tutti i dati vengono da **mock locali** nel frontend. La struttura è progettata per sostituire i mock con chiamate API reali senza toccare i componenti.

```mermaid
flowchart LR
    subgraph Mocks["📁 src/mocks/ (dati simulati)"]
        MS["mockSuppliers\n3 fornitori IT/BR/ID"]
        ML["mockLots\n30 lotti Polygon — Brasile"]
        MR["mockReports\n5 report DD su 2 anni"]
        MT["mockTransactions\n4 tx blockchain"]
        MA["mockRiskAssessments\n4 assessment pre-calcolati"]
    end

    subgraph Stores["🗃️ Zustand Stores (stato globale)"]
        SS["supplierStore\nsuppliers[] + suspendSupplier()"]
        LS["lotStore\nlots[] — read-only"]
        US["uiStore\nsidebarOpen toggle"]
    end

    subgraph Services["⚙️ src/services/ (logica dominio)"]
        RE["riskEngine.ts\ngenerateAssessmentForLot()\ngenerateForecasts()"]
        BC["blockchain.ts\nsubmitToBlockchain()"]
    end

    subgraph Pages["📄 Pagine"]
        P1["Dashboard"]
        P2["Suppliers"]
        P3["RiskAssessment"]
        P4["DueDiligence"]
        P5["Blockchain"]
    end

    MS -->|"init"| SS
    ML -->|"init"| LS
    MR -->|"import diretto"| P1
    MR -->|"import diretto"| P4
    MT -->|"import diretto"| P5
    MA -->|"import diretto"| P3

    SS -->|"useSupplierStore()"| P1 & P2 & P3 & P4 & P5
    LS -->|"useLotStore()"| P1 & P2 & P3 & P4 & P5

    RE -->|"generato al render"| P3
    BC -->|"chiamata su azione utente"| P5
```

**Regola semplice:**
- Dati **mutabili** (suppliers, lots) → Zustand store → tutti i componenti si aggiornano automaticamente
- Dati **storici** (reports, transactions) → import diretto da mocks → no stato globale necessario
- Dati **derivati** (forecast, assessment dinamici) → calcolati al render da `riskEngine.ts`

---

## 4. Risk Engine — 8 criteri EUDR

Il `riskEngine.ts` implementa il cuore del prodotto: scoring, forecasting e rationale in italiano.

| ID | Criterio | Peso |
|----|---------|------|
| c01 | Deforestazione aree adiacenti | 0.20 |
| c02 | Rischio paese (rating EUDR CE) | 0.18 |
| c03 | Cambio uso suolo post 31/12/2020 | 0.15 |
| c04 | Storico compliance fornitore | 0.12 |
| c05 | Qualità dati geolocalizzazione | 0.08 |
| c06 | Copertura forestale nel lotto | 0.08 |
| c07 | Prossimità aree protette IUCN | 0.07 |
| c08 | Sovrapposizione terre indigene | 0.05 |

**Soglie risk level**: score < 33 → 🟢 Basso · 33–65 → 🟡 Medio · ≥ 66 → 🔴 Alto

**Forecast 30/60/90 giorni**: per ogni criterio calcola drift ambientale stagionale + riduzione da azioni di mitigazione in corso, e genera una spiegazione testuale in italiano.

---

## 5. Deployment: dove gira ogni pezzo

```mermaid
flowchart LR
    subgraph Cloud["☁️ Cloud (AWS / GCP)"]
        FE["Web App React\nVercel / AWS Amplify\n(CDN globale)"]
        BE["Backend FastAPI\nDocker + Kubernetes\n(EKS / GKE)"]
        DB["PostgreSQL + PostGIS\nAWS RDS / Cloud SQL\n(managed, backup automatico)"]
        AI_CV["Computer Vision\nGPU — SageMaker / Vertex AI\n(attivo solo durante analisi)"]
        AI_RISK["Risk Prediction\nCPU / Lambda serverless\n(sempre disponibile)"]
        GEO["Geo-Oracle\nMicroservizio privato\n(detiene chiave crittografica)"]
    end

    BC["⛓️ Polygon Network\n(smart contract pubblico)"]
    ERP["🏭 ERP Aziendale\n(SAP, Oracle, custom)"]
    SAT["🛰️ Google Earth Engine\n(immagini Sentinel-1/2)"]

    FE <--> BE
    BE <--> DB
    BE --> AI_CV
    BE --> AI_RISK
    BE --> GEO
    GEO -->|"firma + tx"| BC
    ERP -->|"webhook"| BE
    SAT -->|"GeoTIFF / API"| AI_CV
```

- **Web App**: Vercel o AWS Amplify — distribuzione globale via CDN.
- **Backend + DB**: containerizzati Docker, orchestrati Kubernetes; PostgreSQL come istanza managed per backup e HA.
- **Computer Vision** (pesante): GPU on-demand su SageMaker / Vertex AI — si attiva solo durante l'analisi delle immagini.
- **Risk Prediction**: istanze CPU standard o Lambda serverless se il modello è leggero.
- **Geo-Oracle**: microservizio privato nel backend — detiene la chiave crittografica e firma i pacchetti prima di inviarli su Polygon.
- **Smart Contract**: risiede sulla rete Polygon pubblica — verificabile da chiunque.

---

## 6. MVP ora vs. target v1.0

| Layer | Oggi (prototipo) | v1.0 |
|-------|-----------------|------|
| Frontend | React + TS + MUI — funzionante | Invariato |
| Dati | Mock locali in-browser | FastAPI + PostgreSQL |
| AI / Risk | Scoring deterministico (riskEngine.ts) | Modelli ML su dati Sentinel reali |
| Blockchain | Hash simulati | Polygon mainnet via ethers.js |
| ERP | — | Webhook REST (SAP, Oracle, custom) |
| Auth | — | OAuth2/OIDC (Keycloak / Azure AD) |
| Deployment | `npm run dev` locale | Kubernetes cloud EU |
