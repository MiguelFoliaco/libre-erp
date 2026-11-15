import { useEffect, useState, type FormEvent } from 'react';
import { apiClient } from '../../../../lib/sdk';
import type { UpdateUserInput, UserRecord } from '../../../../lib/user-and-roles';
import { describeUserAndRolesError } from '../../../../lib/user-and-roles-errors';
import { useToast } from '../../../common/toast';

export function useEditUserForm(
  user: UserRecord,
  onSaved: (user: UserRecord) => void,
) {
  const { notify } = useToast();
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [isActive, setIsActive] = useState(user.is_active);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setUsername(user.username);
    setEmail(user.email);
    setIsActive(user.is_active);
  }, [user]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      const input: UpdateUserInput = {
        username: username.trim(),
        email: email.trim(),
        isActive,
      };
      const updatedUser = await apiClient.update<UserRecord>(
        'users',
        user.id,
        input,
      );
      notify('success', 'Los datos del usuario se actualizaron.');
      onSaved(updatedUser);
    } catch (cause: unknown) {
      const error = describeUserAndRolesError(cause);
      notify(error.kind === 'permission' ? 'warning' : 'error', error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return {
    username,
    setUsername,
    email,
    setEmail,
    isActive,
    setIsActive,
    submitting,
    handleSubmit,
  };
}
