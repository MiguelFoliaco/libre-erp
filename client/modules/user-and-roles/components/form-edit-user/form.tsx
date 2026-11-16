import { clsx } from 'clsx';
import type { UserRecord } from '../../../../lib/user-and-roles';
import { text } from '../../../language';
import { useEditUserForm } from './hook';

interface EditUserFormProps {
  user: UserRecord;
  onSaved: (user: UserRecord) => void;
  onCancel: () => void;
}

const primaryColor = 'bg-linear-to-tr from-red-500 to-120% to-orange-500'


export function EditUserForm({ user, onSaved, onCancel }: EditUserFormProps) {
  const form = useEditUserForm(user, onSaved);

  return (
    <>
      <form className="space-y-4" onSubmit={form.handleSubmit}>
        <label className="form-control w-full">
          <span className="label-text mb-1">{text('modules.userAndRoles.forms.username')}</span>
          <input
            className="input input-bordered w-full"
            value={form.username}
            onChange={(event) => form.setUsername(event.target.value)}
            maxLength={100}
            autoComplete="username"
            required
          />
        </label>

        <label className="form-control w-full">
          <span className="label-text mb-1">{text('modules.userAndRoles.forms.email')}</span>
          <input
            className="input input-bordered w-full"
            type="email"
            value={form.email}
            onChange={(event) => form.setEmail(event.target.value)}
            maxLength={255}
            autoComplete="email"
            required
          />
        </label>

        <label className="flex items-center gap-3">
          <input
            className="toggle toggle-primary"
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => form.setIsActive(event.target.checked)}
          />
          <span>{text('modules.userAndRoles.forms.activeUser')}</span>
        </label>

        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost btn-sm" type="button" onClick={onCancel}>
            {text('modules.userAndRoles.forms.cancel')}
          </button>
          <button className={clsx("btn btn-sm btn-error", primaryColor)} type="submit" disabled={form.submitting}>
            {form.submitting && <span className="loading loading-spinner loading-xs" />}
            {text('modules.userAndRoles.forms.saveChanges')}
          </button>
        </div>
      </form>
    </>
  );
}
