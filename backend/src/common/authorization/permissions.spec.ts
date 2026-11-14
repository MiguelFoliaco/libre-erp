import { ForbiddenException } from '@nestjs/common';
import {
  assertAssignableActions,
  assertPermission,
  hasPermission,
} from './permissions';

describe('role action permissions', () => {
  it('accepts the documented wildcard and module action formats', () => {
    expect(hasPermission(['*'], 'Product', 'DELETE')).toBe(true);
    expect(hasPermission(['Product[*]'], 'PRODUCT', 'INSERT')).toBe(true);
    expect(hasPermission(['CLIENT[READ|INSERT]'], 'Client', 'INSERT')).toBe(
      true,
    );
  });

  it('rejects actions that are not explicitly granted', () => {
    expect(hasPermission(['Product[READ|UPDATE]'], 'Product', 'DELETE')).toBe(
      false,
    );
    expect(hasPermission(['Client[READ]'], 'Product', 'READ')).toBe(false);
    expect(() =>
      assertPermission(['Product[READ]'], 'Product', 'DELETE'),
    ).toThrow(ForbiddenException);
  });

  it('prevents assigning permissions beyond the actor privileges', () => {
    expect(() =>
      assertAssignableActions(
        ['Product[READ]'],
        ['Product[READ|DELETE]'],
        false,
      ),
    ).toThrow(ForbiddenException);
    expect(() => assertAssignableActions(['Product[*]'], ['*'], false)).toThrow(
      ForbiddenException,
    );
    expect(() => assertAssignableActions(['*'], ['*'], true)).not.toThrow();
  });
});
