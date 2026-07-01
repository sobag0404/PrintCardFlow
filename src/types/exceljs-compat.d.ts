import type { Buffer as NodeBuffer } from "node:buffer";
import type ExcelJS from "exceljs";

declare module "exceljs" {
  interface Xlsx {
    load(
      buffer: NodeBuffer | ArrayBuffer | ArrayBufferView,
      options?: Partial<ExcelJS.XlsxReadOptions>,
    ): Promise<ExcelJS.Workbook>;
    writeBuffer(
      options?: Partial<ExcelJS.XlsxWriteOptions>,
    ): Promise<NodeBuffer>;
  }
}
