# Hive Inspect Template Importer - Final Developer Notes

## Project Overview
This application is a specialized tool for importing inspection templates from Spectora spreadsheet exports into Hive Inspect. It ensures data fidelity by reconstructing the original hierarchy and preserving all 42 possible source fields.

## Core Implementation
1.  **Deterministic Parsing**: Uses SheetJS (`xlsx`) for extraction. No AI/LLM is used for the core transformation logic.
2.  **Field Fidelity**: Implements a classification system for all 42 fields:
    -   `SUPPORTED`: Promoted to domain model properties.
    -   `PRESERVED_METADATA`: Stored in a JSONB blob.
    -   `UNSUPPORTED_BUT_DETECTED`: Warns the user if populated (e.g., Photos).
3.  **Atomic Persistence**: Uses a PostgreSQL RPC function (`import_template_hierarchy`) in Supabase to handle complex hierarchical data as a single transaction.
4.  **Answer Type Engine**: Recognizes Spectora answer types (`boolean`, `checkbox`, `date`, `number`, `range`). The editor provides specialized controls based on these types.
5.  **Option Editor**: A functional editor for Multiple Choice items, allowing adding, removing, and editing options.
6.  **Rich HTML Preservation**: 100% preservation of raw HTML tags and entities. The editor includes an "HTML Preview" toggle for inspectors.
7.  **Independent Duplication**: Creates a deep copy of any template with entirely new UUIDs, ensuring zero data leakage between original and copy.
8.  **Import Transparency**:
    -   **Summary Stats**: Counts rows, sections, items, and comments.
    -   **Preservation Check**: Compares source row counts against built entities to prove no rows were lost.
    -   **Row-Level Warnings**: Identifies exact rows where unsupported data (like Photos) was detected.

## Data Model
-   `Template`: Name, Source, Timestamps, Metadata.
-   `Section`: Name, Order, Metadata.
-   `Item`: Name, Order, AnswerType, Options, Category, Recommendation, Metadata.
-   `Comment`: Name, Text (HTML), Type, Order, Metadata.

## Verification & Testing
-   **Fixture Testing**: Verified against the provided `InterNACHI Residential` (392 rows).
-   **Robustness Testing**: Verified against a synthetic fixture (`Alternative_Template`) with arbitrary names and orders.
-   **Failure Testing**: Explicitly tests for missing headers and corrupt file formats.
-   **Automated Suites**: 35+ Jest tests covering Mapper, Hierarchy, Importer, HTML, and Failure Cases.

## Deliberate Cuts & Limitations
-   **Photo Migration**: Detects and reports the presence of photos/captions but does not migrate the actual image files.
-   **Scheduling/Portals**: As per instructions, focus was kept strictly on the Template Importer.

## AI Assistance
Developed with Gemini 2.0 Pro for architectural planning, iterative implementation, and test generation. All logic verified manually and via the automated test suite.
