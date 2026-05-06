import * as React from 'react';
import { render } from '@react-email/render';

import { Button, Layout, Mono } from './_layout';
import type { AuthEmailChangeProps } from './types';

export function AuthEmailChange({
  confirmUrl,
  newEmail,
  expiresHours,
}: AuthEmailChangeProps): React.JSX.Element {
  return (
    <Layout
      preheader="이메일 변경을 확인해 주세요."
      serial="EMAIL / CHANGE CONFIRM"
    >
      <h1
        style={{
          fontSize: '20px',
          fontWeight: 600,
          margin: '0 0 16px',
          letterSpacing: '-0.01em',
        }}
      >
        이메일 변경 확인
      </h1>
      <p style={{ margin: '0 0 16px', fontSize: '14px' }}>
        계정 이메일을 다음 주소로 변경 요청하셨습니다.
      </p>
      <p
        style={{
          margin: '0 0 24px',
          padding: '12px 14px',
          backgroundColor: '#f6f6f6',
          fontSize: '14px',
          borderRadius: '5px',
        }}
      >
        <Mono>{newEmail}</Mono>
      </p>
      <p style={{ margin: '0 0 24px', fontSize: '14px' }}>
        링크는 <Mono>{expiresHours}</Mono>시간 동안 유효합니다. 본인이 요청한
        적이 없다면 즉시 비밀번호를 변경해 주세요.
      </p>

      <Button href={confirmUrl}>이메일 변경 확인</Button>

      <p style={{ marginTop: '24px', fontSize: '12px', color: '#666' }}>
        버튼이 동작하지 않으면 다음 주소를 복사해 주세요.
        <br />
        <Mono>{confirmUrl}</Mono>
      </p>
    </Layout>
  );
}

export async function renderAuthEmailChange(
  props: AuthEmailChangeProps,
): Promise<string> {
  return render(<AuthEmailChange {...props} />);
}
