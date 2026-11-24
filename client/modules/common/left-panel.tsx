import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight, LayoutDashboard, LogOut, SkipBack, UsersRound } from "lucide-react";
import { Link, useLocation, useParams } from "react-router";
import { clsx } from "clsx";
import { text } from "../language";
import { useSession } from "../auth/hook/store";

export type LeftNavigation = {
    label: string;
    key: string;
    path: string;
    icon: typeof UsersRound;
};

type LeftPanelProps = {
    navigation: LeftNavigation[];
    primaryColor: string;
    primaryColor10: string;
    textPrimary: string;
    nameModule: string;
    IconModule: typeof LayoutDashboard;
};

export const LeftPanel = ({
    navigation,
    primaryColor,
    primaryColor10,
    nameModule,
    textPrimary,
    IconModule,
}: LeftPanelProps) => {
    const { logout, user } = useSession();
    const { section } = useParams();
    const location = useLocation();
    const [hidden, setHidden] = useState(false);
    const prefersReducedMotion = useReducedMotion();
    const transition = prefersReducedMotion
        ? { duration: 0 }
        : { type: "spring" as const, stiffness: 280, damping: 30 };

    return (
        <motion.aside
            animate={{ width: hidden ? 68 : 256 }}
            transition={transition}
            className="sticky top-0 flex h-screen shrink-0 select-none flex-col overflow-hidden border-r border-base-300/80 bg-base-100"
        >
            <AnimatePresence mode="wait" initial={false}>
                {hidden ? (
                    <motion.div
                        key="collapsed"
                        initial={prefersReducedMotion ? false : { opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={prefersReducedMotion ? undefined : { opacity: 0, x: -8 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
                        className="flex h-full flex-col items-center p-2"
                    >
                        <motion.div
                            whileHover={prefersReducedMotion ? undefined : { scale: 1.05 }}
                            className={clsx("grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-sm", primaryColor)}
                        >
                            <IconModule size={16} aria-hidden="true" />
                        </motion.div>
                        <motion.button
                            type="button"
                            whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                            onClick={() => setHidden(false)}
                            className="btn btn-circle btn-sm btn-ghost mt-2"
                            aria-label="Expandir menú"
                            title="Expandir menú"
                        >
                            <ChevronRight size={16} />
                        </motion.button>

                        <nav
                            aria-label={text("common.leftPanel.workspace")}
                            className="mt-5 flex w-full flex-1 flex-col border-t border-base-300 pt-5"
                        >
                            <div className="flex flex-col items-center gap-1">
                                {navigation.map(({ label, icon: Icon, path, key }, index) => {
                                    const isActive = location.pathname === path || (section !== undefined && section === key);
                                    return (
                                        <motion.div
                                            key={label}
                                            initial={prefersReducedMotion ? false : { opacity: 0, y: 5 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: prefersReducedMotion ? 0 : index * 0.025 }}
                                        >
                                            <Link
                                                to={path}
                                                viewTransition
                                                aria-label={label}
                                                title={label}
                                                aria-current={isActive ? "page" : undefined}
                                                className={clsx(
                                                    "flex size-10 items-center justify-center rounded-lg transition-colors",
                                                    isActive
                                                        ? `${primaryColor10} ${textPrimary}`
                                                        : "text-base-content/65 hover:bg-base-200 hover:text-base-content",
                                                )}
                                            >
                                                <Icon size={17} aria-hidden="true" />
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </div>
                            <div className="mt-auto flex flex-col items-center gap-1">
                                <Link
                                    to="/"
                                    viewTransition
                                    aria-label={text("common.leftPanel.returnHome")}
                                    title={text("common.leftPanel.returnHome")}
                                    className="flex size-10 items-center justify-center rounded-lg text-base-content/60 transition-colors hover:bg-base-200 hover:text-base-content"
                                >
                                    <SkipBack size={17} aria-hidden="true" />
                                </Link>
                                <motion.button
                                    type="button"
                                    whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                                    onClick={() => void logout()}
                                    className="flex size-10 items-center justify-center rounded-lg text-base-content/50 transition-colors hover:bg-error/10 hover:text-error"
                                    aria-label={text("common.leftPanel.logout")}
                                    title={text("common.leftPanel.logout")}
                                >
                                    <LogOut size={17} aria-hidden="true" />
                                </motion.button>
                            </div>
                        </nav>
                    </motion.div>
                ) : (
                    <motion.div
                        key="expanded"
                        initial={prefersReducedMotion ? false : { opacity: 0, x: 8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={prefersReducedMotion ? undefined : { opacity: 0, x: 8 }}
                        transition={{ duration: prefersReducedMotion ? 0 : 0.16 }}
                        className="flex h-full min-w-64 flex-col"
                    >
                        <div className="flex h-[76px] shrink-0 items-center gap-3 border-b border-base-300/70 px-5">
                            <motion.div
                                whileHover={prefersReducedMotion ? undefined : { scale: 1.05, rotate: -3 }}
                                className={clsx("grid size-10 shrink-0 place-items-center rounded-xl text-white shadow-sm", primaryColor)}
                            >
                                <IconModule size={19} aria-hidden="true" />
                            </motion.div>
                            <div className="min-w-0 flex-1">
                                <p className="font-semibold tracking-tight text-base-content">LibreERP</p>
                                <p className="truncate text-xs text-base-content/55">{nameModule}</p>
                            </div>
                        </div>

                        <nav
                            aria-label={text("common.leftPanel.workspace")}
                            className="flex flex-1 flex-col px-3 py-6"
                        >
                            <div className="flex items-center justify-between px-2 pb-3">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-base-content/45">
                                    {text("common.leftPanel.workspace")}
                                </p>
                                <motion.button
                                    type="button"
                                    whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                                    onClick={() => setHidden(true)}
                                    className="btn btn-circle btn-sm btn-ghost"
                                    aria-label="Contraer menú"
                                    title="Contraer menú"
                                >
                                    <ChevronLeft size={16} />
                                </motion.button>
                            </div>
                            <div className="flex flex-col gap-1">
                                {navigation.map(({ label, icon: Icon, path, key }, index) => {
                                    const isActive = location.pathname === path || (section !== undefined && section === key);
                                    return (
                                        <motion.div
                                            key={label}
                                            initial={prefersReducedMotion ? false : { opacity: 0, x: -6 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: prefersReducedMotion ? 0 : index * 0.025 }}
                                        >
                                            <Link
                                                to={path}
                                                viewTransition
                                                aria-current={isActive ? "page" : undefined}
                                                className={clsx(
                                                    "flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] transition-colors",
                                                    isActive
                                                        ? `${primaryColor10} font-semibold ${textPrimary}`
                                                        : "text-base-content/65 hover:bg-base-200 hover:text-base-content",
                                                )}
                                            >
                                                <Icon size={17} aria-hidden="true" />
                                                <span>{label}</span>
                                                {isActive && (
                                                    <motion.span
                                                        layoutId="left-panel-active-indicator"
                                                        transition={transition}
                                                        className={clsx("ml-auto size-1.5 rounded-full", primaryColor)}
                                                        aria-hidden="true"
                                                    />
                                                )}
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </div>
                            <Link
                                to="/"
                                viewTransition
                                className="mt-auto flex min-h-10 items-center gap-3 rounded-lg px-3 text-[13px] text-base-content/60 transition-colors hover:bg-base-200 hover:text-base-content"
                            >
                                <SkipBack size={17} aria-hidden="true" />
                                <span>{text("common.leftPanel.returnHome")}</span>
                            </Link>
                        </nav>

                        <div className="shrink-0 border-t border-base-300/70 p-3">
                            <div className="flex items-center gap-3 rounded-xl p-2">
                                <div className={clsx("grid size-9 shrink-0 place-items-center rounded-full text-sm font-semibold text-white", primaryColor)}>
                                    {user?.firstName?.charAt(0)?.toUpperCase()}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">{[user?.firstName, user?.lastName].filter(Boolean).join(" ")}</p>
                                    <p className="truncate text-xs text-base-content/50">{user?.rol_name}</p>
                                </div>
                                <motion.button
                                    type="button"
                                    whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                                    onClick={() => void logout()}
                                    className="grid size-9 shrink-0 place-items-center rounded-lg text-base-content/50 transition-colors hover:bg-error/10 hover:text-error"
                                    aria-label={text("common.leftPanel.logout")}
                                    title={text("common.leftPanel.logout")}
                                >
                                    <LogOut size={17} aria-hidden="true" />
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.aside>
    );
};
