import React, { Suspense } from 'react'
import { useParams } from 'react-router';

const LazyManager = React.lazy(() => import('@/modules/user-and-roles/manager/manager'));
const LazySettings = React.lazy(() => import('@/modules/user-and-roles/components/setting/form'));


const SectionRoles = () => {
    const { section } = useParams();

    return (
        <Suspense fallback={<div className='skeleton mt-20 w-10/12 h-10/12 m-auto' />}>
            {section === 'manager' && <LazyManager />}
            {section === 'settings' && <LazySettings />}
            {section !== 'manager' && section !== 'settings' && (
                <p className="p-6" role="alert">La sección solicitada no existe.</p>
            )}
        </Suspense>
    )
}


export default SectionRoles