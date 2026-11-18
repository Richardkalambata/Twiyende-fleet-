/**
 * Original device frames for the public pages. Screen pixels are lossless
 * captures of the running app, not redrawn interface art.
 */

function Keys() {
  const rows = [14, 14, 13, 11];
  return (
    <svg className="device-keys" viewBox="0 0 640 70" aria-hidden>
      {rows.map((count, row) => {
        const gap = 4;
        const width = (640 - gap * (count + 1)) / count;
        return Array.from({ length: count }, (_, index) => (
          <rect key={`${row}-${index}`} x={gap + index * (width + gap)} y={4 + row * 16} width={width} height={12} rx="2" />
        ));
      })}
    </svg>
  );
}

export function Phone({ src, alt, className = '' }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`device-phone ${className}`}>
      <span className="device-btn device-btn-vol-up" />
      <span className="device-btn device-btn-vol-down" />
      <span className="device-btn device-btn-power" />
      <div className="device-chassis">
        <span className="device-cam" />
        <div className="device-screen">
          {/* Lossless app capture. next/image would recompress the screen pixels. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} width={1170} height={2532} />
          <span className="device-glare" />
        </div>
      </div>
    </div>
  );
}

export function Laptop({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="device-laptop">
      <div className="device-lid">
        <span className="device-cam" />
        <div className="device-lid-screen">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt} width={4320} height={2700} />
          <span className="device-glare" />
        </div>
      </div>
      <div className="device-base">
        <Keys />
        <span className="device-trackpad" />
      </div>
    </div>
  );
}
