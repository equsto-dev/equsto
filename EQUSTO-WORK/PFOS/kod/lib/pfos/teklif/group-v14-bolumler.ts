import type { TeklifV14Satir } from "./teklif-v14.types";

export type TeklifV14BolumBlok = {
  bolumNo: string;
  bolumBaslik: string;
  satirlar: TeklifV14Satir[];
};

/** v14 Excel — bölüm başlığı + kalemler */
export function groupTeklifV14Satirlar(
  satirlar: TeklifV14Satir[],
): TeklifV14BolumBlok[] {
  const blocks: TeklifV14BolumBlok[] = [];
  let current: TeklifV14BolumBlok | null = null;

  for (const satir of satirlar) {
    const key = `${satir.bolumNo}\0${satir.bolumBaslik}`;
    if (!current || `${current.bolumNo}\0${current.bolumBaslik}` !== key) {
      current = {
        bolumNo: satir.bolumNo,
        bolumBaslik: satir.bolumBaslik,
        satirlar: [],
      };
      blocks.push(current);
    }
    current.satirlar.push(satir);
  }

  return blocks;
}
