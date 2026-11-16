import { ApiError } from './sdk';
import { text } from '../modules/language';

export type UserAndRolesErrorKind =
  | 'permission'
  | 'session'
  | 'validation'
  | 'conflict'
  | 'not-found'
  | 'server'
  | 'network';

export interface UserAndRolesError {
  kind: UserAndRolesErrorKind;
  message: string;
}

export function describeUserAndRolesError(cause: unknown): UserAndRolesError {
  if (cause instanceof ApiError) {
    if (cause.status === 401) {
      return {
        kind: 'session',
        message: text('modules.userAndRoles.errors.sessionExpired'),
      };
    }
    if (cause.status === 403) {
      const missingPermission = /Missing permission:\s*(.+)/i.exec(cause.message);
      if (missingPermission) {
        return {
          kind: 'permission',
          message: text('modules.userAndRoles.errors.missingPermission', {
            permission: missingPermission[1],
          }),
        };
      }
      if (cause.message.toLowerCase().includes('super administrator')) {
        return {
          kind: 'permission',
          message: text('modules.userAndRoles.errors.superAdminRequired'),
        };
      }
      return {
        kind: 'permission',
        message: text('modules.userAndRoles.errors.permissionDenied'),
      };
    }
    if (cause.status === 400) {
      return {
        kind: 'validation',
        message: cause.message || text('modules.userAndRoles.errors.checkInput'),
      };
    }
    if (cause.status === 404) {
      return {
        kind: 'not-found',
        message: text('modules.userAndRoles.errors.recordUnavailable'),
      };
    }
    if (cause.status === 409) {
      return {
        kind: 'conflict',
        message: text('modules.userAndRoles.errors.duplicateRecord'),
      };
    }
    if (cause.status >= 500) {
      return {
        kind: 'server',
        message: text('modules.userAndRoles.errors.server'),
      };
    }
    return { kind: 'network', message: cause.message };
  }

  if (cause instanceof Error) {
    return { kind: 'network', message: cause.message };
  }
  return {
    kind: 'network',
    message: text('modules.userAndRoles.errors.operationFailed'),
  };
}
