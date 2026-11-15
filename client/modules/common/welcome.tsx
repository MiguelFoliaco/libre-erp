
import { Link } from 'react-router'
import {
    FileText,
    ArrowRight,
    ExternalLink,
    CheckCircle2,
    Sparkles,
    BookOpen,
    Layers3
} from 'lucide-react'
import { clsx } from 'clsx';

type Props = {
    name: string
    description: string
    urlExternalDocumentation: string
    flow?: {
        flowName: string
        description?: string
        steps: {
            title: string
            description: string
            path: string
            buttonTitle: string
        }[]
    }[]
    theme: {
        colorPrimary: string
        textColor: string
        colorIcon: string
        primaryColor20: string
        textColorBase: string
        bgColorBase: string
    }
}

export const WelcomeBase = ({
    name,
    description,
    urlExternalDocumentation,
    flow = [],
    theme
}: Props) => {
    return (
        <main className="h-screen bg-base-100">

            {/* Page header */}
            <header className="flex h-16 items-center gap-3 border-b border-base-300 px-6 py-4 lg:px-10">
                <FileText size={21} className="text-base-content/60" />

                <span className="text-sm font-medium text-base-content/70">
                    Getting Started
                </span>
            </header>

            <div className="mx-auto max-w-7xl space-y-9 px-6 py-10 lg:px-10 lg:py-12">

                {/* Welcome */}
                <section>
                    <div className={
                        clsx(
                            "mb-3 flex items-center gap-2 text-sm font-medium ",
                            theme.textColor
                        )
                    }>
                        <Sparkles size={16} className={theme.colorIcon} />
                        Welcome aboard
                    </div>

                    <h1 className="text-3xl font-semibold tracking-tight text-base-content sm:text-4xl">
                        Welcome to{' '}
                        <span className={theme.textColor}>
                            {name}!
                        </span>
                    </h1>

                    <p className="mt-3 max-w-3xl text-base leading-relaxed text-base-content/60 sm:text-lg">
                        {description}
                    </p>

                    {urlExternalDocumentation && (
                        <a
                            href={urlExternalDocumentation}
                            target="_blank"
                            rel="noreferrer"
                            className={
                                clsx(
                                    "link link-hover mt-4 inline-flex items-center gap-2 text-sm font-medium ",
                                    theme.textColor
                                )
                            }
                        >
                            <BookOpen size={16} className={theme.colorIcon} />
                            Explore documentation
                            <ExternalLink size={13} className={theme.colorIcon} />
                        </a>
                    )}
                </section>

                {/* Flows */}
                {flow.length > 0 && (
                    <section className="space-y-5">

                        <div>
                            <h2 className="text-xl font-semibold tracking-tight">
                                Try things out
                            </h2>

                            <p className="mt-1 text-sm text-base-content/60">
                                Explore what you can do with {name}.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

                            {flow.map((item, index) => {
                                const firstStep = item.steps[0]

                                return (
                                    <article
                                        key={item.flowName}
                                        className="card overflow-hidden border border-base-300 bg-base-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
                                    >

                                        {/* Illustration */}
                                        <div className="relative flex h-44 items-center justify-center overflow-hidden border-b border-base-200 bg-base-200/40 p-6">

                                            <div className={clsx(
                                                "absolute -right-10 -top-16 size-48 rounded-full  blur-2xl opacity-25",
                                                theme.colorPrimary
                                            )} />

                                            <div className="relative flex w-full max-w-xs items-center gap-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">

                                                <div className={
                                                    clsx(
                                                        "grid size-14 shrink-0 place-items-center rounded-2xl  ",
                                                        theme.primaryColor20,
                                                    )
                                                }>
                                                    {index % 2 === 0 ? (
                                                        <Layers3 className={theme.textColorBase} size={27} />
                                                    ) : (
                                                        <FileText className={theme.textColorBase} size={27} />
                                                    )}
                                                </div>

                                                <div className="flex-1 space-y-3">
                                                    <div className="h-2.5 w-2/3 rounded-full bg-base-content/15" />
                                                    <div className="h-2.5 w-full rounded-full bg-base-300" />
                                                    <div className="h-2.5 w-4/5 rounded-full bg-base-300" />
                                                </div>

                                                <div className={
                                                    clsx(
                                                        "absolute -bottom-3 -right-2 grid size-9 place-items-center rounded-full border border-base-300 bg-base-100  shadow-sm",
                                                        theme.textColorBase
                                                    )
                                                }>
                                                    <CheckCircle2 size={19} />
                                                </div>
                                            </div>

                                        </div>

                                        <div className="card-body gap-4 p-6">

                                            {/* Metadata */}
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="badge badge-ghost gap-1.5">
                                                    <Sparkles size={12} />
                                                    {item.steps.length} steps
                                                </span>

                                                <span className="text-xs text-base-content/40">
                                                    Getting started
                                                </span>
                                            </div>

                                            {/* Title */}
                                            <div>
                                                <h3 className="text-xl font-semibold tracking-tight">
                                                    {item.flowName}
                                                </h3>

                                                <p className="mt-2 min-h-10 text-sm leading-relaxed text-base-content/60">
                                                    {item.description || 'Follow these steps to complete this operation.'}
                                                </p>
                                            </div>

                                            {/* Steps */}
                                            <div className="space-y-4 border-t border-base-300 pt-5">

                                                <p className="text-xs font-semibold uppercase tracking-wider text-base-content/50">
                                                    Steps to follow
                                                </p>

                                                <ol className="space-y-4">
                                                    {item.steps.map((step, stepIndex) => (
                                                        <li
                                                            key={`${step.path}-${stepIndex}`}
                                                            className="flex items-start gap-3"
                                                        >
                                                            <div className="flex size-7 shrink-0 items-center justify-center rounded-full border border-base-300 bg-base-200 text-xs font-semibold">
                                                                {stepIndex + 1}
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <p className="text-sm font-medium">
                                                                    {step.title}
                                                                </p>

                                                                <p className="mt-1 text-xs leading-relaxed text-base-content/60">
                                                                    {step.description}
                                                                </p>

                                                                <Link
                                                                    to={step.path}
                                                                    className={
                                                                        clsx(
                                                                            "link link-hover mt-2 inline-flex items-center gap-1 text-xs font-medium ",
                                                                            theme.textColor
                                                                        )
                                                                    }
                                                                >
                                                                    {step.buttonTitle}
                                                                    <ArrowRight size={13} />
                                                                </Link>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>

                                            {/* Footer */}
                                            <div className="mt-auto flex items-center justify-between gap-3 border-t border-base-300 pt-5">
                                                <span className="text-xs text-base-content/50">
                                                    Step-by-step guide
                                                </span>

                                                {firstStep && (
                                                    <Link
                                                        to={firstStep.path}
                                                        className={`btn btn-sm ${theme.colorPrimary}`}
                                                    >
                                                        Get started
                                                        <ArrowRight size={15} />
                                                    </Link>
                                                )}
                                            </div>

                                        </div>
                                    </article>
                                )
                            })}

                        </div>
                    </section>
                )}

                {/* Documentation footer */}
                <footer className="flex flex-col gap-4 rounded-xl border border-base-300 bg-base-200/30 p-5 sm:flex-row sm:items-center sm:justify-between">

                    <div className="flex items-center gap-3">
                        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-base-200">
                            <BookOpen size={21} className="text-base-content/60" />
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold">
                                Need more information?
                            </h3>

                            <p className="mt-1 text-xs text-base-content/60">
                                Learn more about the features and capabilities of this module.
                            </p>
                        </div>
                    </div>

                    {urlExternalDocumentation && (
                        <a
                            href={urlExternalDocumentation}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-outline btn-sm"
                        >
                            Documentation
                            <ExternalLink size={14} />
                        </a>
                    )}

                </footer>

            </div>
        </main>
    )
}
