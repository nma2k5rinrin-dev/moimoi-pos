import {
    UtensilsCrossed,
    ChefHat,
    BarChart3,
    Settings,
} from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function BottomNav() {
    const location = useLocation();
    const currentUser = useStore(state => state.currentUser);

    const menuItems = [
        { icon: UtensilsCrossed, label: "Order", path: "/" },
        { icon: ChefHat, label: "Bếp", path: "/kitchen" },
        ...(['admin', 'sadmin'].includes(currentUser?.role) ? [
            { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
            { icon: Settings, label: "Cài Đặt", path: "/settings" }
        ] : []),
    ];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-50">
            <div className="flex items-center justify-around h-16">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex flex-col items-center justify-center w-full h-full relative",
                                isActive ? "text-emerald-600" : "text-slate-400"
                            )}
                        >
                            <div
                                className={cn(
                                    "flex items-center justify-center p-1.5 rounded-xl transition-all duration-300",
                                    isActive ? "bg-emerald-50 scale-110" : ""
                                )}
                            >
                                <item.icon
                                    className={cn("w-6 h-6", isActive ? "stroke-[2.5px]" : "stroke-2")}
                                />
                            </div>
                            <span
                                className={cn(
                                    "text-[10px] mt-1 font-medium transition-all duration-300",
                                    isActive ? "scale-100 opacity-100" : "scale-90 opacity-70"
                                )}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
