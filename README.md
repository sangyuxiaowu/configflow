# OpsConfig Studio - Configuration System

<div align="center">

<p align="center">
  <b>Dual-end Collaborative Configuration Design and Visual Editing System for Developers and Ops</b>
</p>

<p align="center">
  <b>English</b> | <a href="./README.zh-CN.md">简体中文</a>
</p>

<p align="center">
  🚀 <a href="https://sangyuxiaowu.github.io/configflow"><b>Live Demo / Online App</b></a> &nbsp;|&nbsp;
  📖 <a href="#-table-of-contents">Documentation</a> &nbsp;|&nbsp;
  📦 <a href="#-getting-started">Getting Started</a>
</p>

[![Live Demo](https://img.shields.io/badge/Demo-Online_App-blue.svg?logo=googlechrome)](https://sangyuxiaowu.github.io/不知道)
[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](./LICENSE)
[![React](https://img.shields.io/badge/React-19.0-61dafb.svg?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178c6.svg?logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.0-646cff.svg?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg?logo=tailwindcss)](https://tailwindcss.com/)
![PWA](https://img.shields.io/badge/PWA-Ready-green.svg)

<p align="center">
  Developers define full JSON constraints, field documentation, and architecture reference templates.<br/>
  Ops enjoy zero-syntax-burden visual safe editing, real-time compliance validation, diff comparison, and one-click export.
</p>

</div>

---

## 📑 Table of Contents

- [Project Background & Pain Points](#-project-background--pain-points)
- [Key Features](#-key-features)
  - [1. Dev Schema Designer](#1-️-dev-schema-designer)
  - [2. Ops Visual Editor](#2-️-ops-visual-editor)
  - [3. Remote Integration & URL Query Loading](#3--remote-integration--url-query-loading)
  - [4. PWA & Offline-First Architecture](#4--pwa--offline-first-architecture)
- [Tech Stack](#️-tech-stack)
- [Directory Structure](#-directory-structure)
- [Getting Started](#-getting-started)
- [User Guide](#-user-guide)
- [在线体验与中文文档 (Chinese Version)](./README.zh-CN.md)

---

## 📖 Project Background & Pain Points

In distributed systems, microservice architectures, and on-premise private deployment operations, configuration files (JSON / YAML) are often a frequent source of system outages:

| Traditional Config Maintenance Pain Points | OpsConfig Studio Solutions |
| :--- | :--- |
| **Error-prone hand-written syntax**: Manual editing of JSON/YAML easily misses commas, quotes, or indentation hierarchy | **Adaptive Forms**: Dynamically generates type-safe visual forms according to configuration specs, eliminating syntax cognitive burden |
| **Ambiguous field semantics**: Ops face hundreds of parameter lines without understanding their intent, leading to misconfigurations | **Embedded business documentation**: Every field carries a human-friendly name, detailed description, unit, placeholder, and restart alert |
| **Out-of-range parameters and crashes**: Port collisions, numerical overflow, or invalid formats cause service startup failures | **Real-time interactive validation**: Built-in strong typing and regex validation block invalid input instantly with highlighted alerts |
| **Lack of standard environment examples**: Ops are unsure how to tune multi-environment configurations (Dev / Test / Prod HA) | **Architecture reference template library**: Devs provide recommended architecture configs for Ops to reference and apply in one click |
| **Untracked modifications**: Hard to quickly verify which config items were changed after editing | **Real-time Diff viewer**: Intelligently compares current edits against original baseline, highlighting all additions, modifications, and deletions |
| **Air-gapped network restrictions**: Production server rooms are often isolated intranet environments | **PWA Offline-First support**: Service Worker caches assets offline, allowing full functionality and export without an internet connection |

---

## ✨ Key Features

### 1. 🛠️ Dev Schema Designer
- **Intelligent Schema Inference**: One-click paste or upload of full production JSON; system recursively infers field types, default values, and nested hierarchies.
- **11 Strongly Typed Field Kinds**:
  - Basic types: `string` (text), `number` (numeric), `boolean` (toggle), `enum` (dictionary / options)
  - Network & Security: `port` (network port 1–65535 validation), `ip` (IPv4 validation), `url` (protocol URL), `secret` (masked password / token)
  - Complex types: `array_string` (string array / tag list), `object` (nested object), `array_object` (object array / service monitoring list with custom sub-field definitions)
- **High-Risk & Operational Alert Badges**:
  - Mark **Dangerous Parameters**: Red alert highlights to prevent accidental modification of critical keys.
  - Mark **Requires Restart**: Explicitly informs deployment cost, helping Ops schedule maintenance windows.
  - Mark **Secret Configuration**: Masked by default in Ops view with one-click reveal.
- **Architecture Reference Examples Editor**:
  - Configure multiple typical environments (e.g., `Production High Availability (Prod HA)`, `Staging / Rehearsal`, `Development Standalone`).
  - Specify use cases, recommended hardware specs, and full JSON configs, giving Ops authoritative paradigms.

### 2. ⚡ Ops Visual Editor
- **Zero Syntax Burden Editing**: Pure UI interactions, card-based grouping, search filtering, and collapsible sections.
- **Real-Time Compliance Validation Engine**: Instant feedback on type mismatches, range violations, regex errors, or missing required fields.
- **One-Click Reference Architecture Adoption & Drawer**: Right-side drawer showcases architectural reference examples, ready to be applied into the active configuration with a single click.
- **Diff Viewer**: Clearly highlights added, modified, and deleted fields along with before-and-after values.
- **Multi-Format Export & Download**:
  - Export production-ready formatted `JSON`
  - Export `YAML`
  - Export `.env` environment variable format
  - Export full `Schema Package` (for continuous maintenance)

### 3. 🌐 Remote Integration & URL Query Loading
- Support URL query parameters to remotely load configs or schemas:
  - `?load=https://your-domain.com/config.json`
  - `?config=https://your-domain.com/schema.json`
- Support fetching and parsing raw URLs directly via HTTP/HTTPS or GitHub / Gist links from the UI.

### 4. 📱 PWA & Offline-First Architecture
- Built-in Progressive Web App support with Service Worker caching.
- Installable on desktop (Chrome / Edge / Safari) and mobile as a standalone app.
- Network status sensor automatically switches to local cache mode when disconnected.

---

## 🛠️ Tech Stack

- **Core Framework**: [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite 8](https://vitejs.dev/)
- **Styling & Design**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Animation**: [Motion](https://motion.dev/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **PWA Plugin**: `vite-plugin-pwa` + `sharp` icon generation pipeline

---

## 📁 Directory Structure

```text
├── public/                 # Static assets and PWA icons
├── src-tauri/              # Tauri 2 desktop configuration and Rust entry
├── scripts/
│   └── generate-icons.js   # Script to generate multi-size PWA icons
├── src/
│   ├── components/
│   │   ├── common/         # Common components (Load modal, global Toast notifications)
│   │   ├── dev/            # Dev designer components (Schema designer, rule editor, reference examples, export)
│   │   ├── ops/            # Ops editor components (Visual forms, field renderers, reference drawer, diff viewer)
│   │   └── pwa/            # Offline indicator and PWA install button
│   ├── data/
│   │   └── mockTemplates.ts# Curated official templates (e.g., watchdog monitor full spec)
│   ├── hooks/
│   │   ├── useOnlineStatus.ts # Online status listener Hook
│   │   └── usePWAInstall.ts   # PWA installation prompt Hook
│   ├── types/
│   │   └── config.ts       # Core data models (FieldDefinition, ConfigSchemaPackage, ValidationError)
│   ├── utils/
│   │   ├── schemaInfer.ts  # JSON automatic inference and schema parsing engine
│   │   └── validator.ts    # Field constraint and compliance validation engine
│   ├── App.tsx             # Application entry and dual-end toggle logic
│   ├── index.css           # Global stylesheet (Tailwind v4)
│   └── main.tsx            # Application mount point
├── metadata.json           # Application metadata
├── package.json            # Dependencies and script definitions
├── LICENSE                 # Apache 2.0 Open Source License
├── README.md               # English project documentation
└── README.zh-CN.md         # Chinese project documentation
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm / pnpm / yarn / bun

### 1. Clone the Repository
```bash
git clone https://github.com/sangyuxiaowu/configflow.git
cd configflow
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Development server will run at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
```
Before building, it automatically runs `scripts/generate-icons.js` to generate PWA icons of various sizes, outputting the production bundle to the `dist/` directory.

### 5. Preview Production Build
```bash
npm run preview
```

### 6. Desktop App Development & Packaging
Desktop app requires Rust stable toolchain; Windows also requires Microsoft C++ Build Tools and WebView2 Runtime.

```bash
npm run dev:tauri
```

Build the Windows installer (or the desktop bundle for your platform):

```bash
npm run build:tauri
```

The Tauri build automatically generates desktop icons and bundles the web frontend without PWA Service Worker; installers are output to `src-tauri/target/release/bundle/`.

---

## 💡 User Guide

### Scenario 1: Developer Customizing Configuration Templates
1. Switch to **"Dev (Schema Design)"** in the top navigation bar.
2. Click **"Import JSON to Auto Generate"**, paste your existing JSON configuration into the dialog, and click **"Parse and Generate Schema"**.
3. The system automatically populates all field definitions:
   - Provide human-readable labels and descriptions.
   - Set constraint ranges (port limits, regex patterns, enum options).
   - Flag sensitive passwords as **"Secret (Masked)"**; flag high-risk settings as **"Dangerous Parameter"**.
4. Switch to the **"Reference Examples"** tab to add standard production / staging recommendations.
5. Click **"Export Schema Package"** in the top-right corner to share the JSON schema with your Ops team or commit it to your repository.

### Scenario 2: Ops Safely Editing Configurations
1. Switch to **"Ops (Visual Safe Editing)"**.
2. The interface displays clearly categorized form cards supporting instant input, toggles, and dropdowns.
3. Click the **"Reference Examples"** drawer on the right to review developer recommendations and load them into the form with one click.
4. During editing, the validation engine provides real-time alerts for blocking errors (red) and warnings (yellow).
5. When finished, click **"Export / Download Config"** to review the change diff and download formatted `JSON` or `YAML`.

---
