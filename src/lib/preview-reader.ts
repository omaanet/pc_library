export function spreadStart(page: number, double: boolean): number {
    return double ? Math.floor(page / 2) * 2 : page;
}
export function canFitSpread(width: number, height: number, ratios: number[]): boolean {
    const sum = (ratios[0] || 0.7) + (ratios[1] || ratios[0] || 0.7);
    const fittedHeight = Math.min(height, (width - 12) / sum);
    return ratios.length > 1 && Math.min(ratios[0] || 0.7, ratios[1] || 0.7) * fittedHeight >= 280;
}
export function clampPan(x: number, y: number, zoom: number, content: { width: number; height: number }, viewport: { width: number; height: number }) {
    const maxX = Math.max(0, (content.width * zoom - viewport.width) / 2);
    const maxY = Math.max(0, (content.height * zoom - viewport.height) / 2);
    return { x: Math.max(-maxX, Math.min(maxX, x)) || 0, y: Math.max(-maxY, Math.min(maxY, y)) || 0 };
}
