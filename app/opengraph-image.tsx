import { ImageResponse } from 'next/og';
import { readFile } from 'fs/promises';
import path from 'path';

export const alt = 'bidit — 결제대행사 비공개 RFQ 플랫폼';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OgImage() {
  const font = await readFile(
    path.join(process.cwd(), 'public/fonts/PretendardVariable.woff2'),
  );

  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '1200px',
        height: '630px',
        background: '#faf7f0',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '80px',
      }}
    >
      {/* Icon mark */}
      <div style={{ position: 'relative', display: 'flex', width: '280px', height: '280px' }}>
        {/* Ink bar */}
        <div
          style={{
            position: 'absolute',
            left: '48px',
            top: '44px',
            width: '39px',
            height: '193px',
            background: '#0a0a0f',
            borderRadius: '20px',
            display: 'flex',
          }}
        />
        {/* Ink circle */}
        <div
          style={{
            position: 'absolute',
            left: '105px',
            top: '61px',
            width: '158px',
            height: '158px',
            background: '#0a0a0f',
            borderRadius: '50%',
            display: 'flex',
          }}
        />
        {/* Paper gap */}
        <div
          style={{
            position: 'absolute',
            left: '88px',
            top: '0px',
            width: '26px',
            height: '280px',
            background: '#faf7f0',
            display: 'flex',
          }}
        />
      </div>

      {/* Wordmark */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <span
          style={{
            fontFamily: 'Pretendard',
            fontWeight: 800,
            fontSize: '140px',
            color: '#0a0a0f',
            letterSpacing: '-4px',
            lineHeight: 0.85,
          }}
        >
          bidit
        </span>
        <span
          style={{
            fontFamily: 'Pretendard',
            fontWeight: 400,
            fontSize: '22px',
            color: '#8c8690',
            letterSpacing: '0.04em',
          }}
        >
          결제대행사 비공개 RFQ 플랫폼
        </span>
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
      fonts: [
        { name: 'Pretendard', data: font, weight: 800, style: 'normal' },
        { name: 'Pretendard', data: font, weight: 400, style: 'normal' },
      ],
    },
  );
}
