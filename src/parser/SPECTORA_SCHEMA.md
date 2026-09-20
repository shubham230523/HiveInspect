# Spectora Export Schema Documentation

This document describes the structure of the Spectora inspection template export (XLS/XLSX).

## Column Definitions (42 Total)

1. **Section Name**: The top-level category (e.g., "Exterior", "Roof").
2. **Item Name**: The specific component being inspected (e.g., "Siding", "Flashings").
3. **Comment Name**: The name/title of a specific observation or recommendation.
4. **Comment Text**: The detailed description of the observation (may contain HTML).
5. **Comment Type**: The classification of the comment (e.g., "Observation", "Limitation").
6. **Category**: Used for grouping items or comments.
7. **Multiple Choice Options**: Pipe-separated list of options for the item.
8. **Unit Type Options**: Options for units (if applicable).
9. **Recommendation**: Default recommendation text.
10. **Order**: The display order of the entity.
11. **Answer Type**: The type of input expected (e.g., "Multiple Choice", "Text").
12. **Default Value**: The pre-selected value.
13. **Default Value 2**: Secondary pre-selected value.
14. **Default Unit Type**: The default unit.
15. **Default Location**: The default location for the item.
16. **Default Estimate Min**: Minimum cost estimate.
17. **Default Estimate Max**: Maximum cost estimate.
18. **Locked**: Boolean indicating if the field is locked.
19. **Simple Format**: Boolean for simple display.
20. **Disable Photos**: Boolean to disable photo attachments.
21. **Uses**: Metadata about field usage.
22-41. **Default Photo 1-10 & Captions**: Placeholders for images and their captions.
42. **Last Modified**: Timestamp of the last change.

## Parsing Rules

- **Hierarchy**: Section > Item > Comment.
- **HTML**: `Comment Text` should be treated as HTML and preserved.
- **Ordering**: The `Order` column should be respected for all levels.
- **Empty Fields**: Distinguish between empty (not present) and unsupported content.
