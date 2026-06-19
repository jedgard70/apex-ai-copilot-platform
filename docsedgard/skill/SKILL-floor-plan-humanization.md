---
name: floor-plan-humanization
description: >
  Humanize architectural floor plans by adding realistic human figures, scale references,
  and occupancy scenarios. Use when the user asks to add people to floor plans, create
  occupancy visualizations, generate AI image prompts for floor plan rendering, or
  needs guidance for tools like Revit, SketchUp, or Blender for figure placement.
---

# Floor Plan Humanization

Ajuda engenheiros e arquitetos a humanizar plantas baixas adicionando figuras humanas,
referências de escala e cenários de ocupação realistas.

## Quando usar esta skill

- Usuário pede para "adicionar pessoas" ou "humanizar" uma planta baixa
- Usuário quer prompts para ferramentas de IA (DALL-E, Midjourney, Stable Diffusion)
- Usuário precisa de orientação para Revit, SketchUp ou Blender
- Usuário quer validar escala humana em projetos

---

## Padrões de Escala Humana

| Referência       | Medida           |
|------------------|------------------|
| Altura em pé     | 1,70–1,80 m      |
| Altura sentado   | 0,75–0,90 m      |
| Espaço pessoal   | 0,45–1,20 m      |
| Largura corredor mínima | 0,90 m  |
| Largura corredor confortável | 1,20 m |

---

## Prompts para IA (DALL-E / GPT-4V)

### Residencial
```
"Visão superior fotorrealista de planta baixa de apartamento moderno de [X] m².
Mostrar [N] pessoas: [descrever atividades]. Estilo de renderização arquitetônica
profissional, iluminação natural suave, sombras realistas, estética limpa e clara."
```

### Escritório
```
"Vista aérea de renderização arquitetônica de escritório de [X] m².
Mostrar [N] pessoas: [descrever atividades]. Estética corporativa moderna,
mobiliário contemporâneo, cores neutras, iluminação task. Perspectiva superior."
```

### Comercial / Hospitalidade
```
"Renderização profissional de planta baixa de [tipo] de [X] m² vista de cima.
Mostrar [N] clientes: [descrever atividades]. Iluminação interior aconchegante,
mobiliário e plantas. Visualização arquitetônica profissional de alta qualidade."
```

---

## Workflow Revit

### Passo 1 — Inserir Figuras
1. Guia **Insert** → **Load Family** → procurar `RPC People` ou `Entourage`
2. Ou: **Insert** → **Component** → **Place a Component**
3. Escolher figuras da biblioteca: `RPC Male`, `RPC Female`

### Passo 2 — Escalonar Corretamente
- Verificar altura real: 1,70–1,80 m no modelo
- Em vista de planta (Floor Plan), a figura aparece como silhueta oval/círculo
- Ajustar propriedades: `Instance Properties` → `Height`

### Passo 3 — Posicionar
- Usar `Snapping` para alinhar às paredes e mobiliário
- Criar múltiplos cenários com `View Templates` e `Visibility/Graphics`
- Usar `Phase` para mostrar diferentes estados de ocupação

### Passo 4 — Renderizar
- Abrir vista 3D: guia **View** → **3D View** → **Default 3D View**
- Ativar renderização: **View** → **Render**
- Configurar: qualidade `Medium` ou `High`, iluminação `Interior: Sun and Artificial`
- Exportar como imagem de alta resolução

---

## Workflow SketchUp

1. **Window** → **3D Warehouse** → pesquisar `human figure architecture`
2. Importar e escalar para dimensões do modelo (Height = 1,75 m)
3. Posicionar na planta usando snap às superfícies
4. Criar `Scenes` para diferentes variações de ocupação
5. Exportar como imagem em alta resolução ou PDF

---

## Workflow Blender

```
1. Importar planta baixa como imagem de fundo
2. Modelar ou importar figuras humanas em escala
3. Proporções: 1,70–1,80 m de altura
4. Posicionar com câmera ortográfica (escala real)
5. Adicionar iluminação básica e renderizar
6. Compor sombras para realismo
```

---

## Bibliotecas de Figuras Humanas 3D Gratuitas

| Biblioteca     | Indicação                          |
|----------------|------------------------------------|
| Sketchfab      | Buscar "human figure architecture" |
| CGTrader       | Figuras profissionais com rig      |
| TurboSquid     | Modelos comerciais de pessoas      |
| Poser/DAZ Studio | Plataforma dedicada a personagens |

---

## Checklist de Validação

- [ ] Altura da figura confere com a escala da planta
- [ ] Figuras se encaixam naturalmente nos espaços
- [ ] Alturas de portas/janelas compatíveis com proporção humana
- [ ] Escala do mobiliário coerente com as figuras
- [ ] Sombras com direção consistente
- [ ] Caminhos de circulação livres e lógicos
- [ ] Poses e atividades realistas
- [ ] Composição geral equilibrada
- [ ] Iluminação e cores com aparência profissional
- [ ] Todas as dimensões corretas

---

## Parâmetros Midjourney

```
--ar 4:3       (proporção para plantas baixas)
--style raw    (mais arquitetônico)
--quality 2    (melhor detalhe)
```

**Exemplo:**
```
/imagine planta baixa de loft moderno com 2 pessoas,
vista superior, visualização arquitetônica, fotorrealista,
escala 1:50 --ar 4:3 --quality 2
```

---

## Referências Adicionais

- **Escala humana padrão**: 1,65–1,80 m em pé; 0,75 m sentado
- **Espaço pessoal**: 0,45–1,20 m dependendo do contexto
- **Entourage**: bibliotecas profissionais de figuras para visualização arquitetônica
- **Architectural Graphics Standards** (Ramsey/Sleeper): referência de dimensões

---

## Workflow IA — Análise de Planta Baixa e Humanização Realista

### Como funciona
1. Usuário envia imagem da planta baixa
2. Claude analisa: cômodos, dimensões estimadas, circulação, tipo de uso
3. Claude gera prompts otimizados para DALL-E / Midjourney
4. Resultado: prompts prontos para gerar renderização fotorrealista com pessoas em escala 1:1 (1,70 m)

### Análise automática da planta
Ao receber uma imagem de planta baixa, identificar:
- Tipo de edificação: residencial, comercial, institucional
- Cômodos presentes e suas funções
- Fluxos de circulação principais
- Estimativa de área (se escala disponível)
- Quantidade sugerida de figuras humanas por ambiente

### Prompt padrão de análise (interno)
```
Analise esta planta baixa arquitetônica e retorne:
1. Tipo de edificação
2. Lista de ambientes identificados
3. Área estimada (se houver escala)
4. Sugestão de quantidade de pessoas por ambiente
5. Prompt otimizado para DALL-E para humanizar esta planta com figuras realistas em escala 1,70 m
```

### Parâmetros de escala das figuras (sempre 1,70 m)
- Todas as figuras humanas geradas devem ter 1,70 m de altura como padrão
- Em plantas escala 1:50: figura = 3,4 cm no desenho
- Em plantas escala 1:100: figura = 1,7 cm no desenho
- Em plantas escala 1:25: figura = 6,8 cm no desenho
