import React, { useCallback, useEffect, useState } from 'react'
import { apiClient } from '@/lib/sdk';
import { useToast } from '@/modules/common/toast';
import type { CashRegisters } from '@/lib/settings';
import { Table } from '@/modules/common/table';
import { div } from 'motion/react-client';
import { getAddressStr } from '@/modules/common/utils/get-address';
import type { AddressValues } from '@/config';
import { truncate } from '@/modules/common/utils/truncate';
import { useCopy } from '@/modules/common/utils/copy';

export const ListPOS = () => {

    const [loading, setLoading] = useState(false)
    const [poss, setPOSs] = useState<CashRegisters[]>([])
    const [pagination, setPagination] = useState<{ limit: number, offset: number }>({ limit: 0, offset: 0 })
    const copy = useCopy()
    const { notify } = useToast()


    const load = useCallback(() => {
        setLoading(true)
        apiClient.searchPos()
            .then(res => {
                setPOSs(res.items)
                setPagination({ limit: res.limit, offset: res.offset })
                notify('success', 'Load successfull')
            })
            .catch(err => {
                notify('error', err)
            })
            .finally(() => {
                setLoading(false)
            })
    }, [])



    useEffect(() => {
        void load()
    }, [load]);


    return (
        <div>
            {
                loading ?
                    <div className='skeleton w-[80%] mx-auto mt-5 h-100' />
                    :
                    <div className='p-3 w-10/12 mx-auto'>
                        <Table
                            data={poss}
                            columns={[
                                {
                                    key: 'id',
                                    label: 'ID',
                                    kbdType: true,
                                    truncate: 10
                                },
                                {
                                    key: 'code',
                                    label: 'Code',
                                    kbdType: true,

                                },
                                {
                                    key: 'name',
                                    label: 'Nombre'
                                },
                                {
                                    key: 'warehouse_name',
                                    label: 'Bodega'
                                },
                                {
                                    key: 'branch_name',
                                    label: 'Sucursal'
                                },
                                {
                                    key: 'branch_address',
                                    label: 'Sucursal Dirreccion',
                                    render: value => value ? <span className='cursor-pointer' onClick={() => copy(getAddressStr(value as AddressValues))} >{truncate(getAddressStr(value as AddressValues), 50)}</span> : <>--</>
                                },


                            ]}
                        />
                    </div>
            }
        </div>
    )
}
