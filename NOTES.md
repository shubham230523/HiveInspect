# Hive Inspect Template Importer - Developer Notes

## Implementation Summary
The application is a robust React Native Web tool for importing Spectora inspection templates. It follows a clean architecture separating parsing, mapping, hierarchy building, and persistence.

## Features Implemented
1.  **XLS/XLSX Parsing**: Uses SheetJS to read Spectora exports with deterministic logic.
2.  **Full 42-Field Mapping**: Maps every source column. Core fields are promoted to domain models, while secondary fields are preserved as metadata.
3.  **Hierarchical Reconstruction**: Rebuilds the `Template > Section > Item > Comment` tree, preserving the original `Order` field.
4.  **Atomic Persistence**: Uses a PostgreSQL RPC function in Supabase to ensure entire templates are saved or updated (upserted) in a single transaction.
5.  **Answer Type-Aware Editing**: The editor recognizes types like `boolean`, `checkbox`, `date`, `number`, and `range`, displaying appropriate controls.
6.  **Multiple Choice Option Editor**: Allows adding, editing, and removing options for items.
7.  **Rich HTML Handling**: Preserves raw HTML in comment fields. Includes a "Preview HTML" feature in the editor using `dangerouslySetInnerHTML` for web.
8.  **Import Transparency Report**: Detailed post-import summary showing statistics, field fidelity (Supported vs Metadata vs Missing), and specific warnings for unsupported data (like Photos).
9.  **Independent Duplication**: Creates a deep copy of any template with entirely new UUIDs, ensuring total isolation between copies.
10. **Failure Resilience**: Handles invalid files, missing required headers, and malformed rows with user-friendly error messages.

## Field Handling Strategy
- **SUPPORTED**: Core fields (Name, Text, Order, Answer Type, Options) mapped to first-class properties.
- **PRESERVED_METADATA**: Secondary fields (Locked, Uses, Simple Format, Estimates) stored in a `metadata` JSONB column.
- **UNSUPPORTED_BUT_DETECTED**: Fields like `Default Photo 1` are detected; if they contain data, a warning is issued, and data is kept in metadata.
- **NOT_PRESENT_IN_SOURCE**: Distinguished from unsupported fields in the import report.

## Technical Stack
- **React Native / Expo**: Cross-platform core.
- **React Native Web**: Primary target platform.
- **TypeScript**: Full type safety including Answer Type enums.
- **Supabase**: Atomic upserts via PL/pgSQL functions.
- **Jest**: Comprehensive test suite (Parser, Mapper, Hierarchy, Importer, HTML, Robustness, Failure Cases).

## Test Strategy
- **Baseline Tests**: Models, Schema, and Basic Parsing.
- **Fidelity Tests**: HTML preservation, Entity handling, and Field Coverage.
- **Robustness Tests**: Generic import logic and arbitrary entity naming.
- **Failure Tests**: Missing headers and corrupt file handling.
- **Persistence Tests**: Repository mocks for Supabase integration.

## Known Limitations
- **Photos**: Migration of actual image files is out of scope. Presence of photo data is reported.
- **Advanced Answer Types**: Date and Number inputs are currently simulated with standard text/metadata editing in this version.

## AI Assistance
Developed with Gemini 2.0 Pro for architectural planning, step-by-step implementation, and test generation. Verified manually against the provided InterNACHI fixture.
