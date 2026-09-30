export const pdfTools = {
  merge: "Unir PDFs",
  split: "Separar PDF",
  images_to_pdf: "Imagens → PDF",
  file_to_pdf: "Arquivo → PDF",
  pdf_to_images: "PDF → imagens",
  pdf_to_txt: "PDF → texto",
  pdf_to_docx: "PDF → Word",
  compress: "Comprimir",
  protect: "Proteger com senha",
  unlock: "Remover senha",
  watermark: "Marca d’água",
  ocr: "OCR",
} as const;
export type PdfTool = keyof typeof pdfTools;
