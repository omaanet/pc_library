'use client';

import { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { ArrowLeft, Download, Loader2, QrCode } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const DEFAULT_URL = 'https://raccontiinvoceecaratteri.it/';
const MIN_SIZE = 180;
const MAX_SIZE = 720;
const DEFAULT_SIZE = 360;

function drawRoundRect(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
) {
    const r = Math.min(radius, width / 2, height / 2);
    context.beginPath();
    context.moveTo(x + r, y);
    context.lineTo(x + width - r, y);
    context.quadraticCurveTo(x + width, y, x + width, y + r);
    context.lineTo(x + width, y + height - r);
    context.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    context.lineTo(x + r, y + height);
    context.quadraticCurveTo(x, y + height, x, y + height - r);
    context.lineTo(x, y + r);
    context.quadraticCurveTo(x, y, x + r, y);
    context.closePath();
}

function drawMascotMark(context: CanvasRenderingContext2D, centerX: number, centerY: number, size: number) {
    const panelSize = size * 1.24;
    const panelX = centerX - panelSize / 2;
    const panelY = centerY - panelSize / 2;

    context.save();
    context.fillStyle = '#fffaf0';
    context.strokeStyle = '#d7b56d';
    context.lineWidth = Math.max(2, size * 0.045);
    drawRoundRect(context, panelX, panelY, panelSize, panelSize, size * 0.22);
    context.fill();
    context.stroke();

    context.translate(centerX - size / 2, centerY - size / 2);
    context.scale(size / 80, size / 80);
    context.lineCap = 'round';
    context.lineJoin = 'round';
    context.fillStyle = 'transparent';

    context.strokeStyle = '#1f2937';
    context.lineWidth = 5.5;
    context.beginPath();
    context.moveTo(17, 66);
    context.bezierCurveTo(25, 50, 45, 25, 68, 8);
    context.bezierCurveTo(62, 22, 52, 38, 43, 53);
    context.bezierCurveTo(36, 51, 28, 57, 17, 66);
    context.stroke();

    context.strokeStyle = '#c99a2e';
    context.lineWidth = 6;
    context.beginPath();
    context.moveTo(16, 68);
    context.bezierCurveTo(22, 63, 27, 73, 33, 68);
    context.bezierCurveTo(39, 63, 44, 73, 50, 68);
    context.bezierCurveTo(56, 63, 61, 73, 67, 68);
    context.stroke();
    context.restore();
}

async function renderQrImage(value: string, width: number, height: number, includeMascot: boolean): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas non disponibile');

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);

    const qrSize = Math.min(width, height);
    const qrCanvas = document.createElement('canvas');
    await QRCode.toCanvas(qrCanvas, value, {
        errorCorrectionLevel: includeMascot ? 'H' : 'M',
        margin: 2,
        width: qrSize,
        color: {
            dark: '#111827',
            light: '#ffffff',
        },
    });

    const qrX = Math.floor((width - qrSize) / 2);
    const qrY = Math.floor((height - qrSize) / 2);
    context.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

    if (includeMascot) {
        drawMascotMark(context, width / 2, height / 2, Math.max(42, Math.min(104, qrSize * 0.22)));
    }

    return canvas.toDataURL('image/png');
}

function normalizeUrl(value: string): string {
    const url = new URL(value.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        throw new Error('Inserisci un URL http o https valido.');
    }
    return url.toString();
}

function downloadDataUrl(dataUrl: string, filename: string) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
}

export function QrCodeGenerator() {
    const router = useRouter();
    const [urlInput, setUrlInput] = useState(DEFAULT_URL);
    const [qrValue, setQrValue] = useState(DEFAULT_URL);
    const [qrWidth, setQrWidth] = useState(DEFAULT_SIZE);
    const [qrHeight, setQrHeight] = useState(DEFAULT_SIZE);
    const [includeMascot, setIncludeMascot] = useState(true);
    const [qrImage, setQrImage] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isRendering, setIsRendering] = useState(false);

    const generateImage = useCallback(async (value: string) => {
        setIsRendering(true);
        setError('');
        try {
            const image = await renderQrImage(value, qrWidth, qrHeight, includeMascot);
            setQrImage(image);
        } catch (generationError) {
            setError(generationError instanceof Error ? generationError.message : 'Generazione non riuscita.');
        } finally {
            setIsRendering(false);
        }
    }, [includeMascot, qrHeight, qrWidth]);

    useEffect(() => {
        void generateImage(qrValue);
    }, [generateImage, qrValue]);

    const handleGenerate = () => {
        try {
            const nextUrl = normalizeUrl(urlInput);
            setUrlInput(nextUrl);
            setQrValue(nextUrl);
        } catch (validationError) {
            setError(validationError instanceof Error ? validationError.message : 'Inserisci un URL valido.');
        }
    };

    const handleDownload = async () => {
        try {
            const value = normalizeUrl(urlInput);
            const image = await renderQrImage(value, qrWidth, qrHeight, includeMascot);
            setUrlInput(value);
            setQrValue(value);
            setQrImage(image);
            downloadDataUrl(image, `qr-code-${qrWidth}x${qrHeight}.png`);
            setError('');
        } catch (downloadError) {
            setError(downloadError instanceof Error ? downloadError.message : 'Download non riuscito.');
        }
    };

    return (
        <main className="container mx-auto px-4 py-4 lg:px-0">
            <div className="mb-5 flex items-center justify-center gap-3 text-center sm:justify-start sm:text-left">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Indietro</span>
                </Button>
                <div>
                    <h1 className="flex items-center justify-center gap-2 text-2xl font-bold tracking-tight sm:justify-start sm:text-3xl">
                        <QrCode className="h-6 w-6 text-yellow-500" />
                        Generatore QR Code
                    </h1>
                    <p className="text-sm text-muted-foreground">Crea un QR code scaricabile per link promozionali o pagine del sito.</p>
                </div>
            </div>

            <section className="mx-auto flex w-full max-w-5xl flex-col items-center gap-4">
                <div className="flex w-full max-w-4xl flex-col gap-3 lg:flex-row lg:items-center">
                    <Label className="sr-only" htmlFor="qr-url">URL</Label>
                    <Input
                        id="qr-url"
                        type="url"
                        value={urlInput}
                        onChange={(event) => setUrlInput(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') handleGenerate();
                        }}
                        className="h-11"
                        placeholder={DEFAULT_URL}
                    />
                    <div className="flex gap-2 lg:shrink-0">
                        <Button type="button" className="flex-1 sm:flex-none" onClick={handleGenerate} disabled={isRendering}>
                            {isRendering ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Genera
                        </Button>
                        <Button type="button" variant="outline" className="flex-1 sm:flex-none" onClick={handleDownload} disabled={isRendering || !qrImage}>
                            <Download className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                    </div>
                </div>

                {error && (
                    <p className="w-full max-w-4xl rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                        {error}
                    </p>
                )}

                <div className="flex w-full max-w-4xl flex-col gap-3 rounded-lg border border-border/70 bg-background p-4 shadow-sm lg:flex-row lg:items-center">
                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <Label htmlFor="qr-width" className="text-xs">Larghezza</Label>
                            <span>{qrWidth}px</span>
                        </div>
                        <input
                            id="qr-width"
                            type="range"
                            min={MIN_SIZE}
                            max={MAX_SIZE}
                            step={10}
                            value={qrWidth}
                            onChange={(event) => setQrWidth(Number(event.target.value))}
                            className="w-full accent-primary"
                            aria-label="Larghezza QR code"
                        />
                    </div>

                    <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <Label htmlFor="qr-height" className="text-xs">Altezza</Label>
                            <span>{qrHeight}px</span>
                        </div>
                        <input
                            id="qr-height"
                            type="range"
                            min={MIN_SIZE}
                            max={MAX_SIZE}
                            step={10}
                            value={qrHeight}
                            onChange={(event) => setQrHeight(Number(event.target.value))}
                            className="w-full accent-primary"
                            aria-label="Altezza QR code"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-3 lg:shrink-0 lg:justify-end">
                        <div className="flex items-center gap-2">
                            <Switch id="qr-mascot" checked={includeMascot} onCheckedChange={setIncludeMascot} />
                            <Label htmlFor="qr-mascot" className="cursor-pointer text-sm font-medium">
                                Mascotte
                            </Label>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setQrWidth(DEFAULT_SIZE);
                                setQrHeight(DEFAULT_SIZE);
                            }}
                        >
                            Reimposta
                        </Button>
                    </div>
                </div>

                <div className="flex w-full max-w-4xl justify-center overflow-x-auto">
                    <div className="flex max-w-full items-center justify-center rounded-lg border border-border/70 bg-white p-3 shadow-sm">
                        {qrImage ? (
                            <img
                                src={qrImage}
                                alt={`QR code per ${qrValue}`}
                                className="block h-auto max-h-[calc(100vh-15rem)] max-w-full"
                                style={{ width: qrWidth }}
                            />
                        ) : (
                            <div className="flex h-64 w-64 items-center justify-center text-sm text-slate-500">
                                {isRendering ? 'Generazione...' : 'QR code non disponibile'}
                            </div>
                        )}
                    </div>
                </div>
            </section>
        </main>
    );
}
