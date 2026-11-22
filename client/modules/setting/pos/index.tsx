import { ShoppingCartPlus } from 'lucide-react';
import { text } from '@/modules/language';
import { ListPOS } from './components/list-pos';


export default function POS() {
    return (
        <div className="min-h-full bg-base-100">
            <header className="flex h-16 items-center gap-3 border-b border-base-300 bg-base-100 px-6 py-4">
                <ShoppingCartPlus size={20} className="text-neutral" />
                <div>
                    <h1 className="font-bold">{text("modules.settings.pos.title")}</h1>
                    <p className="text-xs text-base-content/60">{text("modules.settings.pos.description")}</p>
                </div>
            </header>

            <ListPOS />
        </div>
    )
}
