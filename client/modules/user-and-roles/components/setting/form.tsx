import {
  AtSign,
  KeyRound,
  Mail,
  Save,
  Server,
  ShieldCheck,
} from 'lucide-react';
import { ToastProvider } from '@/modules/common/toast';
import { text } from '@/modules/language';
import { useSettingsForm, type AuthProvider } from './hook';

const authProviders: { value: AuthProvider; label: string }[] = [
  { value: 'local', label: text('modules.userAndRoles.settings.localProvider') },
  { value: 'google', label: 'Google' },
  { value: 'github', label: 'GitHub' },
  { value: 'gitlab', label: 'GitLab' },
  { value: 'microsoft', label: 'Microsoft' },
];

function isAuthProvider(value: string): value is AuthProvider {
  return authProviders.some((provider) => provider.value === value);
}

function SettingsFormContent() {
  const form = useSettingsForm();

  return (
    <div className="min-h-full bg-base-200">
      <header className="flex h-19 items-center gap-3 border-b border-base-300 bg-base-100 px-6">
        <ShieldCheck size={20} className="text-error" />
        <div>
          <h1 className="font-bold">{text('modules.userAndRoles.settings.title')}</h1>
          <p className="text-xs text-base-content/55">
            {text('modules.userAndRoles.settings.subtitle')}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-5 p-4 sm:p-6">
        <div className="alert alert-info text-sm" role="status">
          {text('modules.userAndRoles.settings.previewNotice')}
        </div>

        <form className="space-y-5" onSubmit={form.handleSubmit}>
          <section className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body gap-4">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-error" />
                <div>
                  <h2 className="font-bold">{text('modules.userAndRoles.settings.authProvider')}</h2>
                  <p className="text-xs text-base-content/55">
                    {text('modules.userAndRoles.settings.authProviderDescription')}
                  </p>
                </div>
              </div>

              <label className="form-control max-w-md">
                <span className="label-text mb-1 mr-2">{text('modules.userAndRoles.settings.authProvider')}</span>
                <select
                  className="select select-sm"
                  value={form.authProvider}
                  onChange={(event) => {
                    if (isAuthProvider(event.target.value)) {
                      form.setAuthProvider(event.target.value);
                    }
                  }}
                >
                  {authProviders.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body gap-4">
              <div className="flex items-center gap-2">
                <Mail size={18} className="text-error" />
                <div>
                  <h2 className="font-bold">{text('modules.userAndRoles.settings.emailTitle')}</h2>
                  <p className="text-xs text-base-content/55">
                    {text('modules.userAndRoles.settings.emailDescription')}
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="form-control flex flex-col">
                  <span className="label-text mb-1">{text('modules.userAndRoles.settings.host')}</span>
                  <span className="input input-sm flex items-center gap-2">
                    <Server size={15} className="text-base-content/45" />
                    <input
                      className="grow"
                      autoComplete="url"
                      placeholder="smtp.example.com"
                      value={form.emailConfig.host}
                      onChange={(event) =>
                        form.updateEmailConfig('host', event.target.value)
                      }
                    />
                  </span>
                </div>

                <div className="form-control flex flex-col">
                  <span className="label-text mb-1">{text('modules.userAndRoles.settings.port')}</span>
                  <input
                    className="input input-sm"
                    type="number"
                    min={1}
                    max={65535}
                    value={form.emailConfig.port}
                    onChange={(event) =>
                      form.updateEmailConfig('port', event.target.value)
                    }
                  />
                </div>

                <label className="form-control flex flex-col">
                  <span className="label-text mb-1">{text('modules.userAndRoles.settings.smtpUsername')}</span>
                  <input
                    className="input input-sm"
                    autoComplete="username"
                    value={form.emailConfig.username}
                    onChange={(event) =>
                      form.updateEmailConfig('username', event.target.value)
                    }
                  />
                </label>

                <label className="form-control flex flex-col">
                  <span className="label-text mb-1 ">{text('modules.userAndRoles.settings.smtpPassword')}</span>
                  <input
                    className="input input-sm"
                    type="password"
                    autoComplete="new-password"
                    value={form.emailConfig.password}
                    onChange={(event) =>
                      form.updateEmailConfig('password', event.target.value)
                    }
                  />
                </label>

                <label className="form-control flex flex-col">
                  <span className="label-text mb-1 ">{text('modules.userAndRoles.settings.senderEmail')}</span>
                  <span className="input input-sm flex items-center gap-2">
                    <AtSign size={15} className="text-base-content/45" />
                    <input
                      className="grow"
                      type="email"
                      autoComplete="email"
                      placeholder="no-reply@example.com"
                      value={form.emailConfig.senderEmail}
                      onChange={(event) =>
                        form.updateEmailConfig('senderEmail', event.target.value)
                      }
                    />
                  </span>
                </label>

                <label className="form-control flex flex-col">
                  <span className="label-text mb-1">{text('modules.userAndRoles.settings.senderName')}</span>
                  <input
                    className="input input-sm"
                    autoComplete="organization"
                    placeholder="LibreERP"
                    value={form.emailConfig.senderName}
                    onChange={(event) =>
                      form.updateEmailConfig('senderName', event.target.value)
                    }
                  />
                </label>
              </div>

              <label className="flex w-fit items-center gap-3">
                <input
                  className="toggle toggle-error"
                  type="checkbox"
                  checked={form.emailConfig.secure}
                  onChange={(event) =>
                    form.updateEmailConfig('secure', event.target.checked)
                  }
                />
                <span>
                  <span className="block text-sm font-medium">{text('modules.userAndRoles.settings.useTls')}</span>
                  <span className="block text-xs text-base-content/55">
                    {text('modules.userAndRoles.settings.secureSmtpConnection')}
                  </span>
                </span>
              </label>
            </div>
          </section>

          <section className="card border border-base-300 bg-base-100 shadow-sm">
            <div className="card-body gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <KeyRound size={18} className="mt-1 text-error" />
                  <div>
                    <h2 className="font-bold">{text('modules.userAndRoles.settings.passkeyTitle')}</h2>
                    <p className="mt-1 max-w-2xl text-sm text-base-content/60">
                      {text('modules.userAndRoles.settings.passkeyDescription')}
                    </p>
                  </div>
                </div>
                <input
                  className="toggle toggle-error"
                  type="checkbox"
                  aria-label={text('modules.userAndRoles.settings.enablePasskey')}
                  checked={form.enablePasskeyLogin}
                  onChange={(event) =>
                    form.setEnablePasskeyLogin(event.target.checked)
                  }
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button className="btn btn-error text-white" type="submit">
              <Save size={16} />
              {text('modules.userAndRoles.settings.save')}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

export default function UserAndRolesSettingsForm() {
  return (
      <SettingsFormContent />
  );
}
