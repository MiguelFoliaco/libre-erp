import { Building, Store } from "lucide-react";
import { Link } from "react-router";
import { text } from "../../language";

export default function SettingsHome() {
    return (
        <div className="min-h-full bg-base-200">
            <header className="border-b border-base-300 bg-base-100 px-6 py-5">
                <h1 className="text-xl font-bold">{text("startModule.settings.home.title")}</h1>
                <p className="mt-1 text-sm text-base-content/60">
                    {text("startModule.settings.home.description")}
                </p>
            </header>
            <main className="mx-auto grid max-w-5xl gap-4 p-4 sm:grid-cols-2 sm:p-6">
                <Link
                    className="card border border-base-300 bg-base-100 shadow-sm transition hover:border-primary"
                    to="/start/settings/company"
                >
                    <div className="card-body">
                        <Building className="text-neutral" size={22} />
                        <h2 className="card-title">{text("startModule.settings.home.companyTitle")}</h2>
                        <p className="text-sm text-base-content/60">
                            {text("startModule.settings.home.companyDescription")}
                        </p>
                    </div>
                </Link>
                <Link
                    className="card border border-base-300 bg-base-100 shadow-sm transition hover:border-primary"
                    to="/start/settings/branches"
                >
                    <div className="card-body">
                        <Store className="text-neutral" size={22} />
                        <h2 className="card-title">{text("startModule.settings.home.branchesTitle")}</h2>
                        <p className="text-sm text-base-content/60">
                            {text("startModule.settings.home.branchesDescription")}
                        </p>
                    </div>
                </Link>
            </main>
        </div>
    );
}
