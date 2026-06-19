import fs from "node:fs/promises";
import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const inputPath = "D:/AI Jedgard/outputs/produtos_ebook/planilha_controle_de_obra.xlsx";
const outputPath = "D:/AI Jedgard/outputs/produtos_ebook/planilha_controle_de_obra_premium_final.xlsx";
const logoPath = "D:/ebook/Ebook Guia Imoveis/imagens ilustrativas/jedgard engenharia e gestao.png";
const topPath = "D:/ebook/Ebook Guia Imoveis/imagens ilustrativas/000 texto capa ebook parte de cima.png";

const wb = await SpreadsheetFile.importXlsx(await FileBlob.load(inputPath));
const logo = await fs.readFile(logoPath);
const top = await fs.readFile(topPath);
const logoData = `data:image/png;base64,${logo.toString("base64")}`;
const topData = `data:image/png;base64,${top.toString("base64")}`;

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
resumo.getRange("A1:H1").values = [["PLANILHA CONTROLE DE OBRA PREMIUM"]];
resumo.getRange("A1:H1").format = {
  fill: "#06090F",
  font: { bold: true, color: "#C8A84B", size: 18 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
resumo.getRange("A2:H2").merge();
resumo.getRange("A2:H2").values = [["Seu Imovel Sem Arrependimento | J. Edgard Engenharia & Gestao"]];
resumo.getRange("A2:H2").format = {
  fill: "#0C1322",
  font: { bold: true, color: "#FFFFFF", size: 10 },
  horizontalAlignment: "center",
  verticalAlignment: "center",
};
resumo.getRange("A1:H2").format.rowHeightPx = 34;
resumo.images.add({
  dataUrl: logoData,
  anchor: { from: { row: 0, col: 0 }, extent: { widthPx: 135, heightPx: 54 } },
});
resumo.images.add({
  dataUrl: topData,
  anchor: { from: { row: 8, col: 0 }, extent: { widthPx: 410, heightPx: 214 } },
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
