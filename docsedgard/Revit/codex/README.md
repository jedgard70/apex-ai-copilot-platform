# Codex + Revit MCP via pyRevit Routes

Starter para conectar o Codex ao Revit usando MCP e pyRevit Routes.

## Arquitetura

```text
Codex
  -> MCP server Python em D:\Revit\codex\mcp_server
  -> pyRevit Routes em http://127.0.0.1:48884/revit_mcp
  -> Revit API
```

## Revit

No Revit, deixe ativo:

```text
pyRevit > Settings > Rotas > Servidor de Rotas (Beta)
Porta: 48884
```

Teste:

```powershell
Invoke-RestMethod http://localhost:48884/revit_mcp/status/
```

Resposta esperada inclui:

```text
health = healthy
revit_available = true
document_title = nome do arquivo aberto
```

## Codex

No `C:\Users\apexg\.codex\config.toml`, use:

```toml
[mcp_servers.revit]
command = "D:\\Revit\\codex\\mcp_server\\.venv\\Scripts\\python.exe"
args = ["D:\\Revit\\codex\\mcp_server\\server.py"]
```

Depois reinicie o Codex.

## Tools

- `revit_ping`: status do pyRevit Routes.
- `revit_active_document`: documento/projeto ativo.
- `revit_model_info`: resumo do modelo, niveis, ambientes, vistas e links.
- `revit_list_views`: lista vistas exportaveis.
- `revit_current_view_info`: informacoes da vista ativa.
- `revit_current_view_elements`: elementos visiveis na vista ativa.

## Observacao

A ponte antiga em `http://127.0.0.1:8765` foi substituida pelo pyRevit Routes em `48884`, que e mais estavel para chamadas ao Revit API.
