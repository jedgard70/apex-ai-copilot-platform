import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "D:/AI Jedgard/outputs/produtos_ebook/planilha_controle_de_obra.xlsx";
const outputPath = "D:/AI Jedgard/outputs/produtos_ebook/planilha_controle_de_obra_premium_revisada.xlsx";
const coverPath = "D:/ebook/Ebook Guia Imoveis/pagina ebook gemini/cartaoebook.png";

const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
const cover = await fs.readFile(coverPath);
const coverData = `data:image/png;base64,${cover.toString("base64")}`;

const sheets = ["Resumo", "Orcamento", "Fornecedores", "Pagamentos", "Cronograma", "Diario de Obra"];
for (const name of sheets) {
  const sheet = wb.worksheets.getItem(name);
  sheet.showGridLines = false;
  sheet.getRange("A1:H1").format = {
    fill: "#06090F",
    font: { bold: true, color: "#C8A84B", size: 16 },
    horizontalAlignment: "center",
    verticalAlignment: "center",
  };
}

const resumo = wb.worksheets.getItem("Resumo");
resumo.deleteAllDrawings();
resumo.getRange("A1:H1").merge();
resumo.getRange("A1:H1").values = [["J. EDGARD ENGENHARIA & GESTAO | PLANILHA CONTROLE DE OBRA"]];
resumo.getRange("A1:H1").format = {
  fill: "#06090F",
  font: { bold: true, color: "#C8A84B", size: 16 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
resumo.getRange("A2:H2").merge();
resumo.getRange("A2:H2").values = [["Produto complementar do ebook Seu Imovel Sem Arrependimento | Gestao inteligente para evitar estouro de custo"]];
resumo.getRange("A2:H2").format = {
  fill: "#0C1322",
  font: { bold: true, color: "#FFFFFF", size: 10 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
resumo.getRange("A1:H2").format.rowHeightPx = 32;
resumo.images.add({
  dataUrl: coverData,
  anchor: { from: { row: 8, col: 0 }, extent: { widthPx: 330, heightPx: 180 } },
});

const errors = await wb.inspect({
  kind: "match",
  searchTerm: "#REF!|#DIV/0!|#VALUE!|#NAME\\?|#N/A",
  options: { useRegex: true, maxResults: 100 },
  summary: "formula error scan",
});
console.log(errors.ndjson);

await wb.render({ sheetName: "Resumo", autoCrop: "all", scale: 1, format: "png" });
const out = await SpreadsheetFile.exportXlsx(wb);
await out.save(outputPath);
