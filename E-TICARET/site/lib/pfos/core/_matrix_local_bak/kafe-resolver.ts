/**
 * Kafe matris — hücre çözümleme, legacy konsept eşleme
 */

import matrixDoc from "../matrix/kafe.json";
import type {
  KafeMatrixCell,
  KafeMatrixDoc,
  KafeMatrixResolveInput,
  KafeOlcek,
  KafeYogunluk,
} from "../matrix/kafe.types";
import { olcekFromM2 } from "../rules/kafe/slots";

const DOC = matrixDoc as KafeMatrixDoc;

export function getKafeMatrixDoc(): KafeMatrixDoc {
  return DOC;
}

export function resolveOlcek(input: KafeMatrixResolveInput): KafeOlcek {
  if (input.olcek) return input.olcek;
  return olcekFromM2(input.m2);
}

export function resolveYogunluk(input: KafeMatrixResolveInput): KafeYogunluk {
  if (input.yogunluk) return input.yogunluk;
  return "Y2";
}

export function findKafeCell(olcek: KafeOlcek, yogunluk: KafeYogunluk): KafeMatrixCell {
  const cell = DOC.hucreler.find((h) => h.olcek === olcek && h.yogunluk === yogunluk);
  if (!cell) {
    throw new Error(`Kafe matris hücresi bulunamadı: ${olcek}×${yogunluk}`);
  }
  return cell;
}

export function resolveKafeCell(input: KafeMatrixResolveInput): KafeMatrixCell {
  const olcek = resolveOlcek(input);
  const yogunluk = resolveYogunluk(input);
  return findKafeCell(olcek, yogunluk);
}

export function legacyKonseptToKafe(
  konseptId: string,
  bantId?: string | null,
): { olcek: KafeOlcek; yogunluk: KafeYogunluk } | null {
  const entry = DOC.legacyKonseptMap[konseptId];
  if (!entry) return null;
  if (entry.bantEsleme && bantId && entry.bantEsleme[bantId]) {
    return entry.bantEsleme[bantId];
  }
  return { olcek: entry.olcek, yogunluk: entry.yogunluk };
}

export function kafeCellLabel(cell: KafeMatrixCell): string {
  const olcekDef = DOC.olcek.find((o) => o.id === cell.olcek);
  const yogDef = DOC.yogunluk.find((y) => y.id === cell.yogunluk);
  return `${olcekDef?.label ?? cell.olcek} × ${yogDef?.label ?? cell.yogunluk}`;
}

export function listKafeCells(): KafeMatrixCell[] {
  return DOC.hucreler;
}
