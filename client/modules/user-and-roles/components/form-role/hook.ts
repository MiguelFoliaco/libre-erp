import { useEffect, useState, type FormEvent } from 'react';
import { apiClient } from '../../../../lib/sdk';
import type {
  RolePermissionAction,
  RolePermissionModule,
  RolePermissionSelection,
  RoleRecord,
  SaveRoleInput,
} from '../../../../lib/user-and-roles';
import {
  emptyRolePermissionSelection,
  roleActionsToSelection,
  selectionToRoleActions,
} from '../../../../lib/user-and-roles';
import { describeUserAndRolesError } from '../../../../lib/user-and-roles-errors';
import { useToast } from '../../../common/toast';

export function useRoleForm(
  role: RoleRecord | null,
  onSaved: (role: RoleRecord) => void,
) {
  const { notify } = useToast();
  const [name, setName] = useState(role?.name ?? '');
  const [description, setDescription] = useState(role?.description ?? '');
  const [selection, setSelection] = useState<RolePermissionSelection>(() =>
    role ? roleActionsToSelection(role.actions) : emptyRolePermissionSelection(),
  );
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setName(role?.name ?? '');
    setDescription(role?.description ?? '');
    setSelection(
      role ? roleActionsToSelection(role.actions) : emptyRolePermissionSelection(),
    );
  }, [role]);

  function setPermission(
    moduleName: RolePermissionModule,
    action: RolePermissionAction,
    checked: boolean,
  ) {
    setSelection((current) => {
      const selectedActions = current[moduleName].filter(
        (currentAction) => currentAction !== action,
      );
      return {
        ...current,
        [moduleName]: checked
          ? [...selectedActions, action]
          : selectedActions,
      };
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const input: SaveRoleInput = {
        name: name.trim(),
        description: description.trim(),
        actions: role?.actions.includes('*')
          ? ['*']
          : selectionToRoleActions(selection),
      };
      const savedRole = role
        ? await apiClient.update<RoleRecord>('roles', role.id, input)
        : await apiClient.create<RoleRecord>('roles', input);
      notify('success', role ? 'Rol actualizado.' : 'Rol creado.');
      onSaved(savedRole);
    } catch (cause: unknown) {
      const error = describeUserAndRolesError(cause);
      notify(error.kind === 'permission' ? 'warning' : 'error', error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return {
    name,
    setName,
    description,
    setDescription,
    selection,
    setPermission,
    submitting,
    rootRole: role?.actions.includes('*') ?? false,
    handleSubmit,
  };
}
