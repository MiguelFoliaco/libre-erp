import { Code, Coins, FlaskConical } from 'lucide-react';
import { useState, useEffect } from 'react'
import { text } from './modules/languages';
import { useLanguage } from './modules/languages/hook';
import { Login } from './modules/auth/login';

interface ConfigErp {
  nameApp: string
  companyName: string
  clientVersion: string

}

const enviroments = [
  {
    name: 'Main',
    tag: 'production',
    clientId: 'clientId-1'
  },
  {
    name: 'Av del Sur',
    tag: 'development',
    clientId: 'clientId-2'
  },
  {
    name: 'Av del Norte',
    tag: 'production',
    clientId: 'clientId-3'
  },
  {
    name: 'Pos Av del Norte',
    tag: 'test',
    clientId: 'clientId-4'
  }
] as const;

export default function App() {

  const [versions, setVersions] = useState<ConfigErp>({
    nameApp: '',
    companyName: '',
    clientVersion: '',
  });
  const { changeLanguage, language } = useLanguage()
  const [enviroment, setEnviroment] = useState<null | typeof enviroments[number]>(enviroments[0]);
  const [step, setStep] = useState(1)

  useEffect(() => {
    if (window.api.getConfigErp) {
      setVersions(window.api.getConfigErp())
    }
  }, [])

  const toggleLanguage = () => {
    changeLanguage(language === 'english' ? 'spanish' : 'english')
  }

  return (
    <main className="mx-auto relative flex items-center justify-center min-h-screen bg-linear-to-r from-primary/20 from-50%  to-neutral/30">
      <div className='bg-base-100 flex flex-col w-100 h-100 p-2'>
        <>
          {
            step === 1 &&
            <>
              <h1 className='text-3xl text-center mt-10'>{text('firstScreen.title')} <span className='text-primary'>{versions.nameApp}</span></h1>

              <p className='text-center mt-10 text-neutral-50/80'>{text('firstScreen.subtitle')} <span className='text-primary'>{versions.companyName}</span></p>


              <div className='mt-auto mb-auto px-10'>
                <div className="flex gap-2 mb-2 items-center">
                  <p className='text-sm '>{text('firstScreen.label-select-environment')}</p>
                  {
                    enviroment?.tag === 'production' &&
                    <div className='tooltip tooltip-top' data-tip="Production Enviroment!">
                      <Coins className='text-success' size={16} />
                    </div>
                  }
                  {
                    enviroment?.tag === 'development' &&
                    <div className='tooltip tooltip-top' data-tip="Development Enviroment!">
                      <Code className='text-warning' size={16} />
                    </div>
                  }
                  {
                    enviroment?.tag === 'test' &&
                    <div className='tooltip tooltip-top' data-tip="Test Enviroment!">
                      <FlaskConical className='text-error' size={16} />
                    </div>
                  }
                </div>
                <select onChange={(e) => {
                  const env = enviroments.find(enviroment => enviroment.clientId === e.target.value);
                  setEnviroment(env || null);
                }
                }
                  value={enviroment?.clientId}
                  className='select select-sm'>
                  {
                    enviroments.map((enviroment, index) => (
                      <option key={index} value={enviroment.clientId}>{enviroment.name}</option>
                    ))
                  }
                </select>
              </div>


              <button onClick={() => setStep(2)} disabled={!enviroment} className='btn btn-primary mt-5 mx-auto block btn-sm w-1/2' >{text('firstScreen.btn-continue')}</button>


            </>
          }
          {
            (step === 2 && enviroment) &&
            <Login onBack={() => setStep(1)} enviroment={enviroment!} />
          }
        </>

      </div>
      <div className='bg-base-100 absolute bottom-2 left-2 p-1 flex ' >
        <p className='text-xs font-mono'>{text('firstScreen.text-version')}: {versions.clientVersion}</p>
        <div className=' text-xs mx-auto ml-5'>
          <p className='text-center select-none'>{text('firstScreen.text-change-language-1')} <span className='text-primary hover:underline  cursor-pointer' onClick={() => toggleLanguage()} >{text('firstScreen.text-change-language-2')}</span></p>
        </div>
      </div>
    </main>
  )
}
