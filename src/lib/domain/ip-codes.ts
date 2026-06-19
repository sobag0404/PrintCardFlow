// PrintCardFlow — IP codes
import type { IpCode } from "./types";

export interface IpCodeMeta {
  code: Exclude<IpCode, "">;
  label: string;
  description: string;
}

export const IP_CODES: IpCodeMeta[] = [
  { code: "БТ", label: "БТ", description: "Бортовой принт" },
  { code: "МА", label: "МА", description: "Макет А" },
  { code: "МВ", label: "МВ", description: "Макет В" },
  { code: "МЛ", label: "МЛ", description: "Макет Л" },
  { code: "ЗА", label: "ЗА", description: "Запас А" },
  { code: "ЗН", label: "ЗН", description: "Запас Н" },
];

export const IP_CODE_VALUES = IP_CODES.map((c) => c.code);

export function ipCodeMeta(code: IpCode): IpCodeMeta | null {
  if (!code) return null;
  return IP_CODES.find((c) => c.code === code) ?? null;
}
