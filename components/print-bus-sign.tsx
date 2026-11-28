'use client';

import { useState } from 'react';

type FleetWindow = Window & { twendeFleetSign?: { postMessage: (message: string) => void } };

export function PrintBusSign({ image, filename }: { image: string; filename: string }) {
  const [preparing, setPreparing] = useState(false);
  const [fallback, setFallback] = useState(false);

  async function download() {
    setPreparing(true);
    setFallback(false);
    try {
      const artwork = new window.Image();
      artwork.src = image;
      await artwork.decode();
      const canvas = document.createElement('canvas');
      // A4 at approximately 300 DPI.
      canvas.width = 2480;
      canvas.height = 3508;
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Image export unavailable');
      context.drawImage(artwork, 0, 0, canvas.width, canvas.height);
      const png = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Image export failed')), 'image/png');
      });
      const native = (window as FleetWindow).twendeFleetSign;
      if (native) {
        const reader = new FileReader();
        const data = await new Promise<string>((resolve, reject) => {
          reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Invalid image'));
          reader.onerror = () => reject(new Error('Could not read image'));
          reader.readAsDataURL(png);
        });
        native.postMessage(JSON.stringify({ filename: `${filename}.png`, image: data }));
        return;
      }
      const link = document.createElement('a');
      const url = URL.createObjectURL(png);
      link.href = url;
      link.download = `${filename}.png`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
    } catch {
      setFallback(true);
    } finally {
      setPreparing(false);
    }
  }

  return (
    <>
      <button type="button" className="min-h-11 rounded-xl bg-[#1F5BFF] px-4 py-2 font-bold text-white" onClick={() => {
        const native = (window as FleetWindow).twendeFleetSign;
        if (native) native.postMessage('print');
        else window.print();
      }}>Print sign</button>
      <button type="button" disabled={preparing} className="min-h-11 rounded-xl border border-[#D5DCE8] bg-white px-4 py-2 font-semibold disabled:opacity-50" onClick={() => void download()}>
        {preparing ? 'Preparing image…' : 'Download PNG'}
      </button>
      {fallback ? <a href={image} download={`${filename}.svg`} className="min-h-11 rounded-xl border px-4 py-2 font-semibold">Download vector sign</a> : null}
    </>
  );
}
