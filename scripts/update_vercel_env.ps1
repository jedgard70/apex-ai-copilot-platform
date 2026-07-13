$ErrorActionPreference = "Continue"

$env_vars = @{
    "VITE_SUPABASE_ANON_KEY" = "sb_publishable_QMXkDjATAl7B6SHmEvLvLQ_PY0ilGar"
    "SUPABASE_SERVICE_ROLE_KEY" = "sb_secret_brXqeRm3prcJzAsZ82Q-1A_wc9UQELr"
    "VITE_SUPABASE_URL" = "https://csvtkvyauusvtmrkqtzl.supabase.co"
    "SUPABASE_URL" = "https://csvtkvyauusvtmrkqtzl.supabase.co"
    "SUPABASE_PUBLISHABLE_KEY" = "sb_publishable_QMXkDjATAl7B6SHmEvLvLQ_PY0ilGar"
    "SUPABASE_SECRET_KEY" = "sb_secret_brXqeRm3prcJzAsZ82Q-1A_wc9UQELr"
    "SUPABASE_JWKS_URL" = "https://csvtkvyauusvtmrkqtzl.supabase.co/auth/v1/.well-known/jwks.json"
}

foreach ($key in $env_vars.Keys) {
    Write-Host ">>> Removendo $key (se existir)..."
    npx vercel env rm $key -y 2>$null

    $val = $env_vars[$key]
    Write-Host ">>> Adicionando $key..."
    # A Vercel cli pode ter problemas de input via pipe no Windows, 
    # mas tentar adicionar é o comportamento padrão.
    echo "$val" | npx vercel env add $key production preview development
}
Write-Host "Sincronização concluída."
