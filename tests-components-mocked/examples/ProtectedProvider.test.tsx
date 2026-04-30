import { render } from '@testing-library/react';

import { expect } from '@jest/globals';
import { UfsUser } from '@sber-rmoc/lib.utils';
import { AccessError } from '@shared/components/common/plugsAndErrors/AccessError';
import { UserRoles } from '@shared/constants';

import { ProtectedProvider } from '../ProtectedProvider';
import { UfsUserProvider } from '../UfsUserProvider';

const demoUserSecoperations = {
  userRoles: [UserRoles.SECOPERATIONS],
} as unknown as UfsUser;

const demoAnotherUser = {
  UserRoles: ['AnotherRoles'],
} as unknown as UfsUser;

describe('проверка ограничения доступа', () => {
  it('отображает children, если у пользователя есть нужная роль', () => {
    const children = <div>children</div>;

    const { container } = render(
      <UfsUserProvider user={demoUserSecoperations}>
        <ProtectedProvider allowedRoles={[UserRoles.SECOPERATIONS]} fallback={<AccessError />}>
          {children}
        </ProtectedProvider>
      </UfsUserProvider>,
    );

    expect(container).toHaveTextContent('children');
  });

  it('отображает fallback, если у пользователя нет нужной роли', () => {
    const children = <div>children</div>;

    const { container } = render(
      <UfsUserProvider user={demoAnotherUser}>
        <ProtectedProvider allowedRoles={[UserRoles.SECOPERATIONS]} fallback={<AccessError />}>
          {children}
        </ProtectedProvider>
      </UfsUserProvider>,
    );

    expect(container).not.toHaveTextContent('children');
    expect(container).toHaveTextContent('Нет доступа к компоненту');
  });
});
