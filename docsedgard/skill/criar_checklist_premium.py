from reportlab.lib import colors
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
)

OUT = r"D:\AI Jedgard\outputs\produtos_ebook\checklist_premium_imprimivel.pdf"

gold = colors.HexColor("#C8A84B")
dark = colors.HexColor("#06090F")
panel = colors.HexColor("#0C1322")
muted = colors.HexColor("#475569")
light = colors.HexColor("#F8FAFC")
red = colors.HexColor("#991B1B")

doc = SimpleDocTemplate(
    OUT,
    pagesize=A4,
    rightMargin=1.35 * cm,
    leftMargin=1.35 * cm,
    topMargin=1.2 * cm,
    bottomMargin=1.1 * cm,
)

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name="CoverTitle",
    parent=styles["Title"],
    fontName="Helvetica-Bold",
    fontSize=25,
    leading=28,
    textColor=dark,
    alignment=1,
    spaceAfter=10,
))
styles.add(ParagraphStyle(
    name="Sub",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=10.5,
    leading=15,
    textColor=muted,
    alignment=1,
))
styles.add(ParagraphStyle(
    name="H",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=15,
    leading=18,
    textColor=dark,
    spaceBefore=10,
    spaceAfter=8,
))
styles.add(ParagraphStyle(
    name="Small",
    parent=styles["BodyText"],
    fontName="Helvetica",
    fontSize=8.8,
    leading=11,
    textColor=muted,
))

story = []

def footer(canvas, _doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(muted)
    canvas.drawString(1.35 * cm, 0.65 * cm, "Checklist Premium Imprimivel | Seu Imovel Sem Arrependimento")
    canvas.drawRightString(A4[0] - 1.35 * cm, 0.65 * cm, f"Pagina {canvas.getPageNumber()}")
    canvas.restoreState()

def checkbox_table(title, rows):
    story.append(Paragraph(title, styles["H"]))
    data = [["OK", "Item de verificacao", "Observacoes"]] + [["□", Paragraph(item, styles["Small"]), ""] for item in rows]
    table = Table(data, colWidths=[1.0 * cm, 11.1 * cm, 5.0 * cm], repeatRows=1)
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), dark),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, 0), 8.5),
        ("ALIGN", (0, 0), (0, -1), "CENTER"),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CBD5E1")),
        ("BACKGROUND", (0, 1), (-1, -1), colors.white),
        ("FONTSIZE", (0, 1), (-1, -1), 8.5),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    story.append(table)
    story.append(Spacer(1, 8))

story.append(Spacer(1, 35))
story.append(Paragraph("CHECKLIST PREMIUM IMPRIMIVEL", styles["CoverTitle"]))
story.append(Paragraph("Vistoria inteligente antes de comprar, reformar ou contratar obra", styles["Sub"]))
story.append(Spacer(1, 20))
intro = Table([
    [Paragraph("<b>Como usar:</b> leve este checklist impresso na visita ao imovel. Marque o que foi verificado, anote evidencias e fotografe tudo que gerar duvida. Itens criticos devem ser avaliados por profissional habilitado antes da decisao.", styles["Small"])]
], colWidths=[17.1 * cm])
intro.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#FFF7D6")),
    ("BOX", (0, 0), (-1, -1), 1, gold),
    ("LEFTPADDING", (0, 0), (-1, -1), 12),
    ("RIGHTPADDING", (0, 0), (-1, -1), 12),
    ("TOPPADDING", (0, 0), (-1, -1), 10),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
]))
story.append(intro)
story.append(Spacer(1, 18))

checkbox_table("1. Documentos e contexto", [
    "Solicitar matricula atualizada do imovel.",
    "Conferir IPTU, area construida e area do terreno.",
    "Perguntar se houve reforma, ampliacao ou regularizacao recente.",
    "Verificar existencia de condominio, taxas extras ou restricoes.",
    "Registrar data, endereco, vendedor/corretor e responsavel pela visita.",
])

checkbox_table("2. Estrutura, trincas e umidade", [
    "Procurar trincas diagonais em portas, janelas e cantos de paredes.",
    "Verificar manchas de umidade, mofo, bolhas na pintura e cheiro forte.",
    "Observar desniveis no piso, portas raspando e esquadrias desalinhadas.",
    "Conferir sinais de infiltracao no teto, rodapes e paredes externas.",
    "Fotografar todo ponto suspeito com distancia e detalhe.",
])

checkbox_table("3. Eletrica, hidraulica e seguranca", [
    "Abrir o quadro eletrico e verificar identificacao dos circuitos.",
    "Testar tomadas visiveis, interruptores e pontos de iluminacao.",
    "Perguntar sobre disjuntores, aterramento e capacidade para ar-condicionado.",
    "Abrir torneiras, chuveiros e descargas para avaliar pressao e vazamento.",
    "Verificar registros, ralos, sifoes e sinais de retorno de esgoto.",
])

story.append(PageBreak())

checkbox_table("4. Acabamentos e uso diario", [
    "Conferir portas, fechaduras, janelas, vidros e vedacoes.",
    "Verificar rejuntes, pisos ocos, azulejos soltos e desniveis.",
    "Observar ventilacao, insolacao, ruido externo e privacidade.",
    "Testar armarios planejados, bancadas e areas molhadas.",
    "Avaliar garagem, acesso, circulacao e manobra.",
])

checkbox_table("5. Terreno, entorno e riscos externos", [
    "Observar caimento do terreno e caminhos de agua da chuva.",
    "Verificar muros, divisas, calçadas, acesso e drenagem.",
    "Perguntar sobre enchentes, alagamentos ou obras vizinhas.",
    "Conferir proximidade de torres, encostas, rios, avenidas e industrias.",
    "Visitar a regiao em horarios diferentes antes de decidir.",
])

checkbox_table("6. Perguntas obrigatorias antes de fechar", [
    "Qual foi a ultima reforma feita e por quem?",
    "Existe laudo, projeto, ART/RRT ou memorial da obra?",
    "Quais problemas o imovel ja apresentou?",
    "O que esta incluso no preco e o que sera retirado?",
    "Posso levar um engenheiro para uma vistoria tecnica?",
])

story.append(Paragraph("Resumo da decisao", styles["H"]))
decision = Table([
    ["Pontos fortes", ""],
    ["Pontos de alerta", ""],
    ["Itens que exigem profissional", ""],
    ["Valor pedido", ""],
    ["Valor maximo seguro", ""],
    ["Decisao final", "Comprar / Negociar / Reprovar / Aguardar laudo"],
], colWidths=[5.2 * cm, 11.9 * cm])
decision.setStyle(TableStyle([
    ("BACKGROUND", (0, 0), (0, -1), panel),
    ("TEXTCOLOR", (0, 0), (0, -1), colors.white),
    ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
    ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CBD5E1")),
    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ("TOPPADDING", (0, 0), (-1, -1), 8),
    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
]))
story.append(decision)

doc.build(story, onFirstPage=footer, onLaterPages=footer)
