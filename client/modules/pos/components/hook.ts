import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError, apiClient } from '@/lib/sdk';
import type {
    POSPaymentMethod,
    POSProduct,
    POSRegister,
    POSSession,
} from '@/lib/sdk';
import { useToast } from '@/modules/common/toast';
import { text } from '@/modules/language';
import { useSession } from '@/modules/auth/hook/store';


interface CartItem {
    product: POSProduct;
    quantity: number;
    discountAmount: number;
}

interface SplitPayment {
    paymentMethodId: string;
    amount: number;
    reference: string;
}

function errorMessage(cause: unknown): string {
    return cause instanceof ApiError || cause instanceof Error
        ? cause.message
        : text('modules.settings.common.operationFailed');
}

export const usePosWorkspace = () => {
    const { notify } = useToast();
    const { session, isLoading: isRestoringSession } = useSession();
    const searchRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);
    const [registers, setRegisters] = useState<POSRegister[]>([]);
    const [activeSession, setActiveSession] = useState<POSSession | null>(null);
    const [query, setQuery] = useState('');
    const [products, setProducts] = useState<POSProduct[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [paymentMethods, setPaymentMethods] = useState<POSPaymentMethod[]>([]);
    const [paymentOpen, setPaymentOpen] = useState(false);
    const [payments, setPayments] = useState<SplitPayment[]>([]);
    const [paymentMethodId, setPaymentMethodId] = useState('');
    const [paymentAmount, setPaymentAmount] = useState('');
    const [reference, setReference] = useState('');
    const [openingRegisterId, setOpeningRegisterId] = useState('');
    const [openingAmount, setOpeningAmount] = useState('0');
    const [saving, setSaving] = useState(false);

    const loadStatus = useCallback(async () => {
        if (isRestoringSession) return;
        if (!session.accessToken) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            const status = await apiClient.posStatus();
            setRegisters(status.registers);
            setActiveSession(status.activeSession);
            if (!status.activeSession && status.registers.length > 0) {
                setOpeningRegisterId(status.registers[0].id);
            }
        } catch (cause: unknown) {
            notify('error', errorMessage(cause));
        } finally {
            setLoading(false);
        }
    }, [isRestoringSession, notify, session.accessToken]);

    useEffect(() => {
        void loadStatus();
    }, [loadStatus]);

    useEffect(() => {
        if (!activeSession) return;
        const controller = new AbortController();
        const timeout = window.setTimeout(() => {
            void apiClient.searchPOSProducts(
                activeSession.cash_register_id,
                query,
                controller.signal,
            ).then((result) => setProducts(result.items))
                .catch((cause: unknown) => {
                    if (cause instanceof ApiError) notify('error', errorMessage(cause));
                });
        }, 180);
        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [activeSession, query, notify]);

    useEffect(() => {
        if (!activeSession) return;
        void apiClient.posPaymentMethods()
            .then((result) => {
                setPaymentMethods(result.items);
                setPaymentMethodId(result.items.find((method) => method.payment_type === 'cash')?.id ?? result.items[0]?.id ?? '');
            })
            .catch((cause: unknown) => notify('error', errorMessage(cause)));
    }, [activeSession, notify]);

    const subtotal = cart.reduce((sum, item) =>
        sum + Number(item.product.sale_price) * item.quantity, 0);
    const discount = cart.reduce((sum, item) => sum + item.discountAmount, 0);
    const tax = cart.reduce((sum, item) => {
        const lineSubtotal = Number(item.product.sale_price) * item.quantity - item.discountAmount;
        const rate = Number(item.product.estimated_tax_rate) || 0;
        return sum + Math.max(0, lineSubtotal * rate / 100);
    }, 0);
    const total = Math.max(0, subtotal - discount + tax);
    const paid = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const change = Math.max(0, paid - total);

    const addProduct = useCallback((product: POSProduct) => {
        setCart((current) => {
            const existing = current.find((item) => item.product.id === product.id);
            if (existing) {
                return current.map((item) => item.product.id === product.id
                    ? { ...item, quantity: item.quantity + 1 }
                    : item);
            }
            return [...current, { product, quantity: 1, discountAmount: 0 }];
        });
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number) => {
        if (quantity <= 0) {
            setCart((current) => current.filter((item) => item.product.id !== productId));
            return;
        }
        setCart((current) => current.map((item) => item.product.id === productId
            ? { ...item, quantity }
            : item));
    }, []);

    const updateDiscount = useCallback((productId: string, value: string) => {
        const amount = Number(value);
        setCart((current) => current.map((item) => item.product.id === productId
            ? { ...item, discountAmount: Number.isFinite(amount) ? Math.max(0, amount) : 0 }
            : item));
    }, []);

    async function openSession() {
        if (!openingRegisterId) return;
        setSaving(true);
        try {
            const session = await apiClient.openPOSSession({
                cashRegisterId: openingRegisterId,
                openingAmount: Number(openingAmount) || 0,
                currencyCode: 'USD',
            });
            setActiveSession(session);
            notify('success', text('modules.settings.pos.openRegister'));
        } catch (cause: unknown) {
            notify('error', errorMessage(cause));
        } finally {
            setSaving(false);
        }
    }

    async function closeSession() {
        if (!activeSession) return;
        const closingValue = window.prompt(text('modules.settings.pos.closingAmount'), '0');
        if (closingValue === null) return;
        setSaving(true);
        try {
            await apiClient.closePOSSession(activeSession.id, {
                closingAmount: Number(closingValue) || 0,
            });
            setActiveSession(null);
            setCart([]);
            await loadStatus();
            notify('success', text('modules.settings.pos.closeRegister'));
        } catch (cause: unknown) {
            notify('error', errorMessage(cause));
        } finally {
            setSaving(false);
        }
    }

    function openPayment() {
        if (!activeSession || cart.length === 0) return;
        setPayments([]);
        setPaymentAmount(total.toFixed(2));
        setPaymentOpen(true);
    }

    function addPayment() {
        const amount = Number(paymentAmount);
        if (!paymentMethodId || !Number.isFinite(amount) || amount <= 0) return;
        setPayments((current) => [
            ...current,
            { paymentMethodId, amount, reference: reference.trim() },
        ]);
        setPaymentAmount(Math.max(0, total - (paid + amount)).toFixed(2));
        setReference('');
    }

    async function checkout() {
        if (!activeSession || cart.length === 0) return;
        const checkoutPayments = payments.length > 0
            ? payments
            : paymentAmount && Number(paymentAmount) > 0
                ? [{ paymentMethodId, amount: Number(paymentAmount), reference: reference.trim() }]
                : [];
        if (checkoutPayments.length === 0) return;
        setSaving(true);
        try {
            await apiClient.posCheckout({
                cashSessionId: activeSession.id,
                items: cart.map((item) => ({
                    productId: item.product.id,
                    quantity: item.quantity,
                    discountAmount: item.discountAmount,
                })),
                payments: checkoutPayments.map((payment) => ({
                    paymentMethodId: payment.paymentMethodId,
                    amount: payment.amount,
                    reference: payment.reference || undefined,
                })),
            });
            // AQUI DEBO GENERAR EL TICKET
            setCart([]);
            setPayments([]);
            setPaymentOpen(false);
            setQuery('');
            notify('success', text('modules.settings.pos.checkout'));
        } catch (cause: unknown) {
            notify('error', errorMessage(cause));
        } finally {
            setSaving(false);
        }
    }

    useEffect(() => {
        function handleKeyboard(event: KeyboardEvent) {
            if (event.key === 'F1') {
                event.preventDefault();
                searchRef.current?.focus();
            } else if (event.key === 'F2') {
                event.preventDefault();
                openPayment();
            } else if (event.key === 'F4') {
                event.preventDefault();
                setCart([]);
            } else if (event.key === 'F11') {
                event.preventDefault();
                if (!document.fullscreenElement) {
                    void document.documentElement.requestFullscreen();
                } else {
                    void document.exitFullscreen();
                }
            } else if (event.key === 'Escape') {
                setPaymentOpen(false);
            }
        }
        window.addEventListener('keydown', handleKeyboard);
        return () => window.removeEventListener('keydown', handleKeyboard);
    });

    const register = registers.find((item) => item.id === activeSession?.cash_register_id);
    const incomeLimit = register && typeof register.metadata?.income_limit === 'number'
        ? register.metadata.income_limit
        : null;
    const cashPaid = payments
        .filter((payment) => paymentMethods.find((method) =>
            method.id === payment.paymentMethodId)?.payment_type === 'cash')
        .reduce((sum, payment) => sum + payment.amount, 0);


    return {
        cashPaid,
        incomeLimit,
        register,
        loading,
        products,
        activeSession,
        checkout,
        addPayment,
        closeSession,
        subtotal,
        discount,
        tax,
        total,
        paid,
        change,
        addProduct,
        updateQuantity,
        updateDiscount,
        openSession,
        searchRef,
        cart,
        setCart,
        saving,
        registers,
        query,
        paymentMethods,
        paymentOpen,
        payments,
        paymentMethodId,
        paymentAmount,
        reference,
        openingRegisterId,
        openingAmount,
        setLoading,
        setRegisters,
        setActiveSession,
        setQuery,
        setProducts,
        setPaymentMethods,
        setPaymentOpen,
        setPayments,
        setPaymentMethodId,
        setPaymentAmount,
        setReference,
        setOpeningRegisterId,
        setOpeningAmount,
        setSaving,
        openPayment
    }
}