import { ApiError } from './sdk';

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
        message: 'Tu sesión venció. Inicia sesión nuevamente.',
      };
    }
    if (cause.status === 403) {
      const missingPermission = /Missing permission:\s*(.+)/i.exec(cause.message);
      if (missingPermission) {
        return {
          kind: 'permission',
          message: `Te falta el permiso ${missingPermission[1]} para realizar esta acción.`,
        };
      }
      if (cause.message.toLowerCase().includes('super administrator')) {
        return {
          kind: 'permission',
          message: 'Solo un superadministrador puede conceder todos los permisos.',
        };
      }
      return {
        kind: 'permission',
        message: 'No tienes permisos para realizar esta acción.',
      };
    }
    if (cause.status === 400) {
      return {
        kind: 'validation',
        message: cause.message || 'Revisa los datos ingresados.',
      };
    }
    if (cause.status === 404) {
      return {
        kind: 'not-found',
        message: 'El registro solicitado ya no está disponible.',
      };
    }
    if (cause.status === 409) {
      return {
        kind: 'conflict',
        message: 'Ya existe un registro con esos datos.',
      };
    }
    if (cause.status >= 500) {
      return {
        kind: 'server',
        message: 'El servidor no pudo completar la operación.',
      };
    }
    return { kind: 'network', message: cause.message };
  }

  if (cause instanceof Error) {
    return { kind: 'network', message: cause.message };
  }
  return {
    kind: 'network',
    message: 'No se pudo completar la operación. Inténtalo nuevamente.',
  };
}
