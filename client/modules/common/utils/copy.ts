import { useCallback } from 'react';
import { useToast } from '../toast';
import { text as t } from '@/modules/language';

export const useCopy = () => {
    const { notify } = useToast()

    return useCallback(async (text: string) => {
        await navigator.clipboard.writeText(text);
        notify('info', t('common.copy-text'))
    }, [notify])
}