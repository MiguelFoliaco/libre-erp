import { contextBridge, ipcRenderer } from 'electron'
import { config } from 'dotenv'
import packageJson from '../../package.json'

config()

export interface IElectronAPI {
  ping: () => Promise<string>
  getVersions: () => {
    node: string
    chrome: string
    electron: string
  },
  getConfigErp: () => {
    nameApp: string
    companyName: string
    clientVersion: string
  }
}

const api: IElectronAPI = {
  ping: () => ipcRenderer.invoke('ping'),
  getVersions: () => ({
    node: process.versions.node || 'N/A',
    chrome: process.versions.chrome || 'N/A',
    electron: process.versions.electron || 'N/A'
  }),
  getConfigErp: () => ({
    nameApp: 'LibreERP',
    companyName: process.env.COMPANY_NAME || 'N/A',
    clientVersion: packageJson.version || 'N/A'
  })
}

try {
  contextBridge.exposeInMainWorld('api', api)
} catch (error) {
  console.error('Error al inicializar el preload bridge:', error)
}
