import { useState, type FormEvent } from 'react';
import { useToast } from '../../../common/toast';
import { text } from '../../../language';

export type AuthProvider = 'local' | 'google' | 'github' | 'gitlab' | 'microsoft';

export interface EmailConfig {
  host: string;
  port: string;
  secure: boolean;
  username: string;
  password: string;
  senderEmail: string;
  senderName: string;
}

export function useSettingsForm() {
  const { notify } = useToast();
  const [authProvider, setAuthProvider] = useState<AuthProvider>('local');
  const [emailConfig, setEmailConfig] = useState<EmailConfig>({
    host: '',
    port: '587',
    secure: true,
    username: '',
    password: '',
    senderEmail: '',
    senderName: '',
  });
  const [enablePasskeyLogin, setEnablePasskeyLogin] = useState(false);

  function updateEmailConfig<Key extends keyof EmailConfig>(
    key: Key,
    value: EmailConfig[Key],
  ) {
    setEmailConfig((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    notify(
      'info',
      text('startModule.userAndRoles.notifications.settingsPreviewSaved'),
    );
  }

  return {
    authProvider,
    setAuthProvider,
    emailConfig,
    updateEmailConfig,
    enablePasskeyLogin,
    setEnablePasskeyLogin,
    handleSubmit,
  };
}
