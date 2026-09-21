# Hive Inspect Template Importer

A high-fidelity migration tool for converting Spectora inspection templates into structured Hive Inspect data. Built with React Native Web and TypeScript.

**[Live Demo on Vercel](https://hive-inspect-xi.vercel.app/)**


## 🌟 Enhanced Features

-   **Deterministic 42-Field Mapping**: Every Spectora column is accounted for, classified, and preserved.
-   **Hierarchical Re-building**: Reconstructs `Template > Section > Item > Comment` trees while respecting the original source `Order`.
-   **Transparency Reporting**: Post-import summary with detailed statistics and a "Preservation Check" to verify zero data loss.
-   **Smart Template Editor**:
    -   **Answer Type Aware**: Specialized controls for `boolean`, `date`, `number`, and `checkbox`.
    -   **Multiple Choice Editor**: Full CRUD support for item options.
    -   **HTML Preview**: Real-time rendering of rich text comments.
-   **Atomic Persistence**: Secure saving via PostgreSQL RPC functions in Supabase.
-   **Deep Duplication**: Create independent template copies with isolated UUIDs.
-   **Navigation Guard**: Detects and warns about unsaved changes in the editor.

## 🛠 Tech Stack

-   **Frontend**: Expo (React Native Web)
-   **Backend**: Supabase (PostgreSQL)
-   **Parsing**: SheetJS (xlsx)
-   **Validation**: Zod
-   **Testing**: Jest

## 🚀 Getting Started

### 1. Environment
Create a `.env` file from `.env.example`:
```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_ANON_KEY=...
```

### 2. Database
Run the SQL in `SCHEMA.sql` in your Supabase SQL Editor. This script is idempotent and sets up all tables, indexes, and the atomic import function.

### 3. Usage
```bash
npm install
npm run web
```

## 🧪 Verification
Run the automated test suite to verify fidelity and robustness:
```bash
npm test
```

Includes verification against:
- `src/parser/__tests__/fixtures/InterNACHI Residential -2026-09-20.xls` (Baseline)
- `src/parser/__tests__/fixtures/Alternative_Template.ts` (Synthetic/Generic)

## 📝 Technical Documentation
See [NOTES.md](./NOTES.md) for architectural details and field coverage classification.
