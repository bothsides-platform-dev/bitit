import * as React from 'react';
import { render } from '@react-email/render';

import { Layout, Mono } from './_layout';
import type { RfqSentProps } from './types';

export function RfqSent({
  rfqId,
  rfqTitle,
  inviteCount,
}: RfqSentProps): React.JSX.Element {
  return (
    <Layout
      preheader={`${rfqId} 견적이 ${inviteCount}개 PG사에 발송되었습니다.`}
      serial={`RFQ / ${rfqId}`}
    >
      <h1
        style={{
          fontSize: '20px',
          fontWeight: 600,
          margin: '0 0 16px',
          letterSpacing: '-0.01em',
        }}
      >
        견적 발송 완료
      </h1>
      <p style={{ margin: '0 0 16px', fontSize: '14px' }}>
        다음 RFQ가 정상적으로 발송되었습니다.
      </p>

      <table
        role="presentation"
        cellPadding={0}
        cellSpacing={0}
        style={{ margin: '0 0 24px', fontSize: '13px' }}
      >
        <tbody>
          <tr>
            <td style={{ color: '#777', paddingRight: '16px', paddingBottom: '6px' }}>
              번호
            </td>
            <td style={{ paddingBottom: '6px' }}>
              <Mono>{rfqId}</Mono>
            </td>
          </tr>
          <tr>
            <td style={{ color: '#777', paddingRight: '16px', paddingBottom: '6px' }}>
              제목
            </td>
            <td style={{ paddingBottom: '6px' }}>{rfqTitle}</td>
          </tr>
          <tr>
            <td style={{ color: '#777', paddingRight: '16px' }}>발송 건수</td>
            <td>
              <Mono>{inviteCount}</Mono> 건
            </td>
          </tr>
        </tbody>
      </table>

      <p style={{ fontSize: '13px', color: '#555' }}>
        PG사들의 응답이 도착하면 별도 알림으로 안내됩니다.
      </p>
    </Layout>
  );
}

export async function renderRfqSent(props: RfqSentProps): Promise<string> {
  return render(<RfqSent {...props} />);
}
