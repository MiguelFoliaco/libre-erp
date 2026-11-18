import { clsx } from 'clsx';
import {
  ROLE_PERMISSION_ACTIONS,
  ROLE_PERMISSION_MODULES,
  type RoleRecord,
} from '@/lib/user-and-roles';
import { text } from '@/modules/language';
import { useRoleForm } from './hook';

interface RoleFormProps {
  role: RoleRecord | null;
  onSaved: (role: RoleRecord) => void;
  onCancel: () => void;
}


const primaryColor = 'bg-linear-to-tr from-red-500 to-120% to-orange-500'


export function RoleForm({ role, onSaved, onCancel }: RoleFormProps) {
  const form = useRoleForm(role, onSaved);

  return (
    <form className="space-y-4" onSubmit={form.handleSubmit}>
      <label className="mt-2 form-control w-full">
        <span className="label-text text-sm mb-1">{text('modules.userAndRoles.forms.roleName')}</span>
        <input
          className="input input-sm outline-none w-full"
          value={form.name}
          onChange={(event) => form.setName(event.target.value)}
          maxLength={100}
          required
        />
      </label>

      <div className="mt-2 form-control w-full">
        <span className="label-text text-sm mb-1">{text('modules.userAndRoles.forms.description')}</span>
        <textarea
          className="textarea textarea-sm outline-none resize-none w-full"
          value={form.description}
          onChange={(event) => form.setDescription(event.target.value)}
          rows={3}
        />
      </div>

      {form.rootRole && (
        <p className="alert alert-warning text-sm" role="status">
          {text('modules.userAndRoles.forms.rootRoleWarning')}
        </p>
      )}

      <fieldset className="space-y-2" disabled={form.rootRole}>
        <legend className="mb-2 font-semibold">{text('modules.userAndRoles.forms.allowedActions')}</legend>
        <p className="mb-3 text-xs text-base-content/60">
          {text('modules.userAndRoles.forms.allowedActionsHelp')}
        </p>
        {ROLE_PERMISSION_MODULES.map((moduleName) => (
          <details
            className="collapse collapse-arrow rounded-lg border border-base-300 bg-base-100"
            key={moduleName}
          >
            <summary className="collapse-title select-none min-h-12 py-3 font-medium">
              {moduleName}
            </summary>
            <div className="collapse-content">
              <div className="grid gap-2 sm:grid-cols-2">
                {ROLE_PERMISSION_ACTIONS.map((action) => (
                  <label className="flex select-none items-center gap-2" key={action}>
                    <input
                      className="checkbox checkbox-sm checkbox-error"
                      type="checkbox"
                      checked={form.selection[moduleName].includes(action)}
                      onChange={(event) =>
                        form.setPermission(
                          moduleName,
                          action,
                          event.target.checked,
                        )
                      }
                    />
                    <span className="text-sm">{action}</span>
                  </label>
                ))}
              </div>
            </div>
          </details>
        ))}
      </fieldset>

      <div className="flex justify-end gap-2">
        <button className="btn btn-ghost" type="button" onClick={onCancel}>
          {text('modules.userAndRoles.forms.cancel')}
        </button>
        <button className={clsx(
          "btn text-white",
          primaryColor
        )} type="submit" disabled={form.submitting}>
          {form.submitting && <span className="loading loading-spinner loading-xs" />}
          {role
            ? text('modules.userAndRoles.forms.saveRole')
            : text('modules.userAndRoles.forms.createRole')}
        </button>
      </div>
    </form>
  );
}
