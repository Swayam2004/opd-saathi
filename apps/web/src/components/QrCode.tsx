import { useMemo } from 'react';
import qrcode from 'qrcode-generator';

/** A QR code drawn as one SVG path. Dark on white in every theme, so scanners read it. */
export function QrCode({ value, label, size = 176 }: { value: string; label: string; size?: number }) {
  const { d, n } = useMemo(() => {
    const qr = qrcode(0, 'M');
    qr.addData(value);
    qr.make();
    const count = qr.getModuleCount();
    let path = '';
    for (let r = 0; r < count; r++) {
      for (let c = 0; c < count; c++) if (qr.isDark(r, c)) path += `M${c + 4} ${r + 4}h1v1h-1z`;
    }
    return { d: path, n: count + 8 };
  }, [value]);

  return (
    <svg viewBox={`0 0 ${n} ${n}`} width={size} height={size} role="img" aria-label={label} shapeRendering="crispEdges">
      <rect width={n} height={n} fill="#ffffff" />
      <path d={d} fill="#000000" />
    </svg>
  );
}
