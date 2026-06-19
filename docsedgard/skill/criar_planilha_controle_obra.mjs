import fs from "node:fs/promises";
import { SpreadsheetFile, Workbook } from "@oai/artifact-tool";

const outputDir = "D:/AI Jedgard/outputs/produtos_ebook";
await fs.mkdir(outputDir, { recursive: true });

const wb = Workbook.create();
const resumo = wb.worksheets.add("Resumo");
const orc = wb.worksheets.add("Orcamento");
const forn = wb.worksheets.add("Fornecedores");
const pag = wb.worksheets.add("Pagamentos");
const cron = wb.worksheets.add("Cronograma");
const diario = wb.worksheets.add("Diario de Obra");

const dark = "#06090F";
const panel = "#0C1322";
const gold = "#C8A84B";
const white = "#FFFFFF";
const inputFill = "#FFF7D6";
const green = "#166534";
const red = "#991B1B";

for (const s of [resumo, orc, forn, pag, cron, diario]) s.showGridLines = false;

function title(sheet, range, text) {
  const r = sheet.getRange(range);
  r.merge();
  r.values = [[text]];
  r.format = {
    fill: dark,
    font: { bold: true, color: gold, size: 18 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };
  r.format.rowHeightPx = 42;
}

function headers(range) {
  range.format = {
    fill: panel,
    font: { bold: true, color: white },
    horizontalAlignment: "center",
    verticalAlignment: "center",
    wrapText: true,
  };
}

function money(range) { range.format.numberFormat = "R$ #,##0.00"; }
function pct(range) { range.format.numberFormat = "0.0%"; }

title(orc, "A1:J1", "Planilha Controle de Obra - Orcamento");
orc.getRange("A3:J3").values = [["Categoria", "Etapa", "Item", "Unidade", "Qtd", "Valor unitario", "Previsto", "Realizado", "Diferenca", "Status"]];
headers(orc.getRange("A3:J3"));
orc.getRange("A4:J18").values = [
  ["Projeto", "Planejamento", "Projeto arquitetonico", "un", 1, 4500, null, 0, null, "Pendente"],
  ["Projeto", "Planejamento", "Projeto estrutural", "un", 1, 3500, null, 0, null, "Pendente"],
  ["Terreno", "Preparacao", "Limpeza do terreno", "serv", 1, 1800, null, 0, null, "Pendente"],
  ["Fundacao", "Estrutura", "Sondagem do solo", "un", 1, 2500, null, 0, null, "Pendente"],
  ["Fundacao", "Estrutura", "Fundacao", "serv", 1, 28000, null, 0, null, "Pendente"],
  ["Estrutura", "Estrutura", "Concreto e ferragem", "serv", 1, 42000, null, 0, null, "Pendente"],
  ["Alvenaria", "Vedacao", "Blocos e argamassa", "serv", 1, 26000, null, 0, null, "Pendente"],
  ["Instalacoes", "Hidraulica", "Material hidraulico", "serv", 1, 12000, null, 0, null, "Pendente"],
  ["Instalacoes", "Eletrica", "Material eletrico", "serv", 1, 14500, null, 0, null, "Pendente"],
  ["Cobertura", "Telhado", "Estrutura e telhas", "serv", 1, 22000, null, 0, null, "Pendente"],
  ["Acabamento", "Piso", "Pisos e revestimentos", "m2", 120, 140, null, 0, null, "Pendente"],
  ["Acabamento", "Pintura", "Massa e pintura", "m2", 300, 38, null, 0, null, "Pendente"],
  ["Esquadrias", "Fechamento", "Portas e janelas", "serv", 1, 18000, null, 0, null, "Pendente"],
  ["Reserva", "Risco", "Reserva tecnica", "un", 1, 15000, null, 0, null, "Pendente"],
  ["Outros", "Geral", "Outros custos", "un", 1, 5000, null, 0, null, "Pendente"],
];
orc.getRange("G4:G18").formulas = Array.from({ length: 15 }, (_, i) => [`=E${i + 4}*F${i + 4}`]);
orc.getRange("I4:I18").formulas = Array.from({ length: 15 }, (_, i) => [`=H${i + 4}-G${i + 4}`]);
orc.getRange("F4:I18").format.numberFormat = "R$ #,##0.00";
orc.getRange("J4:J150").dataValidation = { rule: { type: "list", values: ["Pendente", "Contratado", "Em andamento", "Concluido", "Atrasado"] } };
orc.tables.add("A3:J18", true, "TabelaOrcamento");
orc.freezePanes.freezeRows(3);
orc.getRange("A:J").format.autofitColumns();

title(pag, "A1:H1", "Controle de pagamentos");
pag.getRange("A3:H3").values = [["Data", "Fornecedor", "Categoria", "Descricao", "Forma", "Previsto", "Pago", "Status"]];
headers(pag.getRange("A3:H3"));
pag.getRange("A4:H13").values = [
  [new Date("2026-06-05"), "Engenheiro/Arquiteto", "Projeto", "Entrada projeto", "Pix", 2500, 0, "Pendente"],
  [new Date("2026-06-20"), "Topografia", "Terreno", "Levantamento inicial", "Pix", 1500, 0, "Pendente"],
  [new Date("2026-07-05"), "Sondagem", "Fundacao", "Sondagem do solo", "Pix", 2500, 0, "Pendente"],
  [new Date("2026-07-20"), "Empreiteiro", "Fundacao", "1a medicao", "Transferencia", 15000, 0, "Pendente"],
  [new Date("2026-08-15"), "Material", "Estrutura", "Concreto e ferragem", "Boleto", 18000, 0, "Pendente"],
  [null, "", "", "", "", 0, 0, "Pendente"],
  [null, "", "", "", "", 0, 0, "Pendente"],
  [null, "", "", "", "", 0, 0, "Pendente"],
  [null, "", "", "", "", 0, 0, "Pendente"],
  [null, "", "", "", "", 0, 0, "Pendente"],
];
pag.getRange("A4:A13").setNumberFormat("dd/mm/yyyy");
money(pag.getRange("F4:G13"));
pag.getRange("H4:H200").dataValidation = { rule: { type: "list", values: ["Pendente", "Pago", "Parcial", "Atrasado"] } };
pag.tables.add("A3:H13", true, "TabelaPagamentos");
pag.freezePanes.freezeRows(3);
pag.getRange("A:H").format.autofitColumns();

title(forn, "A1:H1", "Cadastro e avaliacao de fornecedores");
forn.getRange("A3:H3").values = [["Fornecedor", "Servico", "Contato", "Orcamento", "Prazo", "Nota", "Risco", "Observacoes"]];
headers(forn.getRange("A3:H3"));
forn.getRange("A4:H10").values = [
  ["", "Projeto", "", 0, "", "", "Medio", ""],
  ["", "Fundacao", "", 0, "", "", "Alto", ""],
  ["", "Eletrica", "", 0, "", "", "Alto", ""],
  ["", "Hidraulica", "", 0, "", "", "Alto", ""],
  ["", "Acabamento", "", 0, "", "", "Medio", ""],
  ["", "Pintura", "", 0, "", "", "Baixo", ""],
  ["", "Esquadrias", "", 0, "", "", "Medio", ""],
];
money(forn.getRange("D4:D10"));
forn.getRange("G4:G100").dataValidation = { rule: { type: "list", values: ["Baixo", "Medio", "Alto"] } };
forn.tables.add("A3:H10", true, "TabelaFornecedores");
forn.getRange("A:H").format.autofitColumns();

title(cron, "A1:H1", "Cronograma fisico da obra");
cron.getRange("A3:H3").values = [["Etapa", "Responsavel", "Inicio previsto", "Fim previsto", "Inicio real", "Fim real", "% concluido", "Status"]];
headers(cron.getRange("A3:H3"));
cron.getRange("A4:H14").values = [
  ["Projetos", "", new Date("2026-06-01"), new Date("2026-06-30"), null, null, 0, "Pendente"],
  ["Aprovacoes", "", new Date("2026-07-01"), new Date("2026-07-20"), null, null, 0, "Pendente"],
  ["Terreno", "", new Date("2026-07-21"), new Date("2026-07-31"), null, null, 0, "Pendente"],
  ["Fundacao", "", new Date("2026-08-01"), new Date("2026-08-25"), null, null, 0, "Pendente"],
  ["Estrutura", "", new Date("2026-08-26"), new Date("2026-10-05"), null, null, 0, "Pendente"],
  ["Alvenaria", "", new Date("2026-10-06"), new Date("2026-11-15"), null, null, 0, "Pendente"],
  ["Instalacoes", "", new Date("2026-11-16"), new Date("2026-12-20"), null, null, 0, "Pendente"],
  ["Cobertura", "", new Date("2027-01-05"), new Date("2027-01-25"), null, null, 0, "Pendente"],
  ["Acabamentos", "", new Date("2027-01-26"), new Date("2027-03-20"), null, null, 0, "Pendente"],
  ["Vistoria final", "", new Date("2027-03-21"), new Date("2027-03-31"), null, null, 0, "Pendente"],
  ["Entrega", "", new Date("2027-04-01"), new Date("2027-04-05"), null, null, 0, "Pendente"],
];
cron.getRange("C4:F14").setNumberFormat("dd/mm/yyyy");
pct(cron.getRange("G4:G14"));
cron.getRange("H4:H100").dataValidation = { rule: { type: "list", values: ["Pendente", "Em andamento", "Concluido", "Atrasado"] } };
cron.tables.add("A3:H14", true, "TabelaCronograma");
cron.getRange("A:H").format.autofitColumns();

title(diario, "A1:G1", "Diario de obra");
diario.getRange("A3:G3").values = [["Data", "Clima", "Equipe", "Atividades executadas", "Ocorrencias", "Fotos/links", "Proxima acao"]];
headers(diario.getRange("A3:G3"));
diario.getRange("A4:G13").values = Array.from({ length: 10 }, () => [null, "", "", "", "", "", ""]);
diario.getRange("A4:A100").setNumberFormat("dd/mm/yyyy");
diario.tables.add("A3:G13", true, "TabelaDiario");
diario.getRange("A:G").format.autofitColumns();

title(resumo, "A1:H1", "Resumo executivo da obra");
resumo.getRange("A3:H6").values = [
  ["Indicador", "Valor", "", "Indicador", "Valor", "", "Indicador", "Valor"],
  ["Orcamento previsto", null, "", "Total realizado", null, "", "Saldo previsto", null],
  ["Pagamentos previstos", null, "", "Pagamentos feitos", null, "", "Aberto a pagar", null],
  ["Progresso medio", null, "", "Etapas atrasadas", null, "", "Reserva tecnica", null],
];
headers(resumo.getRange("A3:H3"));
resumo.getRange("B4").formulas = [["=SUM(Orcamento!G4:G18)"]];
resumo.getRange("E4").formulas = [["=SUM(Orcamento!H4:H18)"]];
resumo.getRange("H4").formulas = [["=B4-E4"]];
resumo.getRange("B5").formulas = [["=SUM(Pagamentos!F4:F13)"]];
resumo.getRange("E5").formulas = [["=SUM(Pagamentos!G4:G13)"]];
resumo.getRange("H5").formulas = [["=B5-E5"]];
resumo.getRange("B6").formulas = [["=AVERAGE(Cronograma!G4:G14)"]];
resumo.getRange("E6").formulas = [["=COUNTIF(Cronograma!H4:H14,\"Atrasado\")"]];
resumo.getRange("H6").formulas = [["=SUMIF(Orcamento!A4:A18,\"Reserva\",Orcamento!G4:G18)"]];
money(resumo.getRange("B4:H5"));
money(resumo.getRange("H6"));
pct(resumo.getRange("B6"));
resumo.getRange("A8:B12").values = [
  ["Instrucoes", "Edite as abas Orcamento, Pagamentos e Cronograma."],
  ["", "Use a coluna Realizado para acompanhar gasto real."],
  ["", "Registre fornecedores antes de fechar contrato."],
  ["", "Atualize o Diario de Obra toda semana."],
  ["", "Leve divergencias para o engenheiro responsavel."],
];
resumo.getRange("A8:B12").format = { fill: panel, font: { color: white }, wrapText: true };
resumo.getRange("A:H").format.autofitColumns();

const helper = resumo.getRange("A15:C17");
helper.values = [["Tipo", "Previsto", "Realizado"], ["Obra", null, null], ["Pagamentos", null, null]];
helper.getCell(1, 1).formulas = [["=B4"]];
helper.getCell(1, 2).formulas = [["=E4"]];
helper.getCell(2, 1).formulas = [["=B5"]];
helper.getCell(2, 2).formulas = [["=E5"]];
headers(resumo.getRange("A15:C15"));
money(resumo.getRange("B16:C17"));
const chart = resumo.charts.add("bar", resumo.getRange("A15:C17"));
chart.title = "Previsto vs Realizado";
chart.hasLegend = true;
chart.yAxis = { numberFormatCode: "R$ #,##0" };
chart.setPosition("D8", "H22");

const errors = await wb.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

for (const name of ["Resumo", "Orcamento", "Fornecedores", "Pagamentos", "Cronograma", "Diario de Obra"]) {
  await wb.render({ sheetName: name, autoCrop: "all", scale: 1, format: "png" });
}

const xlsx = await SpreadsheetFile.exportXlsx(wb);
await xlsx.save(`${outputDir}/planilha_controle_de_obra.xlsx`);
