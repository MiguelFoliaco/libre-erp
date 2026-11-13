import { Lock } from "lucide-react";
import { text } from "../languages";

type Props = {
    enviroment: {
        clientId: string;
        name: string;
    },
    onBack: () => void
}

export const Login = ({ enviroment, onBack }: Props) => {
    return (
        <div className="relative">
            <button className='btn btn-ghost absolute top-5 left-5 btn-sm' onClick={onBack}  >{text('common.back')}</button>
            <h1 className='text-2xl text-center mt-5'>{text('login.title')} <br />{enviroment.name}</h1>

            <div className='flex flex-col  mx-10 mt-10'>
                <label className='label mb-1'>{text('login.username')}</label>
                <div className=" input input-sm w-full outline-none max-w-xs">
                    @
                    <input type="text" className='grow' />
                </div>
            </div>
            <div className='flex flex-col  mx-10 mt-5'>
                <label className='label'>{text('login.password')}</label>
                <div className="input input-sm w-full max-w-xs ">
                    <Lock size={16} />
                    <input type="text" className='grow' />
                </div>
                <button className='btn btn-primary  block ml-auto mt-10 btn-sm'>{text('login.sign-in')}</button>
            </div>

            <p className='text-center mt-5 text-sm select-none'>{text('login.forgot-password')} <span className='text-primary cursor-pointer'>{text('login.recover-password')}</span></p>

        </div>
    )
}