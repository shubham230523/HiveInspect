# Hive Inspect Template Importer

A robust web application built with React Native Web and TypeScript to streamline the process of migrating inspection templates from Spectora to Hive Inspect.

## 🚀 Key Features

-   **Deterministic XLS/XLSX Parsing**: Powered by SheetJS to handle large Spectora exports with precision.
-   **Full Schema Mapping**: Inspects and preserves all 42 Spectora source columns.
-   **Hierarchical Reconstruction**: Automatically rebuilds the `Template > Section > Item > Comment` relationship from flat spreadsheet rows.
-   **HTML Preservation**: Ensures rich text in inspection comments survives the import process.
-   **Supabase Integration**: Persistent storage using PostgreSQL with a clean repository pattern.
-   **Template Editor**: View and modify sections, items, and comments directly in the browser.
-   **Independent Duplication**: Create deep copies of templates with isolated IDs for safe editing.
-   **Trustworthy Import Reporting**: Detailed statistics, malformed row detection, and warnings for unsupported features (e.g., automated photo migration).

## 🛠 Tech Stack

-   **Frontend**: React Native Web, Expo, Expo Router
-   **Language**: TypeScript
-   **Data Validation**: Zod
-   **Parsing**: SheetJS (xlsx)
-   **Backend/Database**: Supabase (PostgreSQL)
-   **Testing**: Jest

## 📁 Project Structure

-   `src/app`: File-based routing (Templates list, Import, Editor)
-   `src/domain`: Core TypeScript models and interfaces
-   `src/parser`: Logic for Excel extraction, mapping, and hierarchy building
-   `src/repository`: Data access layer for Supabase
-   `src/validation`: Zod schemas for runtime data safety
-   `src/utils`: Shared utilities (ID generation, etc.)

## 🚦 Getting Started

### 1. Prerequisites
-   Node.js (v18+)
-   npm or yarn

### 2. Environment Setup
Create a `.env` file in the root (see `.env.example`):
```bash
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Database Setup
Execute the SQL found in `SCHEMA.sql` in your Supabase SQL Editor to create the necessary tables and indexes.

### 4. Installation
```bash
npm install
```

### 5. Running the App
```bash
# Start Web Development Server
npx expo start --web
```

### 6. Running Tests
```bash
npm test
```

## 🧪 Testing with Fixtures
The application includes a real-world test fixture located at:
`src/parser/__tests__/fixtures/InterNACHI Residential -2026-09-20.xls`

The automated test suite verifies that this 392-row file is correctly transformed into the expected hierarchical structure.

## 📝 Documentation
Detailed developer notes, including field mapping strategy and architecture decisions, can be found in [NOTES.md](./NOTES.md).
