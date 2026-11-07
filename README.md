# FarmRoots — AI & Earth Observation Platform for EUDR Compliance

[![Award: 1st Place Overall (Premio Panti)](https://img.shields.io/badge/Award-1st%20Place%20(Premio%20Maurizio%20Panti)-gold.svg)](https://events.dii.univpm.it/Hack-AI-thon/)
[![Award: Loccioni Prize](https://img.shields.io/badge/Award-Loccioni%20(Completeness%20%26%20Marketability)-blue.svg)](https://events.dii.univpm.it/Hack-AI-thon/)
[![Award: Confindustria PU Prize](https://img.shields.io/badge/Award-Confindustria%20PU%20(Best%20Business%20Idea%20%26%20Innovation)-orange.svg)](https://events.dii.univpm.it/Hack-AI-thon/)
[![Regulation: EUDR Compliant](https://img.shields.io/badge/Regulation-EU%20Deforestation%20(EUDR)-green.svg)](#the-eudr-regulatory-framework)
[![Frontend: React & TypeScript](https://img.shields.io/badge/Frontend-React%2018%20%7C%20TypeScript%20%7C%20MUI-61DAFB.svg)](#technical-architecture)
[![AI/CV: U-Net Segmentation](https://img.shields.io/badge/AI%2FCV-PyTorch%20%7C%20U--Net-FF6F00.svg)](#earth-observation--ai-segmentation-pipeline)
[![Blockchain: Polygon](https://img.shields.io/badge/Blockchain-Polygon%20Notarization-8247E5.svg)](#blockchain-traceability--digital-passport)

Official repository for **FarmRoots**, developed by team **ByteBandits** — **1st Place Overall Winner** of the **Hack-AI-Thon 2026** (9th Edition), organized by the Department of Information Engineering (DII) and Department of Management at **Università Politecnica delle Marche (UNIVPM)**.

FarmRoots is an end-to-end B2B compliance and geospatial intelligence platform designed to automate verification for the **European Union Deforestation Regulation (EUDR)**. By combining multi-spectral (Sentinel-2) and SAR radar (Sentinel-1) satellite data, U-Net deep learning segmentation, spatial regression risk models, and Polygon blockchain notarization, FarmRoots provides corporate commodity importers with tamper-proof digital legal passports.

---

## Awards & Honors

At the Hack-AI-thon 2026 evaluation ceremony, team **ByteBandits** swept the competition by securing **4 official awards**:

1. **Premio "Maurizio Panti" 2026 (1st Place Overall Winner):** Assigned to the best overall AI-driven system addressing deforestation and sustainable supply chain due diligence.
2. **Premio "Completezza e Commerciabilità del Sistema" (Awarded by Loccioni):** Recognizing production readiness, complete functional integration, viable unit economics, and immediate market applicability.
3. **Premio "Migliore Idea di Impresa" (Awarded by Confindustria Pesaro Urbino):** Honoring business model viability, market entry strategy, and high commercialization potential.
4. **Premio "Innovatività dell'Applicazione" (Awarded by Confindustria Pesaro Urbino):** Commending the cutting-edge fusion of multi-sensor Earth Observation (Sentinel-1 SAR + Sentinel-2), deep learning vision models, and blockchain auditing.

---

## Deliverables, Press Coverage & Official Links

* **Official Pitch Deck (PDF):** [Green Modern Bold Nature Forest Presentation.pdf](./Green%20Modern%20Bold%20Nature%20Forest%20Presentation.pdf)
* **ANSA Press Feature:** [L'IA contro la deforestazione, il progetto vince il premio Panti — ANSA Marche](https://www.ansa.it/marche/notizie/universita_politecnica_delle_marche/2026/03/30/lia-contro-la-deforestazione-il-progetto-vince-il-premio-panti_68b4507b-2309-4c2c-be93-eb612bdc6206.html)
* **LinkedIn Official Update & Feature:** [Hack-AI-thon 2026 Winner Announcement — LinkedIn](https://www.linkedin.com/feed/update/urn:li:share:7444649264288292864/)
* **Official Hackathon Portal:** [UNIVPM Hack-AI-thon 2026 Official Event Page](https://events.dii.univpm.it/Hack-AI-thon/)
* **Ateneo Press Review (PDF):** [UNIVPM Hack-AI-thon 2026 Rassegna Stampa](https://events.dii.univpm.it/Hack-AI-thon/rassegna_stampa.pdf)
* **Corporate Partner Feature:** [Biesse Group Corporate News — "Hack-AI-thon: gli studenti di Ingegneria Informatica di UNIVPM in Biesse"](https://biesse.com/it/it/hack-ai-thon-gli-studenti-di-ingegneria-informatica-di-univpm-in-biesse/)

---

## The EUDR Regulatory Framework

The European Union Deforestation Regulation (EUDR — Regulation EU 2023/1115) enforces strict due diligence on companies importing or placing 7 core commodities onto the EU single market: **Cattle, Cocoa, Coffee, Oil Palm, Rubber, Soya, and Wood**.

* **Regulatory Deadlines:**
  * **December 31, 2026:** Mandatory compliance for large and medium enterprises.
  * **June 30, 2027:** Mandatory compliance for micro and small enterprises (SMEs).
* **Non-Compliance Penalties:**
  * Fines up to **4% of the operator's annual EU turnover**.
  * Confiscation of imported commodities and all commercial revenue derived.
  * Temporary exclusion (up to **12 months**) from public procurement and public subsidies.

### Core Capabilities
1. **Automated Land Plot Verification:** Ingests supplier parcel boundaries (GeoJSON) and audits historical canopy cover against regulatory cutoff dates.
2. **Automated Due Diligence Statements:** Generates pre-compiled EUDR audit documentation ready for direct integration into enterprise ERP systems.
3. **Predictive Territory Risk Engine:** Applies spatial regression models over environmental and geographical features to identify areas with imminent deforestation risk.

---

## Technical Architecture

```
[Supplier GeoJSON Boundaries] ──> [Satellite Ingestion: Sentinel-1 (SAR) & Sentinel-2 (Optical)]
                                                      │
                                                      ▼
                                         [Deep Learning Vision Core]
                                     (U-Net Semantic Segmentation Engine)
                                                      │
                         ┌────────────────────────────┴────────────────────────────┐
                         ▼                                                         ▼
            [Predictive Risk Assessment]                               [Blockchain Notarization]
             (Spatial Regression Model)                               (Polygon Digital Passport)
                         │                                                         │
                         └────────────────────────────┬────────────────────────────┘
                                                      ▼
                                          [Due Diligence Reporting]
                                                      │
                                                      ▼
                                    [Web Dashboard & ERP Integration]
                               (React 18, TypeScript, MUI v7, MapLibre GL)
```

* **Frontend:** React 18, TypeScript, Vite, Material UI (MUI v7), Recharts, MapLibre GL (interactive polygon clustering and geospatial visualization).
* **Backend Target Architecture:** FastAPI, PostGIS, PostgreSQL, AWS Cloud hosting.
* **Blockchain Layer:** Polygon Proof-of-Stake for low-cost, high-throughput timestamp notarization and legal product passport minting.

---

## Earth Observation & AI Segmentation Pipeline

### 1. Multi-Sensor Satellite Data
* **Sentinel-2 Multi-Spectral:** Deployed during clear weather conditions to extract RGB and Near-Infrared (NIR) bands for canopy health and surface change analysis.
* **Sentinel-1 SAR Radar:** Operates through cloud cover and precipitation. Synthetic Aperture Radar measures surface roughness to clearly distinguish between **dense forest canopy (magenta)** and **cleared agricultural/pasture land (blue)**.

### 2. Deep Learning Segmentation (U-Net) & Change Detection
* `prepare_dataset.py`: Normalizes coordinates, applies geo-referencing, and standardizes imagery into uniform spatial tiles.
* `unet_train.py` & `train.py`: Trains an encoder-decoder convolutional neural network with skip connections to preserve high-resolution spatial boundaries of irregular forest edges.
* `evaluate.py` & `inference.py`: Runs automated inference benchmarks (Intersection over Union, Dice Score) and produces comparative delta masks before and after clearing events.

---

## Blockchain Traceability & Digital Passport

To provide immutable proof for customs and audit authorities:
1. The AI engine verifies that no deforestation occurred on the supplier's lot coordinates after the EUDR cutoff date.
2. A cryptographic hash containing plot boundaries, verification timestamp, and validation metrics is committed to the **Polygon** ledger.
3. The platform issues a **Legal Product Passport** (tamper-proof digital certificate with QR code verification) linked directly to the customs Due Diligence dossier.

---

## Business Model & Unit Economics

FarmRoots targets EU commodity importers, major food & wood distributors, and institutional lenders exposed to supply chain regulatory liabilities.

* **Revenue Streams:**
  * Tiered B2B SaaS Subscriptions (Standard & Premium).
  * Pay-per-Passport verification credits.
  * Direct enterprise ERP connector integration fees.

* **Unit Economics (Target: 1,000 Land Plots / Month):**
  * **Unit Price:** €50.00 / plot
  * **Variable Cost (COGS):** €18.00 / plot (Satellite API €10, Blockchain Gas €1, Compute/Processing €7)
  * **Contribution Margin:** 64.0% (€32.00 / plot)
  * **Traceable Fixed Costs:** €14,500.00 / month (DevOps, Regulatory, Onboarding, R&D)
  * **Total Overhead Costs:** €5,500.00 / month (Legal, Administrative, Marketing)
  * **Break-Even Volume:** 625 plots / month (€31,250.00 revenue)
  * **Payback Period:** 15.2 months

---

## Repository Structure

```text
FarmRoots/
├── Forest Segmented/          # Python AI pipeline (U-Net training & evaluation)
│   ├── dataset.yaml           # Dataset configuration & class definitions
│   ├── meta_data.csv          # Spatial coordinates mapping and ground truth index
│   ├── prepare_dataset.py     # Image normalization and tile cropping
│   ├── train.py               # Main segmentation training script
│   ├── unet_train.py          # PyTorch U-Net architecture routine
│   ├── unet_dataset.py        # PyTorch Dataset loader
│   ├── unet_evaluate.py       # Validation metrics evaluation (IoU, Dice)
│   ├── evaluate.py            # Global benchmark script
│   ├── inference.py           # Prediction script on single/batch GeoTIFFs
│   └── run_inference.sh       # Shell wrapper for remote executions
├── architecture/              # System architecture diagrams & data model documentation
│   ├── README.md              # Infrastructure breakdown
│   └── data-model.md          # Domain entity definitions
├── public/                    # Static assets, map layers, vector icons
├── src/
│   ├── components/            # Reusable UI elements (LotMap, RiskBadge, StatusIcon, Layout)
│   ├── mocks/                 # Mock database (Lots, Suppliers, Due Diligence, Blockchain)
│   ├── pages/                 # Route views (Dashboard, Suppliers, RiskAssessment, DueDiligence, Blockchain)
│   ├── services/              # API abstraction, risk engine, and blockchain services
│   ├── stores/                # Reactive state management stores (Zustand)
│   ├── types/                 # TypeScript interfaces and domain types
│   ├── App.tsx                # Main application component
│   └── main.tsx               # Client entry point
├── package.json               # Frontend dependencies
├── tailwind.config.ts         # Tailwind theme configuration
└── vite.config.ts             # Vite bundler configuration
```

---

## Getting Started

### 1. Interactive Web Dashboard
Prerequisites: Node.js (v18+)

```bash
# Clone the repository
git clone https://github.com/Sebastianelli-Nicola/FarmRoots-EUDR-Deforestation-AI.git
cd FarmRoots-EUDR-Deforestation-AI

# Install dependencies
npm install

# Start local development server
npm run dev
```

Open `http://localhost:5173` to explore the dashboard, interactive lot maps, supplier risk profiles, and due diligence reports.

### 2. Python AI Segmentation Pipeline
Prerequisites: Python 3.9+ with PyTorch (CUDA support recommended)

```bash
cd "Forest Segmented"
pip install -r requirements.txt
python unet_train.py
python inference.py
```

---

## Authors & Hackathon Context

Developed during the **Hack-AI-Thon 2026** (March 2026) at **Università Politecnica delle Marche (UNIVPM)**, awarded **1st Place Overall** by the academic and industrial evaluation panel.

* **Nicola Sebastianelli** — [GitHub](https://github.com/Sebastianelli-Nicola)
* **Filippo Cingolani** — [GitHub](https://github.com/fppcng)
* **Leonardo Bordoni** — [GitHub](https://github.com/leobordo)
* **Juri Vitali** — [GitHub](https://github.com/JuriVitali)
