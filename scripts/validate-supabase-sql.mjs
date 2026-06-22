import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const migrationsDir = path.join(root, 'supabase', 'migrations')

const requiredFiles = [
  '0001_initial_schema.sql',
  '0002_rls_policies.sql',
  '0003_storage_buckets.sql',
]

const requiredTables = [
  'profiles',
  'tenants',
  'tenant_members',
  'roles',
  'permissions',
  'role_permissions',
  'user_preferences',
  'audit_logs',
  'projects',
  'project_members',
  'project_files',
  'project_messages',
  'project_exports',
  'project_activity',
  'project_preferences',
  'archvis_sessions',
  'archvis_outputs',
  'archvis_prompts',
  'archvis_revision_constraints',
  'archvis_gallery_items',
  'directcut_sessions',
  'directcut_plans',
  'directcut_scenes',
  'directcut_storyboards',
  'directcut_gallery_items',
  'bim_models',
  'bim_viewer_sessions',
  'bim_findings',
  'bim_corrections',
  'bim_saved_views',
  'bim_tours',
  'bim_animation_paths',
  'bim_export_briefs',
  'budget_estimates',
  'budget_items',
  'budget_scope_items',
  'pricing_sources',
  'sinapi_sources',
  'evm_records',
  'schedule_tasks',
  'schedule_dependencies',
  'milestones',
  'contracts',
  'contract_clauses',
  'contract_risks',
  'permit_packages',
  'permit_documents',
  'permit_checklists',
  'document_trackers',
  'rdos',
  'rdo_activities',
  'field_photos',
  'field_issues',
  'punch_items',
  'safety_checklists',
  'quality_checklists',
  'nr_compliance_items',
  'corrective_actions',
  'research_sessions',
  'research_findings',
  'source_evidence',
  'market_reports',
  'proposal_outputs',
  'leads',
  'contacts',
  'companies',
  'opportunities',
  'proposals',
  'service_catalog',
  'invoices',
  'payments',
  'expenses',
  'accounting_entries',
  'accounts_receivable',
  'accounts_payable',
  'accountant_packages',
  'tax_prep_items',
  'suppliers',
  'procurement_items',
  'supplier_evaluations',
  'alerts',
  'ai_usage_records',
  'ai_cost_thresholds',
  'knowledge_items',
  'skill_updates',
  'skill_exports',
  'platform_audits',
  'devops_tasks',
  'repo_reviews',
  'digital_twin_items',
  'twin_events',
  'metrics_records',
  'health_checks',
  'pwa_settings',
  'sync_queue_items',
]

const requiredBuckets = [
  'project-uploads',
  'archvis-images',
  'generated-images',
  'directcut-media',
  'bim-models',
  'documents',
  'field-photos',
  'exports',
  'skill-files',
  'public-assets',
]

const forbiddenChecks = [
  { label: 'OpenAI-style API key', pattern: /sk-[A-Za-z0-9_-]{12,}/ },
  { label: 'JWT-like token', pattern: /eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/ },
  { label: 'OPENAI_API_KEY assignment', pattern: /OPENAI_API_KEY\s*=\s*[^,\s'")]+/i },
  { label: 'SUPABASE_SERVICE_ROLE_KEY assignment', pattern: /SUPABASE_SERVICE_ROLE_KEY\s*=\s*[^,\s'")]+/i },
]

const errors = []
const warnings = []

if (!fs.existsSync(migrationsDir)) {
  errors.push(`Missing migrations directory: ${path.relative(root, migrationsDir)}`)
}

const files = requiredFiles.map(file => {
  const fullPath = path.join(migrationsDir, file)
  if (!fs.existsSync(fullPath)) {
    errors.push(`Missing required migration draft: ${file}`)
    return { file, content: '' }
  }
  return { file, content: fs.readFileSync(fullPath, 'utf8') }
})

for (const { file, content } of files) {
  for (const check of forbiddenChecks) {
    if (check.pattern.test(content)) errors.push(`${file}: forbidden ${check.label} detected`)
  }
  if (/\bservice_role\b/i.test(content)) {
    warnings.push(`${file}: contains the term service_role; review manually if this ever becomes executable SQL.`)
  }
}

const initialSchema = files.find(item => item.file === '0001_initial_schema.sql')?.content || ''
const storageSchema = files.find(item => item.file === '0003_storage_buckets.sql')?.content || ''

const missingTables = requiredTables.filter(table => !initialSchema.includes(`public.${table}`))
if (missingTables.length) errors.push(`Missing required tables in 0001: ${missingTables.join(', ')}`)

const missingBuckets = requiredBuckets.filter(bucket => !storageSchema.includes(`'${bucket}'`))
if (missingBuckets.length) errors.push(`Missing required buckets in 0003: ${missingBuckets.join(', ')}`)

const rlsSchema = files.find(item => item.file === '0002_rls_policies.sql')?.content || ''
if (!/enable row level security/i.test(rlsSchema)) errors.push('0002 does not appear to enable RLS.')
if (!/app_private\.can_access_project/i.test(rlsSchema)) errors.push('0002 missing app_private project access helper usage.')
if (!/No policies are granted to anon/i.test(rlsSchema)) warnings.push('0002 missing explicit no-anon policy note.')

console.log('Supabase SQL migration validation')
console.log(`- Required files: ${requiredFiles.length - files.filter(item => !item.content).length}/${requiredFiles.length}`)
console.log(`- Required tables present: ${requiredTables.length - missingTables.length}/${requiredTables.length}`)
console.log(`- Required buckets present: ${requiredBuckets.length - missingBuckets.length}/${requiredBuckets.length}`)
console.log(`- Warnings: ${warnings.length}`)
for (const warning of warnings) console.log(`  warning: ${warning}`)

if (errors.length) {
  console.error(`- Errors: ${errors.length}`)
  for (const error of errors) console.error(`  error: ${error}`)
  process.exit(1)
}

console.log('- Status: OK')
