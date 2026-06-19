from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
    Image,
)

LOGO = r"D:\ebook\Ebook Guia Imoveis\pagina ebook gemini\jedgard-e.png"
COVER = r"D:\ebook\Ebook Guia Imoveis\pagina ebook gemini\cartaoebook.png"
OUT_CHECK = r"D:\AI Jedgard\outputs\produtos_ebook\checklist_premium_imprimivel_personalizado.pdf"
OUT_KIT = r"D:\AI Jedgard\outputs\produtos_ebook\kit_contratos_sem_surpresa_premium.pdf"

gold = colors.HexColor("#C8A84B")
gold_light = colors.HexColor("#F2D27A")
dark = colors.HexColor("#06090F")
panel = colors.HexColor("#0C1322")
muted = colors.HexColor("#64748B")
soft = colors.HexColor("#F8FAFC")
line = colors.HexColor("#CBD5E1")
red = colors.HexColor("#991B1B")


def styles():
    base = getSampleStyleSheet()
    base.add(ParagraphStyle(
        name="CoverTitle",
        parent=base["Title"],
        fontName="Helvetica-Bold",
        fontSize=25,
        leading=29,
        textColor=dark,
        alignment=TA_CENTER,
        spaceAfter=8,
    ))
    base.add(ParagraphStyle(
        name="CoverSub",
        parent=base["BodyText"],
        fontName="Helvetica",
        fontSize=11,
        leading=16,
        textColor=muted,
        alignment=TA_CENTER,
    ))
    base.add(ParagraphStyle(
        name="H1",
        parent=base["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=16,
        leading=20,
        textColor=dark,
        spaceBefore=10,
        spaceAfter=7,
    ))
    base.add(ParagraphStyle(
        name="H2",
        parent=base["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        textColor=red,
        spaceBefore=8,
        spaceAfter=5,
    ))
    base.add(ParagraphStyle(
        name="Body",
        parent=base["BodyText"],
        fontName="Helvetica",
        fontSize=9.2,
        leading=12.2,
        textColor=colors.HexColor("#1F2937"),
    ))
    base.add(ParagraphStyle(
        name="Small",
        parent=base["BodyText"],
        fontName="Helvetica",
        fontSize=8.3,
        leading=10.5,
        textColor=muted,
    ))
    base.add(ParagraphStyle(
        name="SmallWhite",
        parent=base["BodyText"],
        fontName="Helvetica",
        fontSize=8.6,
        leading=11,
        textColor=colors.white,
    ))
    return base


def footer(title):
    def draw(canvas, _doc):
        canvas.saveState()
        canvas.setFillColor(dark)
        canvas.rect(0, A4[1] - 0.55 * cm, A4[0], 0.55 * cm, fill=1, stroke=0)
        canvas.setFillColor(gold)
        canvas.setFont("Helvetica-Bold", 7.5)
        canvas.drawString(1.2 * cm, A4[1] - 0.35 * cm, "J. EDGARD ENGENHARIA & GESTAO")
        canvas.setFillColor(muted)
        canvas.setFont("Helvetica", 7.5)
        canvas.drawString(1.2 * cm, 0.55 * cm, title)
        canvas.drawRightString(A4[0] - 1.2 * cm, 0.55 * cm, f"Pagina {canvas.getPageNumber()}")
        canvas.restoreState()
    return draw


def add_cover(story, title, subtitle, product_tag):
    try:
        story.append(Image(LOGO, width=3.0 * cm, height=1.0 * cm, hAlign="CENTER"))
    except Exception:
        pass
    story.append(Spacer(1, 12))
    story.append(Paragraph(title, styles_obj["CoverTitle"]))
    story.append(Paragraph(subtitle, styles_obj["CoverSub"]))
    story.append(Spacer(1, 14))
    try:
        story.append(Image(COVER, width=16.3 * cm, height=8.9 * cm, hAlign="CENTER"))
        story.append(Spacer(1, 12))
    except Exception:
        pass
    tag = Table([[Paragraph(product_tag, styles_obj["SmallWhite"])]], colWidths=[15.5 * cm])
    tag.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), dark),
        ("BOX", (0, 0), (-1, -1), 1.0, gold),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(tag)
    story.append(PageBreak())


def checklist_table(story, heading, items):
    story.append(Paragraph(heading, styles_obj["H1"]))
    data = [["OK", "Verificacao premium", "Observacoes"]] + [["□", Paragraph(i, styles_obj["Small"]), ""] for i in items]
    table = Table(data, colWidths=[0.9 * cm, 10.8 * cm, 5.2 * cm], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), dark),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8.3),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.35, line),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(table)
    story.append(Spacer(1, 8))


def build_checklist():
    doc = SimpleDocTemplate(
        OUT_CHECK,
        pagesize=A4,
        rightMargin=1.3 * cm,
        leftMargin=1.3 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.0 * cm,
    )
    story = []
    add_cover(
        story,
        "CHECKLIST PREMIUM IMPRIMIVEL",
        "Vistoria inteligente para comprar, reformar ou contratar obra com menos risco",
        "Produto complementar do ebook Seu Imovel Sem Arrependimento | Dr. Jose Edgard de Oliveira",
    )
    intro = Table([[Paragraph("<b>Metodo de uso:</b> imprima, leve na visita, marque as verificacoes e fotografe qualquer ponto de duvida. Se aparecer trinca estrutural, umidade persistente, instalacao eletrica duvidosa ou divergencia documental, consulte um profissional habilitado antes de decidir.", styles_obj["Body"])]], colWidths=[17.0 * cm])
    intro.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFF7D6")),
        ("BOX", (0, 0), (-1, -1), 1, gold),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(intro)
    story.append(Spacer(1, 10))
    checklist_table(story, "1. Documentacao e historico do imovel", [
        "Solicitar matricula atualizada, IPTU e informacoes de area construida.",
        "Perguntar se houve ampliacao, reforma, regularizacao ou sinistro anterior.",
        "Conferir se vendedor/corretor aceita vistoria tecnica antes da decisao.",
        "Registrar o que fica no imovel e o que sera retirado na entrega.",
    ])
    checklist_table(story, "2. Estrutura, umidade e sinais ocultos", [
        "Procurar trincas diagonais em cantos de portas, janelas e paredes.",
        "Verificar manchas, bolhas, mofo, rodapes estufados e cheiro de umidade.",
        "Observar portas raspando, pisos desnivelados e esquadrias desalinhadas.",
        "Fotografar cada ponto suspeito de longe e de perto.",
    ])
    checklist_table(story, "3. Eletrica, hidraulica e seguranca", [
        "Abrir quadro eletrico e conferir identificacao dos circuitos.",
        "Testar tomadas, interruptores, iluminacao e capacidade para ar-condicionado.",
        "Abrir torneiras, chuveiros e descargas para avaliar pressao e vazamento.",
        "Conferir ralos, sifoes, registros e sinais de retorno de esgoto.",
    ])
    story.append(PageBreak())
    checklist_table(story, "4. Acabamentos, conforto e uso diario", [
        "Conferir portas, fechaduras, janelas, vidros e vedacoes.",
        "Verificar rejuntes, pisos ocos, azulejos soltos e areas molhadas.",
        "Avaliar ventilacao, insolacao, ruido externo e privacidade.",
        "Testar armarios, bancadas, garagem, acesso e manobra.",
    ])
    checklist_table(story, "5. Terreno, entorno e decisao final", [
        "Observar caimento do terreno e caminhos da agua de chuva.",
        "Verificar muros, divisas, calcadas, drenagem e obras vizinhas.",
        "Visitar a regiao em horarios diferentes.",
        "Definir se a decisao e comprar, negociar, reprovar ou aguardar laudo.",
    ])
    story.append(Paragraph("Resumo da decisao", styles_obj["H1"]))
    decision = Table([
        ["Pontos fortes", ""],
        ["Pontos de alerta", ""],
        ["Itens que exigem profissional", ""],
        ["Valor pedido", ""],
        ["Valor maximo seguro", ""],
        ["Decisao", "Comprar / Negociar / Reprovar / Aguardar laudo"],
    ], colWidths=[5.2 * cm, 11.8 * cm])
    decision.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), panel),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.white),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.35, line),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(decision)
    doc.build(story, onFirstPage=footer("Checklist Premium Imprimivel"), onLaterPages=footer("Checklist Premium Imprimivel"))


def kit_section(story, heading, paragraphs):
    story.append(Paragraph(heading, styles_obj["H1"]))
    for text in paragraphs:
        story.append(Paragraph(text, styles_obj["Body"]))


def build_kit():
    doc = SimpleDocTemplate(
        OUT_KIT,
        pagesize=A4,
        rightMargin=1.35 * cm,
        leftMargin=1.35 * cm,
        topMargin=1.2 * cm,
        bottomMargin=1.0 * cm,
    )
    story = []
    add_cover(
        story,
        "KIT CONTRATOS SEM SURPRESA",
        "Roteiro premium para revisar escopo, prazo, pagamento, alteracoes e entrega tecnica",
        "Material educativo e operacional | valide contratos reais com advogado e profissional tecnico habilitado",
    )
    note = Table([[Paragraph("<b>Aviso:</b> este kit nao substitui assessoria juridica. Ele organiza os pontos que normalmente geram prejuizo em obras: escopo vago, pagamento antecipado, prazo sem marco, alteracao sem aditivo e entrega sem vistoria.", styles_obj["Body"])]], colWidths=[17.0 * cm])
    note.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFF7D6")),
        ("BOX", (0, 0), (-1, -1), 1, gold),
        ("LEFTPADDING", (0, 0), (-1, -1), 12),
        ("RIGHTPADDING", (0, 0), (-1, -1), 12),
        ("TOPPADDING", (0, 0), (-1, -1), 10),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
    ]))
    story.append(note)
    kit_section(story, "1. Ficha de contratacao", [
        "<b>Contratante:</b> [nome, CPF/CNPJ, endereco].",
        "<b>Contratado:</b> [nome, CPF/CNPJ, registro profissional quando aplicavel].",
        "<b>Endereco da obra:</b> [endereco completo].",
        "<b>Objeto:</b> [servico exato contratado, sem expressoes genericas].",
        "<b>Documentos anexos:</b> proposta, escopo, cronograma, memorial, projetos, ART/RRT e fotos de referencia.",
    ])
    kit_section(story, "2. Clausulas essenciais", [
        "<b>Escopo:</b> o contratado executara somente os servicos listados no anexo de escopo tecnico. Qualquer item ausente dependera de aprovacao por escrito.",
        "<b>Pagamento:</b> pagamentos devem estar vinculados a etapas medidas e aceitas, evitando antecipacao sem entrega correspondente.",
        "<b>Prazo:</b> o prazo deve ter data de inicio, data de termino, condicoes para contagem e regras para atrasos justificados.",
        "<b>Materiais:</b> marcas, quantidades, padroes e substituicoes precisam ser aprovados antes da compra ou instalacao.",
        "<b>Alteracoes:</b> toda mudanca deve gerar aditivo com impacto de preco, prazo e aceite formal.",
        "<b>Entrega tecnica:</b> a entrega deve incluir vistoria, lista de pendencias, garantias, manuais e documentos tecnicos aplicaveis.",
    ])
    story.append(PageBreak())
    story.append(Paragraph("3. Matriz de riscos contratuais", styles_obj["H1"]))
    rows = [
        ["Tema", "Risco", "Blindagem recomendada"],
        ["Escopo", "Item importante fica fora da proposta.", "Anexo tecnico com inclusoes, exclusoes e padrao de acabamento."],
        ["Prazo", "Atraso vira discussao subjetiva.", "Cronograma com marcos e regras de reprogramacao."],
        ["Pagamento", "Valor pago antes da etapa pronta.", "Medicao, aceite e retencao de seguranca."],
        ["Materiais", "Troca por produto inferior.", "Aprovacao previa de marca e especificacao."],
        ["Garantia", "Defeito aparece e ninguem responde.", "Prazo, canal de acionamento e responsabilidade definidos."],
        ["Responsavel tecnico", "Obra sem supervisao habilitada.", "ART/RRT e responsavel identificado quando aplicavel."],
    ]
    table = Table(rows, colWidths=[3.2 * cm, 6.3 * cm, 7.4 * cm], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), dark),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.35, line),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("FONTSIZE", (0, 1), (-1, -1), 8.2),
    ]))
    story.append(table)
    story.append(Spacer(1, 10))
    kit_section(story, "4. Termo de entrega e pendencias", [
        "Na entrega, registre: data da vistoria, participantes, status geral, itens aprovados, pendencias, prazo de correcao e eventual retencao financeira.",
        "Toda pendencia deve ter responsavel e data limite. A aprovacao final deve ocorrer apenas depois da correcao dos itens criticos.",
    ])
    kit_section(story, "5. Perguntas antes de assinar", [
        "O que exatamente esta incluso e excluido?",
        "Quem compra materiais e quem responde por perdas?",
        "Como sera medida cada etapa?",
        "O que acontece se houver atraso?",
        "Como serao aprovadas mudancas de escopo?",
        "Qual documentacao tecnica sera entregue?",
    ])
    doc.build(story, onFirstPage=footer("Kit Contratos Sem Surpresa"), onLaterPages=footer("Kit Contratos Sem Surpresa"))


styles_obj = styles()
build_checklist()
build_kit()
