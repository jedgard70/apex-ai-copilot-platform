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
)

ASSET_DIR = r"D:\ebook\Ebook Guia Imoveis\imagens ilustrativas"
LOGO = ASSET_DIR + r"\jedgard engenharia e gestao.png"
CHECK_IMG = ASSET_DIR + r"\checklist casa pronta .png"
CONTRACT_IMG = ASSET_DIR + r"\a importacia dos contratos.png"

OUT_CHECK = r"D:\AI Jedgard\outputs\produtos_ebook\checklist_premium_imprimivel_corrigido.pdf"
OUT_KIT = r"D:\AI Jedgard\outputs\produtos_ebook\kit_contratos_sem_surpresa_corrigido.pdf"

gold = colors.HexColor("#C8A84B")
dark = colors.HexColor("#06090F")
panel = colors.HexColor("#0C1322")
muted = colors.HexColor("#64748B")
line = colors.HexColor("#CBD5E1")
cream = colors.HexColor("#FFF7D6")
red = colors.HexColor("#991B1B")


def make_styles():
    s = getSampleStyleSheet()
    s.add(ParagraphStyle("CoverTitleClean", parent=s["Title"], fontName="Helvetica-Bold", fontSize=25, leading=29, textColor=gold, alignment=TA_CENTER, spaceAfter=7))
    s.add(ParagraphStyle("CoverSubClean", parent=s["BodyText"], fontName="Helvetica", fontSize=11.5, leading=16, textColor=colors.white, alignment=TA_CENTER))
    s.add(ParagraphStyle("CoverTagClean", parent=s["BodyText"], fontName="Helvetica-Bold", fontSize=8.8, leading=11, textColor=gold, alignment=TA_CENTER))
    s.add(ParagraphStyle("H1Clean", parent=s["Heading1"], fontName="Helvetica-Bold", fontSize=15.5, leading=19, textColor=dark, spaceBefore=9, spaceAfter=6))
    s.add(ParagraphStyle("BodyClean", parent=s["BodyText"], fontName="Helvetica", fontSize=9.4, leading=12.8, textColor=colors.HexColor("#1F2937"), spaceAfter=5))
    s.add(ParagraphStyle("SmallClean", parent=s["BodyText"], fontName="Helvetica", fontSize=8.3, leading=10.8, textColor=colors.HexColor("#334155")))
    return s


styles = make_styles()


def later_header(title):
    def draw(canvas, _doc):
        width, height = A4
        canvas.saveState()
        canvas.setFillColor(dark)
        canvas.rect(0, height - 1.0 * cm, width, 1.0 * cm, fill=1, stroke=0)
        canvas.drawImage(LOGO, 1.2 * cm, height - 0.88 * cm, width=2.75 * cm, height=0.72 * cm, preserveAspectRatio=True, mask="auto")
        canvas.setFillColor(gold)
        canvas.setFont("Helvetica-Bold", 8.5)
        canvas.drawRightString(width - 1.2 * cm, height - 0.55 * cm, "SEU IMOVEL SEM ARREPENDIMENTO")
        canvas.setFillColor(muted)
        canvas.setFont("Helvetica", 7.5)
        canvas.drawString(1.2 * cm, 0.55 * cm, title)
        canvas.drawRightString(width - 1.2 * cm, 0.55 * cm, f"Pagina {canvas.getPageNumber()}")
        canvas.restoreState()
    return draw


def first_page_no_header(canvas, _doc):
    canvas.saveState()
    canvas.setFillColor(colors.HexColor("#F3F4F6"))
    canvas.rect(0, 0, A4[0], A4[1], fill=1, stroke=0)
    canvas.restoreState()


def template(path):
    return SimpleDocTemplate(
        path,
        pagesize=A4,
        rightMargin=1.45 * cm,
        leftMargin=1.45 * cm,
        topMargin=1.3 * cm,
        bottomMargin=1.15 * cm,
    )


def cover(story, title, subtitle, image_path, image_w, image_h):
    story.append(Spacer(1, 0.25 * cm))
    card = Table([
        [Image(LOGO, width=5.7 * cm, height=2.25 * cm, hAlign="CENTER")],
        [Paragraph(title, styles["CoverTitleClean"])],
        [Paragraph(subtitle, styles["CoverSubClean"])],
        [Paragraph("PRODUTO COMPLEMENTAR PREMIUM", styles["CoverTagClean"])],
    ], colWidths=[16.0 * cm])
    card.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), dark),
        ("BOX", (0, 0), (-1, -1), 1.1, gold),
        ("LEFTPADDING", (0, 0), (-1, -1), 18),
        ("RIGHTPADDING", (0, 0), (-1, -1), 18),
        ("TOPPADDING", (0, 0), (-1, -1), 12),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 12),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))
    story.append(card)
    story.append(Spacer(1, 0.85 * cm))
    story.append(Image(image_path, width=image_w, height=image_h, hAlign="CENTER"))
    story.append(Spacer(1, 0.5 * cm))
    note = Table([[Paragraph("Seu Imovel Sem Arrependimento | Dr. Jose Edgard de Oliveira", styles["CoverTagClean"])]], colWidths=[12.8 * cm])
    note.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), panel),
        ("BOX", (0, 0), (-1, -1), 0.8, gold),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    story.append(note)
    story.append(PageBreak())


def note_box(text):
    box = Table([[Paragraph(text, styles["BodyClean"])]], colWidths=[16.2 * cm])
    box.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), cream),
        ("BOX", (0, 0), (-1, -1), 0.9, gold),
        ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10),
        ("TOPPADDING", (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
    ]))
    return box


def checklist_table(story, heading, items):
    story.append(Paragraph(heading, styles["H1Clean"]))
    data = [["OK", "Verificacao", "Observacoes"]] + [["□", Paragraph(i, styles["SmallClean"]), ""] for i in items]
    table = Table(data, colWidths=[0.8 * cm, 10.1 * cm, 5.3 * cm], repeatRows=1, splitByRow=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), dark),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8.2),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.3, line),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5.5),
    ]))
    story.append(table)
    story.append(Spacer(1, 7))


def build_checklist():
    story = []
    cover(
        story,
        "CHECKLIST PREMIUM IMPRIMIVEL",
        "Vistoria inteligente antes de comprar, reformar ou contratar obra",
        CHECK_IMG,
        10.8 * cm,
        8.75 * cm,
    )
    story.append(note_box("<b>Como usar:</b> imprima este material e leve na visita. Marque cada verificacao, escreva observacoes e fotografe pontos criticos. Se aparecer trinca estrutural, umidade persistente, eletrica irregular ou divergencia documental, consulte profissional habilitado antes de decidir."))
    story.append(Spacer(1, 8))
    checklist_table(story, "1. Documentacao e historico", [
        "Solicitar matricula atualizada e conferir titularidade.",
        "Conferir IPTU, area do terreno e area construida.",
        "Perguntar se houve reforma, ampliacao ou regularizacao recente.",
        "Registrar o que fica no imovel e o que sera retirado.",
        "Confirmar se sera permitida vistoria tecnica antes da compra.",
    ])
    checklist_table(story, "2. Estrutura, trincas e umidade", [
        "Procurar trincas diagonais em cantos de portas e janelas.",
        "Verificar bolhas na pintura, mofo, rodapes estufados e cheiro de umidade.",
        "Observar pisos desnivelados, portas raspando e esquadrias fora de prumo.",
        "Checar manchas no teto, paredes externas e areas molhadas.",
        "Fotografar cada ponto suspeito de longe e de perto.",
    ])
    story.append(PageBreak())
    checklist_table(story, "3. Eletrica, hidraulica e seguranca", [
        "Abrir o quadro eletrico e verificar identificacao dos circuitos.",
        "Testar tomadas, interruptores, iluminacao e pontos de ar-condicionado.",
        "Perguntar sobre aterramento e capacidade eletrica instalada.",
        "Abrir torneiras, chuveiros e descargas para avaliar pressao e vazamento.",
        "Conferir ralos, sifoes, registros e sinais de retorno de esgoto.",
    ])
    checklist_table(story, "4. Acabamentos, conforto e uso diario", [
        "Conferir portas, fechaduras, janelas, vidros e vedacoes.",
        "Verificar rejuntes, pisos ocos, azulejos soltos e bancadas.",
        "Avaliar ventilacao, insolacao, ruido externo e privacidade.",
        "Testar armarios, garagem, acesso, circulacao e manobra.",
    ])
    checklist_table(story, "5. Terreno, entorno e risco externo", [
        "Observar caimento do terreno e caminhos da agua de chuva.",
        "Verificar muros, divisas, calcadas, drenagem e obras vizinhas.",
        "Perguntar sobre enchentes, alagamentos ou movimentacao de solo.",
        "Visitar a regiao em horarios diferentes antes da decisao.",
    ])
    story.append(PageBreak())
    story.append(Paragraph("Resumo da decisao", styles["H1Clean"]))
    decision = Table([
        ["Pontos fortes", ""],
        ["Pontos de alerta", ""],
        ["Itens que exigem profissional", ""],
        ["Valor pedido", ""],
        ["Valor maximo seguro", ""],
        ["Decisao final", "Comprar / Negociar / Reprovar / Aguardar laudo"],
    ], colWidths=[5.0 * cm, 11.2 * cm])
    decision.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), panel),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.white),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("GRID", (0, 0), (-1, -1), 0.35, line),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING", (0, 0), (-1, -1), 11),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 11),
    ]))
    story.append(decision)
    doc = template(OUT_CHECK)
    doc.build(story, onFirstPage=first_page_no_header, onLaterPages=later_header("Checklist Premium Imprimivel"))


def paras(story, heading, texts):
    story.append(Paragraph(heading, styles["H1Clean"]))
    for text in texts:
        story.append(Paragraph(text, styles["BodyClean"]))


def build_kit():
    story = []
    cover(
        story,
        "KIT CONTRATOS SEM SURPRESA",
        "Roteiro premium para escopo, prazo, pagamento, alteracoes e entrega tecnica",
        CONTRACT_IMG,
        9.8 * cm,
        9.8 * cm,
    )
    story.append(note_box("<b>Aviso importante:</b> este kit e educativo e operacional. Ele nao substitui advogado, engenheiro, arquiteto ou responsavel tecnico. Antes de assinar contrato real, valide o texto com profissionais habilitados e adapte as clausulas ao escopo e a legislacao local."))
    story.append(Spacer(1, 8))
    paras(story, "1. Ficha de contratacao", [
        "<b>Contratante:</b> [nome, CPF/CNPJ, endereco].",
        "<b>Contratado:</b> [nome, CPF/CNPJ, registro profissional quando aplicavel].",
        "<b>Endereco da obra:</b> [endereco completo].",
        "<b>Objeto:</b> [servico exato contratado, sem expressoes genericas].",
        "<b>Anexos obrigatorios:</b> proposta, escopo, cronograma, memorial, projetos, ART/RRT e fotos de referencia.",
    ])
    paras(story, "2. Clausulas essenciais", [
        "<b>Escopo:</b> o contratado executara somente os servicos listados no anexo tecnico. Qualquer item ausente depende de aprovacao por escrito.",
        "<b>Pagamento:</b> pagamentos devem estar vinculados a etapas medidas e aceitas, evitando antecipacao sem entrega correspondente.",
        "<b>Prazo:</b> o contrato deve ter data de inicio, data final, condicoes para contagem e regras para atrasos justificados.",
        "<b>Materiais:</b> marcas, quantidades, padroes e substituicoes precisam ser aprovados antes da compra ou instalacao.",
        "<b>Alteracoes:</b> toda mudanca deve gerar aditivo com impacto de preco, prazo e aceite formal.",
        "<b>Entrega tecnica:</b> a entrega deve incluir vistoria, lista de pendencias, garantias, manuais e documentos tecnicos aplicaveis.",
    ])
    story.append(PageBreak())
    story.append(Paragraph("3. Matriz de riscos contratuais", styles["H1Clean"]))
    rows = [
        ["Tema", "Risco", "Blindagem recomendada"],
        ["Escopo", "Item importante fica fora da proposta.", "Anexo tecnico com inclusoes, exclusoes e padrao de acabamento."],
        ["Prazo", "Atraso vira discussao subjetiva.", "Cronograma com marcos, causas justificadas e regra de reprogramacao."],
        ["Pagamento", "Valor pago antes da etapa pronta.", "Medicao, aceite formal e retencao de seguranca."],
        ["Materiais", "Troca por produto inferior.", "Aprovacao previa de marca, especificacao e equivalente tecnico."],
        ["Garantia", "Defeito aparece e ninguem responde.", "Prazo, canal de acionamento e responsabilidade definidos."],
        ["Responsavel tecnico", "Obra sem supervisao habilitada.", "ART/RRT e responsavel identificado quando aplicavel."],
    ]
    table = Table(rows, colWidths=[3.0 * cm, 6.0 * cm, 7.2 * cm], repeatRows=1, splitByRow=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), dark),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8.3),
        ("GRID", (0, 0), (-1, -1), 0.35, line),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6.5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6.5),
        ("FONTSIZE", (0, 1), (-1, -1), 8.2),
    ]))
    story.append(table)
    story.append(Spacer(1, 8))
    paras(story, "4. Aditivo de alteracao de escopo", [
        "<b>Use quando:</b> surgir qualquer mudanca de servico, material, prazo ou valor.",
        "<b>Campos minimos:</b> contrato original, descricao da alteracao, motivo, valor acrescido/descontado, impacto no prazo e aceite das partes.",
        "<b>Regra de ouro:</b> nao execute alteracao verbal. Primeiro aprove o aditivo, depois execute.",
    ])
    story.append(PageBreak())
    paras(story, "5. Termo de entrega e pendencias", [
        "Na entrega, registre data da vistoria, participantes, status geral, itens aprovados, pendencias, prazo de correcao e eventual retencao financeira.",
        "Toda pendencia deve ter responsavel e data limite. A aprovacao final deve ocorrer somente depois da correcao dos itens criticos.",
    ])
    paras(story, "6. Perguntas antes de assinar", [
        "O que exatamente esta incluso e excluido?",
        "Quem compra materiais e quem responde por perdas?",
        "Como sera medida cada etapa?",
        "O que acontece se houver atraso?",
        "Como serao aprovadas mudancas de escopo?",
        "Qual documentacao tecnica sera entregue?",
    ])
    doc = template(OUT_KIT)
    doc.build(story, onFirstPage=first_page_no_header, onLaterPages=later_header("Kit Contratos Sem Surpresa"))


build_checklist()
build_kit()
