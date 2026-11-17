import { LegMode } from '../types/travel';

export function formatDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}

export function formatCop(amount: number): string {
  const formatted = new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
  }).format(amount);
  return `$ ${formatted} COP`;
}

export function getModeLabel(mode: LegMode): string {
  switch (mode) {
    case 'carro':
      return 'Carro';
    case 'moto':
      return 'Moto';
  }
}

export function generateLocator(seed: string): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  let code = 'VAL-';
  for (let i = 0; i < 5; i++) {
    code += chars[(hash + i * 7) % chars.length];
    hash = Math.floor(hash / 3) + i * 13;
  }
  return code;
}

export function buildQrMatrix(text: string, size = 13): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  );

  const drawFinder = (r0: number, c0: number) => {
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const isBorder = r === 0 || r === 4 || c === 0 || c === 4;
        const isCenter = r === 2 && c === 2;
        if (r0 + r < size && c0 + c < size) {
          matrix[r0 + r][c0 + c] = isBorder || isCenter;
        }
      }
    }
  };

  drawFinder(0, 0);
  drawFinder(0, size - 5);
  drawFinder(size - 5, 0);

  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const inTopLeft = r < 6 && c < 6;
      const inTopRight = r < 6 && c >= size - 6;
      const inBottomLeft = r >= size - 6 && c < 6;
      if (inTopLeft || inTopRight || inBottomLeft) continue;

      hash ^= (r * 37 + c * 17) & 0xff;
      hash = Math.imul(hash, 16777619);
      matrix[r][c] = (hash >>> 24) % 2 === 0;
    }
  }

  return matrix;
}
