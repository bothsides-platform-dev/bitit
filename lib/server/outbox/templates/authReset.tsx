import * as React from 'react';
import { render } from '@react-email/render';

import { Button, Layout, Mono } from './_layout';
import type { AuthResetProps } from './types';

export function AuthReset({
  resetUrl,
  expiresMinutes,
}: AuthResetProps): React.JSX.Element {
  return (
    <Layout
      preheader="비밀번호 재설정 링크입니다."
      serial="EMAIL / PASSWORD RESET"
    >
      <h1
        style={{
          fontSize: '20px',
          fontWeight: 600,
          margin: '0 0 16px',
          letterSpacing: '-0.01em',
        }}
      >
        비밀번호 재설정
      </h1>
      <p style={{ margin: '0 0 24px', fontSize: '14px' }}>
        아래 버튼을 눌러 새 비밀번호를 설정해 주세요. 링크는{' '}
        <Mono>{expiresMinutes}</Mono>분 동안 유효하며, 본인이 요청한 적이 없다면
        이 메일을 무시해 주세요.
      </p>

      <Button href={resetUrl}>비밀번호 재설정</Button>

      <p style={{ marginTop: '24px', fontSize: '12px', color: '#666' }}>
        버튼이 동작하지 않으면 다음 주소를 복사해 주세요.
        <br />
        <Mono>{resetUrl}</Mono>
      </p>
    </Layout>
  );
}

export async function renderAuthReset(props: AuthResetProps): Promise<string> {
  return render(<AuthReset {...props} />);
}
