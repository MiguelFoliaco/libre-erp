import { Eye, EyeClosed, Pencil, Plus, Trash2, User2 } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { text } from './../../language';
import { Table, type TableAction, } from './../../common/table';
import { apiClient } from './../../../lib/sdk';
import { useToast } from './../../common/toast';
import { type People } from './../../../lib/crm';
import { format } from '@formkit/tempo';
import { clsx } from 'clsx';

const primaryColor = 'bg-linear-to-tr from-emerald-500 via-green-500 to-120% to-yellow-400'



const actions: TableAction<People>[] = [
    {
        label: 'Ver',
        icon: <Eye size={16} />,
        onClick: row => console.log('Ver', row)
    },
    {
        label: 'Editar',
        icon: <Pencil size={16} />,
        onClick: row => console.log('Editar', row)
    },
    {
        label: 'Eliminar',
        icon: <Trash2 size={16} />,
        className: 'text-error',
        onClick: row => console.log('Eliminar', row)
    }
]

export const Peoples = () => {

    const [closeInfoSecction, setCloseInfoSecction] = useState(false);
    const [persons, setPersons] = useState<People[]>([])
    const [documentType, setDocumentType] = useState<{ name: string, id: string, code: string }[]>([])

    const { notify } = useToast()

    useEffect(() => {

        apiClient.list<People>('people')
            .then(res => {
                setPersons(res.items);
            })
            .catch(err => {
                notify('error', err.message)
            })
        apiClient.list<{ name: string, id: string, code: string }>('document-types-people')
            .then(res => {
                setDocumentType(res.items);
            })
            .catch(err => {
                notify('error', err.message)
            })
        const closeInfoSecction = localStorage.getItem('closeInfoSecction');
        if (closeInfoSecction) {
            setCloseInfoSecction(JSON.parse(closeInfoSecction));
        }
    }, [])


    const toggleInfoSecction = () => {
        localStorage.setItem('closeInfoSecction', JSON.stringify(!closeInfoSecction));
        setCloseInfoSecction(!closeInfoSecction);
    }

    return (
        <div>
            {/* Page header */}
            <header className="flex h-16 bg-base-100 items-center gap-3 border-b border-base-300 px-6 py-4 lg:px-10">
                <User2 size={21} className="text-base-content/60" />
                <span className="text-sm font-medium text-base-content/70">
                    {text('modules.crm.navigation.people')}
                </span>
            </header>


            {
                closeInfoSecction ? null : (
                    <div className="mx-auto max-w-7xl h-fit mt-2 p-4 bg-base-100 rounded-sm shadow-2xl shadow-base-300 relative">
                        <div className="tooltip tooltip-left absolute top-4 right-4 " data-tip="Ocultar">
                            <button onClick={toggleInfoSecction} className="btn btn-circle btn-sm btn-ghost"><EyeClosed size={15} /></button>
                        </div>
                        <p className="font-semibold text-lg">{text('modules.crm.navigation.people')}</p>
                        <p className="text-sm opacity-80 mt-2">Aquí podras crear un nuevo contacto que será el registro madre para todos modelos o registros relacionados, clientes, trabajadores, proveedores, ventas, etc...</p>
                    </div>
                )
            }


            <div className='mt-2' />

            <div className="mx-auto max-w-7xl p-4 bg-base-100 rounded-sm shadow-2xl shadow-base-300">

                <div className="flex justify-between items-center mb-3">



                    <button className={
                        clsx("btn btn-sm text-white ml-auto",
                            primaryColor
                        )
                    }>Crear contacto
                        <Plus size={16} className="ml-1" />
                    </button>
                </div>

                <Table<People>
                    data={persons}
                    columns={[
                        {
                            key: 'id',
                            label: 'ID',
                            className: 'w-16 font-medium',
                            render: (value) => <span className="font-medium kbd kbd-xs cursor-copy hover:scale-90" onClick={async () => {
                                await navigator.clipboard.writeText(value as string)
                                notify('info', 'Copiado al portapapeles')
                            }}>{(value as string).substring(0, 6)}</span>,
                        },
                        {
                            key: 'first_name',
                            label: 'Nombres',
                            className: 'font-medium'
                        },
                        {
                            key: 'middle_name',
                            label: 'S. Nombre',
                            className: 'font-medium'
                        },
                        {
                            key: 'last_name',
                            label: 'Apellidos',
                            className: 'font-medium'
                        },
                        {
                            key: 'address_str',
                            label: 'Direccion',
                            className: 'font-medium',
                            render: (_, row) => <span>{row.address_fields.map(e => row?.address[e] ?? ' ').join(', ')}</span>
                        },
                        {
                            key: 'phone',
                            label: 'Telefono',
                            className: 'font-medium'
                        },
                        {
                            key: 'email',
                            label: 'Correo',
                            className: 'font-medium'
                        },
                        {
                            key: 'birth_date',
                            label: 'Fecha de Nacimiento',
                            render: (value) => value ? format(value as string | Date, 'medium') : 'N/A',
                            className: 'font-medium'
                        },
                        {
                            key: 'document_number',
                            label: 'Documento',
                            className: 'font-medium'
                        },
                        {
                            key: 'document_types_people_id',
                            label: 'Tipo de Documento',
                            render: (_, row) => documentType.find(e => e.id === row.document_types_people_id)?.name,
                            className: 'font-medium'
                        },
                    ]}
                    actions={actions}
                    pageSize={5}
                />
            </div>
        </div>
    )
}
