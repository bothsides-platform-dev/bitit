import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        width: '180px',
        height: '180px',
        background: '#faf7f0',
        borderRadius: '34px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Ink bar */}
      <div
        style={{
          position: 'absolute',
          left: '31px',
          top: '28px',
          width: '25px',
          height: '124px',
          background: '#0a0a0f',
          borderRadius: '13px',
          display: 'flex',
        }}
      />
      {/* Ink circle */}
      <div
        style={{
          position: 'absolute',
          left: '68px',
          top: '39px',
          width: '101px',
          height: '101px',
          background: '#0a0a0f',
          borderRadius: '50%',
          display: 'flex',
        }}
      />
      {/* Paper gap */}
      <div
        style={{
          position: 'absolute',
          left: '56px',
          top: '0px',
          width: '17px',
          height: '180px',
          background: '#faf7f0',
          display: 'flex',
        }}
      />
    </div>,
    { width: 180, height: 180 },
  );
}
