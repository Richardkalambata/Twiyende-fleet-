'use client';

import { useEffect, useRef, useState } from 'react';
import { scannedBusNumber } from '@/lib/bus-qr';

export function BusQrScanner({ publicOrigin, onRead, onClose }: {
  publicOrigin?: string; onRead: (number: string) => void; onClose: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('Starting camera…');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const preview = video.current;
    if (!preview) return;
    let active = true;
    let stream: MediaStream | undefined;
    let timer: number | undefined;
    let rejectedValue = '';

    function stop() {
      active = false;
      window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
      if (preview) preview.srcObject = null;
    }

    async function start() {
      if (!navigator.mediaDevices?.getUserMedia || !preview) {
        setError('Camera access is unavailable here. Enter the bus number below.');
        return;
      }
      try {
        // Load the decoder only when the rider opens the scanner.
        const { default: decode } = await import('jsqr');
        if (!active) return;
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' } },
        });
        if (!active) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        preview.srcObject = stream;
        await preview.play();
        if (!active) return;
        setStatus('Point your camera at the QR code on the bus sign.');
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d', { willReadFrequently: true });
        if (!context) throw new Error('Camera frame capture unavailable');

        function scan() {
          if (!active || !preview || !context) return;
          if (!document.hidden && preview.readyState >= 2 && preview.videoWidth && preview.videoHeight) {
            const scale = Math.min(1, 640 / Math.max(preview.videoWidth, preview.videoHeight));
            const width = Math.max(1, Math.round(preview.videoWidth * scale));
            const height = Math.max(1, Math.round(preview.videoHeight * scale));
            if (canvas.width !== width || canvas.height !== height) {
              canvas.width = width;
              canvas.height = height;
            }
            let result: ReturnType<typeof decode>;
            try {
              context.drawImage(preview, 0, 0, width, height);
              const frame = context.getImageData(0, 0, width, height);
              result = decode(frame.data, width, height, { inversionAttempts: 'dontInvert' });
            } catch {
              stop();
              setError('Could not read the camera. Enter the bus number below.');
              return;
            }
            if (result && result.data !== rejectedValue) {
              const bus = scannedBusNumber(result.data, window.location.origin, publicOrigin);
              if (bus) {
                stop();
                onRead(bus);
                return;
              }
              rejectedValue = result.data;
              setStatus('That QR code is not a Twende bus sign. Try again or enter the bus number.');
            }
          }
          timer = window.setTimeout(scan, 200);
        }

        scan();
      } catch (cause) {
        if (!active) return;
        stop();
        setError(cause instanceof DOMException && cause.name === 'NotAllowedError'
          ? 'Camera access was denied. Allow it in your browser or enter the bus number below.'
          : 'Could not start the camera. Enter the bus number below.');
      }
    }

    void start();
    return stop;
  }, [onRead, publicOrigin]);

  return (
    <section className="mt-3 rounded-2xl border border-[#D5DCE8] bg-white p-3" aria-label="Bus QR scanner">
      <div className="mb-2 flex items-center justify-between gap-3">
        <p className="font-bold">Scan bus QR code</p>
        <button type="button" onClick={onClose} className="min-h-11 rounded-xl px-3 text-sm font-bold text-[#1747CB]">Close scanner</button>
      </div>
      <video ref={video} aria-label="Camera preview" autoPlay muted playsInline hidden={Boolean(error)} className="max-h-72 w-full rounded-xl bg-[#0B1B3B] object-contain" />
      <p className="mt-2 text-sm text-[#5C6578]" role={error ? 'alert' : 'status'}>{error ?? status}</p>
    </section>
  );
}
