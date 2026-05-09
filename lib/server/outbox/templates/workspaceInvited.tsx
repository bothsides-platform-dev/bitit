import * as React from 'react';
import { render } from '@react-email/render';

import { Button, Layout, Mono } from './_layout';
import type { WorkspaceInvitedProps } from './types';

export function WorkspaceInvited({
  workspaceName,
  inviteUrl,
}: WorkspaceInvitedProps): React.JSX.Element {
  return (
    <Layout
      preheader={`워크스페이스 '${workspaceName}'에 초대되었습니다.`}
      serial="WORKSPACE / INVITE"
    >
      <h1
        style={{
          fontSize: '20px',
          fontWeight: 600,
          margin: '0 0 16px',
          letterSpacing: '-0.01em',
        }}
      >
        워크스페이스 초대
      </h1>
      <p style={{ margin: '0 0 8px', fontSize: '14px' }}>
        워크스페이스{' '}
        <strong>
          <Mono>{workspaceName}</Mono>
        </strong>
        에 초대되었습니다.
      </p>
      <p style={{ margin: '0 0 24px', fontSize: '14px' }}>
        아래 버튼을 클릭해 합류하세요.
      </p>

      <Button href={inviteUrl}>초대 수락하기</Button>

      <p style={{ marginTop: '24px', fontSize: '12px', color: '#666' }}>
        버튼이 동작하지 않으면 다음 주소를 복사해 주세요.
        <br />
        <Mono>{inviteUrl}</Mono>
      </p>
    </Layout>
  );
}

export async function renderWorkspaceInvited(
  props: WorkspaceInvitedProps,
): Promise<string> {
  return render(<WorkspaceInvited {...props} />);
}
