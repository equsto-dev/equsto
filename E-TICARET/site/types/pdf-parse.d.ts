declare module "pdf-parse/lib/pdf-parse.js" {
  interface PdfParseResult {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    text: string;
    version: string;
  }

  function pdfParse(
    data: Buffer,
    options?: Record<string, unknown>,
  ): Promise<PdfParseResult>;

  export default pdfParse;
}

declare module "pdf-parse" {
  export * from "pdf-parse/lib/pdf-parse.js";
  export { default } from "pdf-parse/lib/pdf-parse.js";
}
