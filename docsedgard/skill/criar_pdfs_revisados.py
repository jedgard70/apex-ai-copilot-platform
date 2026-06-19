from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
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
    KeepTogether,
)

COVER = r"D:\ebook\Ebook Guia Imoveis\pagina ebook gemini\cartaoebook.png"
OUT_CHECK = r"D:\AI Jedgard\outputs\produtos_ebook\checklist_premium_imprimivel_revisado.pdf"
OUT_KIT = r"D:\AI Jedgard\outputs\produtos_ebook\kit_contratos_sem_surpresa_revisado.pdf"

gold = colors.HexColor("#C8A84B")
dark = colors.HexColor("#06090F")
panel = colors.HexColor("#0C1322")
muted = colors.HexColor("#64748B")
line = colors.HexColor("#CBD5E1")
red = colors.HexColor("#991B1B")
cream = colors.HexColor("#FFF7D6")


def make_styles():
    s = getSampleStyleSheet()
    s.add(ParagraphStyle("Brand", parent=s["Normal"], fontName="Helvetica-Bold", fontSize=10, leading=12, textColor=gold, alignment=TA_CENTER))
    s.add(ParagraphStyle("CoverTitle2", parent=s["Title"], fontName="Helvetica-Bold", fontSize=24, leading=28, textColor=dark, alignment=TA_CENTER, spaceAfter=8))
    s.add(ParagraphStyle("CoverSub2", parent=s["BodyText"], fontName="Helvetica", fontSize=10.5, leading=15, textColor=muted, alignment=TA_CENTER))
    s.add(ParagraphStyle("H1x", parent=s["Heading1"], fontName="Helvetica-Bold", fontSize=15, leading=18, textColor=dark, spaceBefore=8, spaceAfter=6))
    s.add(ParagraphStyle("H2x", parent=s["Heading2"], fontName="Helvetica-Bold", fontSize=11.5, leading=14, textColor=red, spaceBefore=7, spaceAfter=4))
    s.add(ParagraphStyle("BodyX", parent=s["BodyText"], fontName="Helvetica", fontSize=9.0, leading=12.2, textColor=colors.HexColor("#1F2937"), spaceAfter=5))
    s.add(ParagraphStyle("SmallX", parent=s["BodyText"], fontName="Helvetica", fontSize=8.2, leading=10.4, textColor=colors.HexColor("#334155")))
    s.add(ParagraphStyle("WhiteX", parent=s["BodyText"], fontName="Helvetica-Bold", fontSize=8.4, leading=10.5, textColor=colors.white, alignment=TA_CENTER))
    return s


styles = make_styles()


def page_brand(canvas, _doc, title):
    canvas.saveState()
    width, height = A4
    canvas.setFillColor(dark)
    canvas.rect(0, height - 0.72 * cm, width, 0.72 * cm, fill=1, stroke=0)
    canvas.setFillColor(gold)
    canvas.setFont("Helvetica-Bold", 8.5)
    canvas.drawString(1.2 * cm, height - 0.45 * cm, "J. EDGARD")
    canvas.setFont("Helvetica", 6.5)
    canvas.drawString(3.0 * cm, height - 0.45 * cm, "ENGENHARIA & GESTAO | GESTAO INTELIGENTE")
    canvas.setFillColor(muted)
    canvas.setFont("Helvetica", 7.2)
    canvas.drawString(1.2 * cm, 0.55 * cm, title)
    canvas.drawRightString(width - 1.2 * cm, 0.55 * cm, f"Pagina {canvas.getPageNumber()}")
    canvas.restoreState()


def doc_template(path):
    return SimpleDocTemplate(
        path,
        pagesize=A4,
        rightMargin=1.35 * cm,
        leftMargin=1.35 * cm,
        topMargin=1.15 * cm,
        bottomMargin=1.05 * cm,
    )


def cover(story, title, subtitle, tag):
    brand = Table([[Paragraph("J. EDGARD<br/><font size='6'>ENGENHARIA & GESTAO | GESTAO INTELIGENTE</font>", styles["Brand"])]], colWidths=[7.2 * cm])
    brand.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), dark),
        ("BOX", (0, 0), (-1, -1), 1, gold),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(brand)
    story.append(Spacer(1, 14))
    story.append(Paragraph(title, styles["CoverTitle2"]))
    story.append(Paragraph(subtitle, styles["CoverSub2"]))
    story.append(Spacer(1, 12))
    story.append(Image(COVER, width=15.3 * cm, height=8.35 * cm, hAlign="CENTER"))
    story.append(Spacer(1, 10))
    tag_box = Table([[Paragraph(tag, styles["WhiteX"])]], colWidths=[15.3 * cm])
    tag_box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), panel),
        ("BOX", (0, 0), (-1, -1), 1, gold),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    story.append(tag_box)
    story.append(PageBreak())


def note(text):
    box = Table([[Paragraph(text, styles["BodyX"])]], colWidths=[16.8 * cm])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), cream),
        ("BOX", (0, 0), (-1, -1), 1, gold),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 9),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 9),
    ]))
    return box


def check_table(story, heading, items):
    story.append(Paragraph(heading, styles["H1x"]))
    data = [["OK", "Verificacao", "Observacoes"]] + [["□", Paragraph(item, styles["SmallX"]), ""] for item in items]
    table = Table(data, colWidths=[0.85 * cm, 10.45 * cm, 5.45 * cm], repeatRows=1, splitByRow=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), dark),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.3, line),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(table)
    story.append(Spacer(1, 7))


def build_checklist():
    story = []
    cover(
        story,
        "CHECKLIST PREMIUM IMPRIMIVEL",
        "Vistoria inteligente para comprar, reformar ou contratar obra com menos risco",
        "Produto complementar do ebook Seu Imovel Sem Arrependimento",
    )
    story.append(note("<b>Como usar:</b> imprima este material e leve na visita. Marque os itens, escreva observacoes e fotografe os pontos criticos. Sinais de trinca estrutural, umidade persistente, eletrica irregular ou divergencia documental devem ser avaliados por profissional habilitado."))
    story.append(Spacer(1, 8))
    check_table(story, "1. Documentacao e historico", [
        "Solicitar matricula atualizada e conferir titularidade.",
        "Conferir IPTU, area do terreno e area construida.",
        "Perguntar se houve reforma, ampliacao ou regularizacao recente.",
        "Registrar o que fica no imovel e o que sera retirado.",
        "Confirmar se sera permitida vistoria tecnica antes da compra.",
    ])
    check_table(story, "2. Estrutura, trincas e umidade", [
        "Procurar trincas diagonais em cantos de portas e janelas.",
        "Verificar bolhas na pintura, mofo, rodapes estufados e cheiro de umidade.",
        "Observar pisos desnivelados, portas raspando e esquadrias fora de prumo.",
        "Checar manchas no teto, paredes externas e areas molhadas.",
        "Fotografar cada ponto suspeito de longe e de perto.",
    ])
    check_table(story, "3. Eletrica, hidraulica e seguranca", [
        "Abrir o quadro eletrico e verificar identificacao dos circuitos.",
        "Testar tomadas, interruptores, iluminacao e pontos de ar-condicionado.",
        "Perguntar sobre aterramento e capacidade eletrica instalada.",
        "Abrir torneiras, chuveiros e descargas para avaliar pressao e vazamento.",
        "Conferir ralos, sifoes, registros e sinais de retorno de esgoto.",
    ])
    story.append(PageBreak())
    check_table(story, "4. Acabamentos e conforto", [
        "Conferir portas, fechaduras, janelas, vidros e vedacoes.",
        "Verificar rejuntes, pisos ocos, azulejos soltos e bancadas.",
        "Avaliar ventilacao, insolacao, ruido externo e privacidade.",
        "Testar armarios, garagem, acesso, circulacao e manobra.",
    ])
    check_table(story, "5. Terreno, entorno e risco externo", [
        "Observar caimento do terreno e caminhos da agua de chuva.",
        "Verificar muros, divisas, calcadas, drenagem e obras vizinhas.",
        "Perguntar sobre enchentes, alagamentos ou movimentacao de solo.",
        "Visitar a regiao em horarios diferentes antes da decisao.",
    ])
    story.append(Paragraph("Resumo da decisao", styles["H1x"]))
    decision = Table([
        ["Pontos fortes", ""],
        ["Pontos de alerta", ""],
        ["Itens que exigem profissional", ""],
        ["Valor pedido", ""],
        ["Valor maximo seguro", ""],
        ["Decisao final", "Comprar / Negociar / Reprovar / Aguardar laudo"],
    ], colWidths=[5.1 * cm, 11.65 * cm])
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
    doc = doc_template(OUT_CHECK)
    doc.build(story, onFirstPage=lambda c, d: page_brand(c, d, "Checklist Premium Imprimivel"), onLaterPages=lambda c, d: page_brand(c, d, "Checklist Premium Imprimivel"))


def add_paras(story, heading, paragraphs):
    story.append(Paragraph(heading, styles["H1x"]))
    for text in paragraphs:
        story.append(Paragraph(text, styles["BodyX"]))


def build_kit():
    story = []
    cover(
        story,
        "KIT CONTRATOS SEM SURPRESA",
        "Roteiro para revisar escopo, prazo, pagamento, alteracoes e entrega tecnica",
        "Material educativo. Contratos reais devem ser validados com advogado e profissional tecnico habilitado.",
    )
    story.append(note("<b>Aviso importante:</b> este kit nao substitui assessoria juridica. Ele organiza pontos que costumam gerar prejuizo em obras: escopo vago, pagamento antecipado, prazo sem marco, alteracao sem aditivo e entrega sem vistoria."))
    story.append(Spacer(1, 8))
    add_paras(story, "1. Ficha de contratacao", [
        "<b>Contratante:</b> [nome, CPF/CNPJ, endereco].",
        "<b>Contratado:</b> [nome, CPF/CNPJ, registro profissional quando aplicavel].",
        "<b>Endereco da obra:</b> [endereco completo].",
        "<b>Objeto:</b> [servico exato contratado, sem expressoes genericas].",
        "<b>Documentos anexos:</b> proposta, escopo, cronograma, memorial, projetos, ART/RRT e fotos de referencia.",
    ])
    add_paras(story, "2. Clausulas essenciais", [
        "<b>Escopo:</b> o contratado executara somente os servicos listados no anexo tecnico. Qualquer item ausente depende de aprovacao por escrito.",
        "<b>Pagamento:</b> pagamentos devem estar vinculados a etapas medidas e aceitas, evitando antecipacao sem entrega correspondente.",
        "<b>Prazo:</b> o contrato deve ter data de inicio, data final, condicoes para contagem e regras para atrasos justificados.",
        "<b>Materiais:</b> marcas, quantidades, padroes e substituicoes precisam ser aprovados antes da compra ou instalacao.",
        "<b>Alteracoes:</b> toda mudanca deve gerar aditivo com impacto de preco, prazo e aceite formal.",
        "<b>Entrega tecnica:</b> a entrega deve incluir vistoria, lista de pendencias, garantias, manuais e documentos tecnicos aplicaveis.",
    ])
    story.append(PageBreak())
    story.append(Paragraph("3. Matriz de riscos contratuais", styles["H1x"]))
    rows = [
        ["Tema", "Risco", "Blindagem recomendada"],
        ["Escopo", "Item importante fica fora da proposta.", "Anexo tecnico com inclusoes, exclusoes e padrao de acabamento."],
        ["Prazo", "Atraso vira discussao subjetiva.", "Cronograma com marcos, causas justificadas e regra de reprogramacao."],
        ["Pagamento", "Valor pago antes da etapa pronta.", "Medicao, aceite formal e retencao de seguranca."],
        ["Materiais", "Troca por produto inferior.", "Aprovacao previa de marca, especificacao e equivalente tecnico."],
        ["Garantia", "Defeito aparece e ninguem responde.", "Prazo, canal de acionamento e responsabilidade definidos."],
        ["Responsavel tecnico", "Obra sem supervisao habilitada.", "ART/RRT e responsavel identificado quando aplicavel."],
    ]
    table = Table(rows, colWidths=[3.15 * cm, 6.15 * cm, 7.35 * cm], repeatRows=1, splitByRow=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), dark),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8.2),
        ("GRID", (0, 0), (-1, -1), 0.35, line),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ("FONTSIZE", (0, 1), (-1, -1), 8.1),
    ]))
    story.append(table)
    story.append(Spacer(1, 8))
    add_paras(story, "4. Aditivo de alteracao de escopo", [
        "<b>Use quando:</b> surgir qualquer mudanca de servico, material, prazo ou valor.",
        "<b>Campos minimos:</b> contrato original, descricao da alteracao, motivo, valor acrescido/descontado, impacto no prazo e aceite das partes.",
        "<b>Regra de ouro:</b> nao execute alteracao verbal. Primeiro aprove o aditivo, depois execute.",
    ])
    add_paras(story, "5. Termo de entrega e pendencias", [
        "Na entrega, registre data da vistoria, participantes, status geral, itens aprovados, pendencias, prazo de correcao e eventual retencao financeira.",
        "Toda pendencia deve ter responsavel e data limite. A aprovacao final deve ocorrer somente depois da correcao dos itens criticos.",
    ])
    add_paras(story, "6. Perguntas antes de assinar", [
        "O que exatamente esta incluso e excluido? Quem compra materiais e quem responde por perdas? Como sera medida cada etapa? O que acontece se houver atraso? Como serao aprovadas mudancas de escopo? Qual documentacao tecnica sera entregue?",
    ])
    doc = doc_template(OUT_KIT)
    doc.build(story, onFirstPage=lambda c, d: page_brand(c, d, "Kit Contratos Sem Surpresa"), onLaterPages=lambda c, d: page_brand(c, d, "Kit Contratos Sem Surpresa"))


build_checklist()
build_kit()
