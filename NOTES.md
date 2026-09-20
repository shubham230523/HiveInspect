# Hive Inspect Template Importer - Developer Notes

## Implementation Summary
The application is a robust React Native Web tool for importing Spectora inspection templates. It follows a clean architecture separating parsing, mapping, hierarchy building, and persistence.

## Features Implemented
1. **XLS/XLSX Parsing**: Uses SheetJS to read Spectora exports.
2. **Deterministic Mapping**: Maps all 42 source columns into a normalized model.
3. **Hierarchy Building**: Groups rows into Template > Section > Item > Comment structure.
4. **Data Persistence**: Integrated with Supabase PostgreSQL (via repository pattern).
5. **Template Management**: List, delete, and open templates.
6. **Template Editor**: Edit template, section, and item comment text.
7. **Independent Duplication**: Creates a deep copy with new IDs for isolation.
8. **Trustworthy Import**: Reports statistics, warnings for unsupported fields (e.g., photos), and identifies malformed rows.
9. **HTML Preservation**: Original HTML in comment fields is preserved throughout the pipeline.

## 42 Source Fields Inspected
All 42 fields are mapped. Core fields like `Section Name`, `Item Name`, `Comment Text`, `Multiple Choice Options`, and `Order` are used for domain logic. Other metadata fields (e.g., `Locked`, `Disable Photos`, `Default Value`) are preserved in a `metadata` JSONB blob.

## Technical Stack
- **React Native / Expo**: Cross-platform core.
- **React Native Web**: Primary target platform.
- **TypeScript**: Type safety throughout.
- **XLSX (SheetJS)**: Deterministic spreadsheet parsing.
- **Zod**: Validation of domain models.
- **Supabase**: Backend persistence and API.
- **Jest**: Unit and integration testing.

## Test Strategy
- **Parser Tests**: Verifies header validation and row extraction using real fixtures.
- **Mapper Tests**: Ensures data types and specialized fields (Multiple Choice, Photos) are correctly transformed.
- **Hierarchy Tests**: Validates grouping and ordering logic.
- **Repository Tests**: Verifies database interactions using mocks.
- **Importer Tests**: End-to-end logic test using the provided InterNACHI XLS fixture.

## Known Limitations
- **Photos**: Currently reports data presence as warnings but does not migrate image files.
- **Rich Text Rendering**: UI displays HTML as raw text for editing safety; a future improvement could add a rich-text renderer.

## AI Assistance
Developed with Gemini 2.0 Pro for architectural planning, step-by-step implementation, and test generation.
