# MS Project Integration Module

This module provides full MS Project XML (MSPDI) import/export,
task sync, resource management, cost tracking and baseline comparison.

## Endpoints

- `POST /api/msproject/import` - Import MSPDI XML
- `GET /api/msproject/export` - Export current schedule as MSPDI XML
- `GET /api/msproject/tasks` - List tasks
- `GET /api/msproject/baseline` - Compare actual vs baseline

## Evidence Labels

- CONFIRMED: data from imported MSPDI XML
- USER_ENTERED: manual task updates
- SYSTEM_GENERATED: computed fields (dates, costs)
- UNKNOWN: missing or unresolved references
