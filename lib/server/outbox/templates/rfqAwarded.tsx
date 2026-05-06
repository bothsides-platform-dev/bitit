import * as React from 'react';
import { render } from '@react-email/render';

import { Layout, Mono } from './_layout';
import type { RfqAwardedProps } from './types';

export function RfqAwarded({
  rfqId,
  rfqTitle,
  bidId,
  settlementCycle,
}: RfqAwardedProps): React.JSX.Element {
  return (
    <Layout
      preheader={`${rfqId} RFQ가 낙찰되었습니다.`}
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
        낙찰 알림
      </h1>
      <p style={{ margin: '0 0 16px', fontSize: '14px' }}>
        제출하신 견적이 최종 선정되었습니다.
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
              RFQ
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
            <td style={{ color: '#777', paddingRight: '16px', paddingBottom: '6px' }}>
              입찰 ID
            </td>
            <td style={{ paddingBottom: '6px' }}>
              <Mono>{bidId}</Mono>
            </td>
          </tr>
          <tr>
            <td style={{ color: '#777', paddingRight: '16px' }}>정산 주기</td>
            <td>
              <Mono>{settlementCycle}</Mono>
            </td>
          </tr>
        </tbody>
      </table>

      <p style={{ fontSize: '13px', color: '#555' }}>
        구매사 담당자가 곧 후속 절차로 연락드릴 예정입니다.
      </p>
    </Layout>
  );
}

export async function renderRfqAwarded(props: RfqAwardedProps): Promise<string> {
  return render(<RfqAwarded {...props} />);
}
