/**
 * api/permits/index.mjs — Shim de compatibilidade para Global Permits
 * Funcionalidade consolidada em modules/legal/backend/api.mjs (que já
 * trata rotas /api/permits/* internamente para compatibilidade de UI).
 */
export { default } from '../../modules/legal/backend/api.mjs'
