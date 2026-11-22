
import { Maximize2, Minus, Plus, Search, ShoppingCart, Trash2, X } from 'lucide-react';

import { text } from '@/modules/language';
import { usePosWorkspace } from './hook';
import { clsx } from 'clsx';
import { m } from 'motion/react';
import { Table } from '@/modules/common/table';





function money(value: number, currency = 'USD'): string {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(value);
}

const primaryColor = 'bg-linear-to-tr from-purple-500 to-120% to-pink-400'

export function POSWorkspace() {

    const {
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
        setQuery,
        setPaymentOpen,
        setPaymentMethodId,
        setPaymentAmount,
        setReference,
        setOpeningRegisterId,
        setOpeningAmount,
        openPayment

    } = usePosWorkspace()

    if (loading) return <div className="skeleton m-6 h-64" />;

    if (!activeSession) {
        return (
            <main className="grid min-h-screen place-items-center bg-base-200 p-6">
                <section className="card w-full max-w-100 border border-base-300 bg-base-100 shadow-xl" aria-labelledby="open-register-title">
                    <div className="card-body gap-4">
                        <h1 id="open-register-title" className="card-title">{text('modules.settings.pos.openRegister')}</h1>
                        {registers.length === 0 ? (
                            <p>{text('modules.settings.pos.noRegisters')}</p>
                        ) : (
                            <>
                                <label className="flex flex-col gap-1">
                                    <span className="label-text">{text('modules.settings.pos.registerName')}</span>
                                    <select className="select select-sm w-full" value={openingRegisterId}
                                        onChange={(event) => setOpeningRegisterId(event.target.value)}>
                                        {registers.filter((item) => item.is_active).map((item) =>
                                            <option key={item.id} value={item.id} disabled={Boolean(item.active_session_id)}>
                                                {item.name} {item.active_session_id ? '(sesion activa)' : ''}
                                            </option>)}
                                    </select>
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="label-text">{text('modules.settings.pos.openingAmount')}</span>
                                    <input className="input input-sm w-full" type="number" min="0" step="0.01" value={openingAmount}
                                        onChange={(event) => setOpeningAmount(event.target.value)} />
                                </label>
                                <button className={
                                    clsx(
                                        "btn text-white border-purple-500 btn-sm",
                                        primaryColor
                                    )
                                } disabled={saving} onClick={() => void openSession()}>
                                    {text('modules.settings.pos.openRegister')} <kbd className="kbd kbd-sm">Enter</kbd>
                                </button>
                            </>
                        )}
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="h-screen overflow-hidden bg-base-200">
            <header className="flex h-14 items-center gap-3 border-b border-base-300 bg-base-100 px-4">
                <ShoppingCart size={20} />
                <strong>{register?.name ?? text('modules.settings.pos.title')}</strong>
                <span className="badge badge-outline">{activeSession.opened_at.slice(0, 16).replace('T', ' ')}</span>
                <button className="btn btn-ghost btn-sm ml-auto" onClick={() => void document.documentElement.requestFullscreen()}>
                    <Maximize2 size={16} /> {text('modules.settings.pos.fullscreen')} <kbd className="kbd kbd-sm">F11</kbd>
                </button>
                <button className="btn btn-error  btn-sm" onClick={() => void closeSession()} disabled={saving}>
                    {text('modules.settings.pos.closeRegister')}
                </button>
            </header>

            {incomeLimit !== null && cashPaid > incomeLimit && (
                <div className="alert alert-warning rounded-none py-2" role="alert">
                    {text('modules.settings.pos.cashLimitWarning')} {money(incomeLimit)}
                </div>
            )}

            <div className="grid h-[calc(100%-3.5rem)] grid-cols-[minmax(0,1.35fr)_minmax(340px,.65fr)]">
                <section className="flex min-h-0 flex-col border-r border-base-300 p-4" aria-label="Busqueda de productos">
                    <label className="input input-sm outline-none flex items-center gap-2">
                        <Search size={20} />
                        <input ref={searchRef} autoFocus className="grow" value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            placeholder={text('modules.settings.pos.openSearch')} />
                        <kbd className="kbd">F1</kbd>
                    </label>
                    <div className='bg-base-100 p-4 mt-5 rounded-sm shadow-sm'>
                        <Table
                            data={products}
                            columns={[
                                {
                                    key: 'sku',
                                    label: 'SKU'
                                },
                                {
                                    key: 'name',
                                    label: text('modules.crm.people.name'),
                                },
                                {
                                    key: 'barcode',
                                    label: 'BARCODE'
                                },
                                {
                                    key: 'sale_price',
                                    label: text('modules.products.fields.salePrice'),
                                    render: (_, product) => money(Number(product.sale_price), product.currency_code)
                                },
                                {
                                    key: 'quantity',
                                    label: 'Quantity',
                                    render: v => <span className={
                                        clsx(
                                            "badge  text-white badge-sm",
                                            primaryColor
                                        )
                                    }>{Number(v as string)} ud</span>
                                }
                            ]}
                            actions={[
                                {
                                    label: text('common.next'),
                                    onClick: (product) => addProduct(product)
                                }
                            ]}
                        />
                    </div>
                </section>

                <aside className="flex min-h-0 flex-col bg-base-100" aria-label="Carrito">
                    <div className="flex items-center border-b border-base-300 px-4 py-3">
                        <h2 className="font-bold">{text('modules.settings.pos.checkout')}</h2>
                        <span className={
                            clsx(
                                "badge text-white ml-2",
                                primaryColor
                            )
                        }>{cart.length}</span>
                        <button className="btn btn-ghost btn-sm ml-auto" onClick={() => setCart([])}>
                            <Trash2 size={15} /> {text('modules.settings.pos.clearCart')} <kbd className="kbd kbd-sm">F4</kbd>
                        </button>
                    </div>
                    <div className="min-h-0 flex-1 overflow-y-auto p-3">
                        {cart.map((item) => (
                            <div className="mb-2 rounded-box border border-base-300 p-3" key={item.product.id}>
                                <div className="flex items-start gap-2">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold">{item.product.name}</p>
                                        <p className="text-xs opacity-60">{item.product.sku ?? item.product.barcode}</p>
                                    </div>
                                    <button className="btn btn-xs btn-ghost" aria-label="Eliminar"
                                        onClick={() => updateQuantity(item.product.id, 0)}><X size={14} /></button>
                                </div>
                                <div className="mt-3 grid grid-cols-[1fr_5rem] gap-2">
                                    <div className="join">
                                        <button className="btn btn-sm join-item" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}><Minus size={14} /></button>
                                        <input className="input input-sm join-item w-full text-center" type="number" min="1"
                                            value={item.quantity}
                                            onChange={(event) => updateQuantity(item.product.id, Number(event.target.value) || 1)} />
                                        <button className="btn btn-sm join-item" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}><Plus size={14} /></button>
                                    </div>
                                    <input className="input input-sm" type="number" min="0" step="0.01" aria-label={text('modules.settings.pos.discount')}
                                        value={item.discountAmount}
                                        onChange={(event) => updateDiscount(item.product.id, event.target.value)} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="border-t border-base-300 p-4">
                        <div className="space-y-1 text-sm">
                            <div className="flex justify-between"><span>{text('modules.settings.pos.subtotal')}</span><strong>{money(subtotal)}</strong></div>
                            <div className="flex justify-between"><span>{text('modules.settings.pos.discount')}</span><strong>-{money(discount)}</strong></div>
                            <div className="flex justify-between"><span>{text('modules.settings.pos.taxes')}</span><strong>{money(tax)}</strong></div>
                            <div className="flex justify-between border-t border-base-300 pt-2 text-lg"><span>{text('modules.settings.pos.total')}</span><strong>{money(total)}</strong></div>
                        </div>
                        <button className={
                            clsx(
                                "btn mt-3 w-full text-white",
                                primaryColor
                            )
                        } onClick={openPayment} disabled={cart.length === 0}>
                            {text('modules.settings.pos.checkout')} <kbd className="kbd kbd-sm">F2</kbd>
                        </button>
                    </div>
                </aside>
            </div>

            {paymentOpen && (
                <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-labelledby="payment-title">
                    <div className="card w-full max-w-xl border border-base-300 bg-base-100 shadow-2xl">
                        <div className="card-body">
                            <div className="flex items-center">
                                <h2 id="payment-title" className="card-title">{text('modules.settings.pos.checkout')}</h2>
                                <button className="btn btn-ghost btn-sm ml-auto" aria-label="Cerrar" onClick={() => setPaymentOpen(false)}><X size={18} /></button>
                            </div>
                            <p className="text-3xl font-bold">{money(total)}</p>
                            <div className="grid gap-3 mb-4 sm:grid-cols-[1fr_8rem_1fr]">
                                <label className="flex flex-col gap-1">
                                    <span className="label-text">{text('modules.settings.pos.paymentMethod')}</span>
                                    <select className="select select-sm " value={paymentMethodId} onChange={(event) => setPaymentMethodId(event.target.value)}>
                                        {paymentMethods.map((method) => <option key={method.id} value={method.id}>{method.name}</option>)}
                                    </select>
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="label-text">{text('modules.settings.pos.amount')}</span>
                                    <input className="input input-sm " type="number" min="0" step="0.01" value={paymentAmount}
                                        onChange={(event) => setPaymentAmount(event.target.value)} />
                                </label>
                                <label className="flex flex-col gap-1">
                                    <span className="label-text">{text('modules.settings.pos.reference')}</span>
                                    <input className="input input-sm " value={reference} onChange={(event) => setReference(event.target.value)} />
                                </label>
                            </div>
                            <button className="btn btn-outline btn-sm" onClick={addPayment}>{text('modules.settings.pos.addPayment')}</button>
                            {payments.length > 0 && (
                                <div className="space-y-1">
                                    {payments.map((payment, index) => (
                                        <div className="flex justify-between rounded-box bg-base-200 px-3 py-2" key={`${payment.paymentMethodId}-${index}`}>
                                            <span>{paymentMethods.find((method) => method.id === payment.paymentMethodId)?.name}</span>
                                            <strong>{money(payment.amount)}</strong>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {paid > 0 && <p className="font-semibold">{text('modules.settings.pos.amount')}: {money(paid)} | Cambio: {money(change)}</p>}
                            <button className={
                                clsx(
                                    "btn text-white btn-sm",
                                    primaryColor

                                )
                            } onClick={() => void checkout()} disabled={saving || cart.length === 0}>
                                {text('modules.settings.pos.checkout')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
