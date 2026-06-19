from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image

ASSET_DIR = r"D:\ebook\Ebook Guia Imoveis\imagens ilustrativas"
LOGO = ASSET_DIR + r"\jedgard engenharia e gestao.png"
CONTRACT_IMG = ASSET_DIR + r"\a importacia dos contratos.png"
OUT = r"D:\AI Jedgard\outputs\produtos_ebook\kit_contratos_sem_surpresa_premium_layout.pdf"

gold = colors.HexColor("#C8A84B")
dark = colors.HexColor("#06090F")
panel = colors.HexColor("#0C1322")
muted = colors.HexColor("#64748B")
line = colors.HexColor("#CBD5E1")
cream = colors.HexColor("#FFF7D6")
red = colors.HexColor("#991B1B")
soft = colors.HexColor("#F8FAFC")

styles = getSampleStyleSheet()
styles.add(ParagraphStyle("CoverTitle", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=28, leading=32, textColor=gold, alignment=TA_CENTER))
styles.add(ParagraphStyle("CoverSub", parent=styles["BodyText"], fontName="Helvetica", fontSize=12, leading=17, textColor=colors.white, alignment=TA_CENTER))
styles.add(ParagraphStyle("H1P", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=17, leading=21, textColor=dark, spaceBefore=8, spaceAfter=7))
styles.add(ParagraphStyle("H2P", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=12, leading=15, textColor=red, spaceBefore=6, spaceAfter=4))
styles.add(ParagraphStyle("BodyP", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.6, leading=13.2, textColor=colors.HexColor("#111827"), spaceAfter=5))
styles.add(ParagraphStyle("SmallP", parent=styles["BodyText"], fontName="Helvetica", fontSize=8.4, leading=11, textColor=colors.HexColor("#1F2937")))
styles.add(ParagraphStyle("WhiteP", parent=styles["BodyText"], fontName="Helvetica-Bold", fontSize=8.6, leading=11, textColor=colors.white, alignment=TA_CENTER))


def header(title):
    def draw(canvas, _doc):
        w, h = A4
        canvas.saveState()
        canvas.setFillColor(dark)
        canvas.rect(0, h - 1.05 * cm, w, 1.05 * cm, fill=1, stroke=0)
        canvas.drawImage(LOGO, 1.2 * cm, h - 0.9 * cm, width=3.0 * cm, height=0.78 * cm, preserveAspectRatio=True, mask="auto")
        canvas.setFillColor(gold)
        canvas.setFont("Helvetica-Bold", 8.5)
        canvas.drawRightString(w - 1.2 * cm, h - 0.56 * cm, "SEU IMOVEL SEM ARREPENDIMENTO")
        canvas.setFillColor(muted)
        canvas.setFont("Helvetica", 7.4)
        canvas.drawString(1.2 * cm, 0.55 * cm, title)
        canvas.drawRightString(w - 1.2 * cm, 0.55 * cm, f"Pagina {canvas.getPageNumber()}")
        canvas.restoreState()
    return draw


def cover_bg(canvas, _doc):
    w, h = A4
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#F3F4F6"))
    canvas.rect(0, 0, w, h, fill=1, stroke=0)
    canvas.restoreState()


def doc():
    return SimpleDocTemplate(OUT, pagesize=A4, rightMargin=1.25 * cm, leftMargin=1.25 * cm, topMargin=1.35 * cm, bottomMargin=1.1 * cm)


def cover(story):
    story.append(Spacer(1, 0.2 * cm))
    card = Table([
        [Image(LOGO, width=6.0 * cm, height=2.35 * cm, hAlign="CENTER")],
        [Paragraph("KIT CONTRATOS<br/>SEM SURPRESA", styles["CoverTitle"])],
        [Paragraph("Roteiro premium para escopo, prazo, pagamento, alteracoes e entrega tecnica", styles["CoverSub"])],
    ], colWidths=[16.2 * cm])
    card.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), dark),
        ("BOX", (0, 0), (-1, -1), 1.2, gold),
        ("LEFTPADDING", (0, 0), (-1, -1), 18),
        ("RIGHTPADDING", (0, 0), (-1, -1), 18),
        ("TOPPADDING", (0, 0), (-1, -1), 14),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 14),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))
    story.append(card)
    story.append(Spacer(1, 0.65 * cm))
    story.append(Image(CONTRACT_IMG, width=12.0 * cm, height=12.0 * cm, hAlign="CENTER"))
    story.append(Spacer(1, 0.35 * cm))
    tag = Table([[Paragraph("Produto complementar premium | Seu Imovel Sem Arrependimento", styles["WhiteP"])]], colWidths=[13.5 * cm])
    tag.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), panel),
        ("BOX", (0, 0), (-1, -1), 0.8, gold),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(tag)
    story.append(PageBreak())


def note(text):
    t = Table([[Paragraph(text, styles["BodyP"])]], colWidths=[16.8 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), cream),
        ("BOX", (0, 0), (-1, -1), 1, gold),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return t


def field_table(rows):
    data = [["Campo", "Preenchimento"]] + rows
    t = Table(data, colWidths=[4.2 * cm, 12.6 * cm], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), dark),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("BACKGROUND", (0, 1), (0, -1), soft),
        ("FONTNAME", (0, 1), (0, -1), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.35, line),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("FONTSIZE", (0, 0), (-1, -1), 8.8),
    ]))
    return t


def clause_cards(items):
    rows = []
    for title, body in items:
        rows.append([Paragraph(f"<b>{title}</b><br/>{body}", styles["SmallP"])])
    t = Table(rows, colWidths=[16.8 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), soft),
        ("BOX", (0, 0), (-1, -1), 0.4, line),
        ("INNERGRID", (0, 0), (-1, -1), 0.25, line),
        ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("RIGHTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def build():
    story = []
    cover(story)
    story.append(note("<b>Aviso importante:</b> este kit e educativo e operacional. Ele nao substitui advogado, engenheiro, arquiteto ou responsavel tecnico. Antes de assinar contrato real, valide o texto com profissionais habilitados e adapte as clausulas ao escopo e a legislacao local."))
    story.append(Spacer(1, 10))
    story.append(Paragraph("1. Ficha de contratacao", styles["H1P"]))
    story.append(field_table([
        ["Contratante", "[nome, CPF/CNPJ, endereco]"],
        ["Contratado", "[nome, CPF/CNPJ, registro profissional quando aplicavel]"],
        ["Endereco da obra", "[endereco completo]"],
        ["Objeto", "[servico exato contratado, sem expressoes genericas]"],
        ["Valor total", "R$ [valor]"],
        ["Prazo", "[data de inicio] a [data de termino]"],
        ["Anexos", "proposta, escopo, cronograma, memorial, projetos, ART/RRT e fotos"],
    ]))
    story.append(Spacer(1, 10))
    story.append(Paragraph("2. Clausulas essenciais", styles["H1P"]))
    story.append(clause_cards([
        ("Escopo", "Executar somente os servicos listados no anexo tecnico. Item ausente depende de aprovacao por escrito."),
        ("Pagamento", "Vincular pagamentos a etapas medidas e aceitas. Evitar antecipacao sem entrega correspondente."),
        ("Prazo", "Definir data de inicio, data final, condicoes para contagem e regras para atrasos justificados."),
        ("Materiais", "Aprovar marcas, quantidades, padroes e substituicoes antes da compra ou instalacao."),
        ("Alteracoes", "Toda mudanca deve gerar aditivo com impacto de preco, prazo e aceite formal."),
        ("Entrega tecnica", "Incluir vistoria, pendencias, garantias, manuais e documentos tecnicos aplicaveis."),
    ]))
    story.append(PageBreak())
    story.append(Paragraph("3. Matriz de riscos contratuais", styles["H1P"]))
    rows = [
        ["Tema", "Risco", "Blindagem recomendada"],
        ["Escopo", "Item importante fica fora da proposta.", "Anexo tecnico com inclusoes, exclusoes e padrao de acabamento."],
        ["Prazo", "Atraso vira discussao subjetiva.", "Cronograma com marcos, causas justificadas e regra de reprogramacao."],
        ["Pagamento", "Valor pago antes da etapa pronta.", "Medicao, aceite formal e retencao de seguranca."],
        ["Materiais", "Troca por produto inferior.", "Aprovacao previa de marca, especificacao e equivalente tecnico."],
        ["Garantia", "Defeito aparece e ninguem responde.", "Prazo, canal de acionamento e responsabilidade definidos."],
        ["Responsavel tecnico", "Obra sem supervisao habilitada.", "ART/RRT e responsavel identificado quando aplicavel."],
    ]
    t = Table(rows, colWidths=[3.1 * cm, 6.1 * cm, 7.6 * cm], repeatRows=1, splitByRow=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), dark),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.35, line),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 7),
        ("RIGHTPADDING", (0, 0), (-1, -1), 7),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("FONTSIZE", (0, 0), (-1, -1), 8.4),
    ]))
    story.append(t)
    story.append(Spacer(1, 12))
    story.append(Paragraph("4. Aditivo de alteracao de escopo", styles["H1P"]))
    story.append(field_table([
        ["Contrato original", "[numero/data]"],
        ["Alteracao solicitada", "[descricao clara do que muda]"],
        ["Motivo", "[necessidade tecnica, escolha do cliente, imprevisto etc.]"],
        ["Impacto financeiro", "R$ [acrescimo/desconto]"],
        ["Impacto no prazo", "[dias a mais/a menos]"],
        ["Aceite", "[assinaturas/data]"],
    ]))
    story.append(PageBreak())
    story.append(Paragraph("5. Termo de entrega e pendencias", styles["H1P"]))
    story.append(field_table([
        ["Data da vistoria", "[data]"],
        ["Participantes", "[nomes]"],
        ["Status geral", "Aprovado / Aprovado com pendencias / Reprovado"],
        ["Pendencias", "[lista com responsavel e prazo]"],
        ["Retencao financeira", "R$ [se aplicavel]"],
        ["Prazo de correcao", "[data limite]"],
    ]))
    story.append(Spacer(1, 12))
    story.append(Paragraph("6. Perguntas antes de assinar", styles["H1P"]))
    questions = [
        ["□", "O que exatamente esta incluso e excluido?"],
        ["□", "Quem compra materiais e quem responde por perdas?"],
        ["□", "Como sera medida cada etapa?"],
        ["□", "O que acontece se houver atraso?"],
        ["□", "Como serao aprovadas mudancas de escopo?"],
        ["□", "Qual documentacao tecnica sera entregue?"],
    ]
    q = Table(questions, colWidths=[0.8 * cm, 16.0 * cm])
    q.setStyle(TableStyle([
        ("GRID", (0, 0), (-1, -1), 0.25, line),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 8),
        ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
        ("FONTSIZE", (0, 0), (-1, -1), 9.2),
    ]))
    story.append(q)
    doc().build(story, onFirstPage=cover_bg, onLaterPages=header("Kit Contratos Sem Surpresa"))


build()
