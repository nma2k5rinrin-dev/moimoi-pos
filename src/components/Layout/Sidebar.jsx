import React, { useState, useRef, useEffect } from 'react';
import {
    Home,
    UtensilsCrossed,
    ChefHat,
    BarChart3,
    Settings,
    LogOut,
    Camera,
    Zap,
    Store,
    Bell,
    CheckCircle,
    XCircle
} from "lucide-react";

import { Link, useLocation, useNavigate } from "react-router-dom";
import { useStore, useStoreId, EMPTY_OBJ } from "../../store/useStore";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { useKitchenBadges } from "../../hooks/useKitchenBadges";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const currentUser = useStore(state => state.currentUser);
    const storeId = useStoreId();
    const storeInfo = useStore(state => state.storeInfos[storeId] || state.storeInfos['sadmin'] || EMPTY_OBJ);
    const logout = useStore(state => state.logout);
    const showToast = useStore(state => state.showToast);
    const updateUserAvatar = useStore(state => state.updateUserAvatar);
    const setUpgradeModalOpen = useStore(state => state.setUpgradeModalOpen);
    const upgradeRequests = useStore(state => state.upgradeRequests);
    const approveUpgrade = useStore(state => state.approveUpgrade);
    const rejectUpgrade = useStore(state => state.rejectUpgrade);
    const { pendingKitchen, unpaidTables } = useKitchenBadges();

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotiOpen, setIsNotiOpen] = useState(false);
    const menuRef = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
                setIsNotiOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const menuItems = [
        { icon: UtensilsCrossed, label: "Order", path: "/" },
        { icon: ChefHat, label: "Bếp", path: "/kitchen", isKitchen: true },
        ...(['admin', 'sadmin'].includes(currentUser?.role) ? [
            { icon: BarChart3, label: "Báo Cáo", path: "/dashboard" },
            { icon: Settings, label: "Cài Đặt", path: "/settings" }
        ] : []),
    ];

    return (
        <aside className="hidden md:flex flex-col w-24 lg:w-64 h-screen bg-white border-r border-slate-200 fixed left-0 top-0 z-50">
            <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-100">
                {storeInfo.logoUrl ? (
                    <img src={storeInfo.logoUrl} alt="Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-emerald-500/10 shrink-0 bg-slate-50 relative" />
                ) : (
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/30 shrink-0">
                        <span className="font-bold text-white text-xs">POS</span>
                    </div>
                )}
                <span className="hidden lg:block ml-3 font-bold text-lg text-slate-800 tracking-tight truncate">
                    {storeInfo.name}
                </span>
            </div>

            <nav className="flex-1 py-6 px-3 flex flex-col gap-2">
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={cn(
                                "flex items-center justify-center lg:justify-start px-3 py-4 rounded-2xl transition-all duration-200 group relative",
                                isActive
                                    ? "bg-emerald-50 text-emerald-600 font-semibold"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                            )}
                        >
                            {isActive && (
                                <div className="absolute left-0 w-1 h-8 bg-emerald-500 rounded-r-full animate-slide-up" />
                            )}
                            {/* Icon wrapper - relative để đặt badge */}
                            <div className="relative shrink-0">
                                <item.icon
                                    className={cn(
                                        "w-6 h-6 transition-transform duration-200",
                                        isActive ? "scale-110" : "group-hover:scale-110"
                                    )}
                                />
                                {/* Badge bếp: đơn chờ (đỏ) */}
                                {item.isKitchen && pendingKitchen > 0 && (
                                    <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 bg-red-500 border-2 border-white rounded-full text-white text-[9px] font-bold flex items-center justify-center shadow-sm animate-bounce leading-none">
                                        {pendingKitchen > 99 ? '99+' : pendingKitchen}
                                    </span>
                                )}
                            </div>
                            {/* Label + badge cam (bàn chưa thanh toán) */}
                            <div className="hidden lg:flex items-center gap-2 ml-4 flex-1 min-w-0">
                                <span>{item.label}</span>
                                {item.isKitchen && unpaidTables > 0 && (
                                    <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 bg-orange-500 text-white text-[10px] font-bold rounded-full shadow-sm leading-none">
                                        {unpaidTables > 99 ? '99+' : unpaidTables}
                                    </span>
                                )}
                            </div>
                            {/* Ở icon-only mode (lg hidden), badge cam nhỏ bên phải label hidden -> hiện dưới icon */}
                            {item.isKitchen && unpaidTables > 0 && (
                                <span className="lg:hidden absolute -bottom-1.5 left-1/2 -translate-x-1/2 min-w-[16px] h-4 px-1 bg-orange-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-sm leading-none">
                                    {unpaidTables > 99 ? '99+' : unpaidTables}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* User Profile */}
            <div ref={menuRef} className="p-4 border-t border-slate-100 flex items-center justify-between relative">
                <div
                    onClick={() => { setIsDropdownOpen(!isDropdownOpen); setIsNotiOpen(false); }}
                    className="flex items-center gap-3 cursor-pointer p-2 hover:bg-slate-50 rounded-xl transition-colors flex-1 min-w-0 mr-2"
                >
                    {currentUser?.avatar ? (
                        <div className="relative shrink-0">
                            <img src={currentUser.avatar} alt="User" className="w-10 h-10 rounded-full object-cover shadow-sm bg-slate-50 border border-slate-200" />
                            {currentUser?.role === 'sadmin' && <span className="absolute -top-1.5 -right-1.5 text-sm leading-none select-none">👑</span>}
                            {currentUser?.isPremium && currentUser?.role !== 'sadmin' && <span className="absolute -top-1.5 -right-1.5 text-sm leading-none select-none">💎</span>}
                        </div>
                    ) : (
                        <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold shadow-sm shrink-0 border border-emerald-200 relative">
                            {currentUser?.username?.charAt(0).toUpperCase()}
                            {currentUser?.role === 'sadmin' && <span className="absolute -top-1.5 -right-1.5 text-sm leading-none select-none">👑</span>}
                            {currentUser?.isPremium && currentUser?.role !== 'sadmin' && <span className="absolute -top-1.5 -right-1.5 text-sm leading-none select-none">💎</span>}
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-800 truncate">{currentUser?.fullname || currentUser?.username}</p>
                        {currentUser?.isPremium ? (
                            <p className="text-xs text-amber-500 font-bold truncate">Premium 💎</p>
                        ) : (
                            <p className="text-xs text-slate-500 font-medium truncate">Gói Basic</p>
                        )}
                    </div>
                </div>

                {/* Chuông Thông Báo cho Sadmin */}
                {currentUser?.role === 'sadmin' && (
                    <div className="relative">
                        <button
                            onClick={e => { e.stopPropagation(); setIsNotiOpen(!isNotiOpen); setIsDropdownOpen(false); }}
                            className="p-2 text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-xl transition-colors relative active:scale-95"
                            title="Thông báo"
                        >
                            <Bell className="w-5 h-5" />
                            {upgradeRequests.length > 0 && (
                                <span className="absolute top-1.5 right-1 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full text-white text-[8px] font-bold flex items-center justify-center animate-bounce shadow-sm">
                                    {upgradeRequests.length}
                                </span>
                            )}
                        </button>

                        {/* Dropdown Notification */}
                        {isNotiOpen && (
                            <div className="absolute bottom-[calc(100%+8px)] left-0 w-80 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-4 animate-slide-up z-[60] origin-bottom-left flex flex-col max-h-[70vh]">
                                <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">Thông báo <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{upgradeRequests.length}</span></h3>
                                </div>
                                <div className="flex-1 overflow-y-auto space-y-3 pb-2 custom-scrollbar pr-1">
                                    {upgradeRequests.length === 0 ? (
                                        <div className="text-center py-8 text-slate-400">
                                            <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                            <p className="text-sm">Không có thông báo mới</p>
                                        </div>
                                    ) : (
                                        upgradeRequests.map(req => (
                                            <div key={req.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl">
                                                <div className="flex items-start gap-3 mb-2">
                                                    <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                                        <Zap className="w-4 h-4 fill-amber-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-slate-800 font-semibold truncate break-all">Cửa hàng <span className="text-emerald-600 underline">@{req.username}</span></p>
                                                        <p className="text-xs text-slate-500 mt-0.5">Yêu cầu gói VIP ({req.planName})</p>
                                                        <p className="text-[10px] text-slate-400 mt-1">{new Date(req.time).toLocaleString('vi-VN')}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 mt-3">
                                                    <button onClick={() => approveUpgrade(req.id)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex justify-center items-center gap-1 transition-colors shadow-sm focus:ring-4 focus:ring-emerald-500/20 active:scale-95">
                                                        <CheckCircle className="w-3 h-3" /> Duyệt
                                                    </button>
                                                    <button onClick={() => rejectUpgrade(req.id)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1.5 px-3 rounded-xl text-xs flex justify-center items-center gap-1 transition-colors focus:ring-4 focus:ring-slate-400/20 active:scale-95">
                                                        <XCircle className="w-3 h-3" /> Huỷ
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Dropdown Options (Avatar) */}
                {isDropdownOpen && (
                    <div className="absolute bottom-[calc(100%+8px)] left-4 w-60 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-2 animate-slide-up z-50 origin-bottom-left">
                        {/* User Info Header in Dropdown */}
                        <div className="p-3 border-b border-slate-100 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 relative">
                                {currentUser?.avatar ? (
                                    <img src={currentUser.avatar} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    <span className="font-bold text-sm uppercase">{currentUser?.username?.charAt(0) || 'U'}</span>
                                )}
                                {/* Badge biểu tượng */}
                                {currentUser?.role === 'sadmin' && (
                                    <span className="absolute -top-1.5 -right-1.5 text-base leading-none select-none" title="Super Admin">👑</span>
                                )}
                                {currentUser?.isPremium && currentUser?.role !== 'sadmin' && (
                                    <span className="absolute -top-1.5 -right-1.5 text-base leading-none select-none" title="Tài khoản VIP">💎</span>
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-slate-800 truncate">{currentUser?.fullname || currentUser?.username}</p>
                                {currentUser?.role === 'sadmin' ? (
                                    <p className="text-xs text-violet-500 font-bold truncate">Super Admin</p>
                                ) : currentUser?.isPremium ? (
                                    <p className="text-xs text-amber-500 font-bold truncate">⭐ Tài khoản VIP</p>
                                ) : (
                                    <p className="text-xs text-slate-500 font-medium truncate">Gói Miễn phí</p>
                                )}
                            </div>
                        </div>

                        {/* Upgrade Button Action */}
                        {currentUser?.role === 'admin' && !currentUser?.isPremium && (
                            <button
                                onClick={() => { setUpgradeModalOpen(true); setIsDropdownOpen(false); }}
                                className="w-full mt-2 mb-1 flex items-center justify-between gap-3 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100/50 text-amber-700 hover:shadow-md hover:-translate-y-0.5 transition-all group"
                            >
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform shadow-sm">
                                        <Zap className="w-4 h-4 fill-amber-500" />
                                    </div>
                                    <span className="text-sm font-bold">Nâng cấp tài khoản</span>
                                </div>
                            </button>
                        )}
                        {currentUser?.role === 'admin' && currentUser?.isPremium && (
                            <div className="w-full mt-2 mb-1 flex items-center justify-between gap-2 p-3 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 shadow-sm shadow-amber-500/10">
                                <div className="flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-sm">
                                        <Zap className="w-4 h-4 fill-current" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-wider leading-none mb-0.5">Hạn VIP</p>
                                        <p className="text-xs font-bold text-amber-700">{currentUser.expiresAt ? new Date(currentUser.expiresAt).toLocaleDateString('vi-VN') : 'Vĩnh viễn'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        {currentUser?.role === 'staff' && (
                            <div className="w-full mt-2 mb-1 flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                                <div className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-slate-500 border border-slate-200 shadow-sm">
                                    <Store className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-0.5">Trực thuộc</p>
                                    <p className="text-xs font-bold text-slate-700 truncate">{storeInfo?.name || 'Chi nhánh gốc'}</p>
                                </div>
                            </div>
                        )}

                        <div className="relative group overflow-hidden mt-1">
                            <input
                                type="file"
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                onChange={e => {
                                    const file = e.target.files[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            updateUserAvatar(reader.result);
                                            setIsDropdownOpen(false);
                                            showToast('Cập nhật Ảnh đại diện thành công');
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                            <button className="w-full flex items-center lg:justify-start justify-center gap-3 p-2.5 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors">
                                <Camera className="w-4 h-4 shrink-0" />
                                <span className="text-sm font-semibold">Đổi ảnh đại diện</span>
                            </button>
                        </div>
                        <div className="h-px bg-slate-100 my-1 mx-2" />
                        <button
                            onClick={() => {
                                logout();
                                showToast('Đã đăng xuất');
                                navigate('/login');
                            }}
                            className="w-full flex items-center lg:justify-start justify-center gap-3 p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                        >
                            <LogOut className="w-4 h-4 shrink-0" />
                            <span className="text-sm font-semibold">Đăng xuất</span>
                        </button>
                    </div>
                )}
            </div>
        </aside>
    );
}
