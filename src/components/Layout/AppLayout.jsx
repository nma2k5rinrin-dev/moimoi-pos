import React, { useState, useRef, useEffect } from 'react';
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Outlet, useNavigate } from "react-router-dom";
import { useStore } from "../../store/useStore";
import { LogOut, Camera, Zap, Bell, CheckCircle, XCircle, Store } from "lucide-react";
import { UpgradeModal } from "../UpgradeModal";
import { ConfirmModal } from "../ConfirmModal";

export function AppLayout() {
    const toast = useStore(state => state.toast);
    const currentUser = useStore(state => state.currentUser);
    const storeId = currentUser ? (currentUser.role === 'staff' ? currentUser.createdBy : currentUser.username) : 'sadmin';
    const storeInfo = useStore(state => state.storeInfos[storeId] || state.storeInfos['sadmin'] || {});
    const logout = useStore(state => state.logout);
    const updateUserAvatar = useStore(state => state.updateUserAvatar);
    const showToast = useStore(state => state.showToast);
    const setUpgradeModalOpen = useStore(state => state.setUpgradeModalOpen);
    const upgradeRequests = useStore(state => state.upgradeRequests);
    const approveUpgrade = useStore(state => state.approveUpgrade);
    const rejectUpgrade = useStore(state => state.rejectUpgrade);
    const clearVipCongrat = useStore(state => state.clearVipCongrat);

    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [isNotiOpen, setIsNotiOpen] = useState(false);
    const headerMenuRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        function handleClickOutside(event) {
            if (headerMenuRef.current && !headerMenuRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
                setIsNotiOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
            {/* VIP Congratulation Modal */}
            {currentUser?.showVipCongrat && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[110] px-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center relative animate-slide-up overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
                        <div className="w-20 h-20 bg-gradient-to-tr from-amber-400 to-orange-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner shadow-amber-500/20 relative">
                            <Zap className="w-10 h-10 text-white hook-animation" />
                        </div>
                        <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Xin chúc mừng!</h2>
                        <h3 className="text-lg font-bold text-amber-600 mb-4">{currentUser.fullname || currentUser.username}</h3>
                        <p className="text-slate-600 mb-8 font-medium leading-relaxed">
                            Tài khoản của bạn đã được đối tác xác nhận lên hạng VIP. Kể từ lúc này bạn có thể sử dụng các tính năng cao cấp không giới hạn thiết bị.
                        </p>
                        <button
                            onClick={() => clearVipCongrat(currentUser.username)}
                            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/40 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2"
                        >
                            <span>Bắt đầu Trải nghiệm</span>
                        </button>
                    </div>
                </div>
            )}

            <Sidebar />
            <main className="flex-1 w-full md:ml-24 lg:ml-64 h-full relative flex flex-col transition-all duration-300">
                {/* Top Header Mobile Info */}
                <header className="md:hidden h-14 bg-white border-b border-slate-200 flex items-center px-4 justify-between sticky top-0 z-40">
                    <div className="flex items-center gap-2">
                        {storeInfo.logoUrl ? (
                            <img src={storeInfo.logoUrl} alt="Logo" className="w-8 h-8 md:w-10 md:h-10 rounded-lg object-cover bg-slate-50 relative shrink-0" />
                        ) : (
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-500 rounded-lg flex items-center justify-center shrink-0">
                                <span className="font-bold text-white text-xs whitespace-nowrap">POS</span>
                            </div>
                        )}
                        <p className="font-semibold text-slate-800 tracking-tight text-sm truncate max-w-[150px]">{storeInfo.name}</p>
                    </div>
                    <div ref={headerMenuRef} className="flex items-center gap-3 relative">
                        {/* Biểu tượng Chuông Thông Báo (Chỉ dành cho Sadmin) */}
                        {currentUser?.role === 'sadmin' && (
                            <div className="relative">
                                <button
                                    onClick={() => { setIsNotiOpen(!isNotiOpen); setIsDropdownOpen(false); }}
                                    className="w-10 h-10 rounded-full flex items-center justify-center text-slate-500 hover:bg-slate-100 hover:text-emerald-600 transition-colors relative"
                                    title="Thông báo hệ thống"
                                >
                                    <Bell className="w-5 h-5" />
                                    {upgradeRequests.length > 0 && (
                                        <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 rounded-full border-2 border-white text-[9px] font-bold text-white flex justify-center items-center shadow-sm z-10 animate-bounce">
                                            {upgradeRequests.length}
                                        </span>
                                    )}
                                </button>

                                {/* Dropdown Nhận thông báo Mua VIP */}
                                {isNotiOpen && (
                                    <div className="absolute top-[calc(100%+8px)] right-0 w-80 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 p-4 animate-slide-up z-50 origin-top-right overflow-hidden flex flex-col max-h-[85vh]">
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
                                                                <p className="text-xs text-slate-500 mt-0.5">Yêu cầu mua gói VIP ({req.planName})</p>
                                                                <p className="text-[10px] text-slate-400 mt-1">{new Date(req.time).toLocaleString('vi-VN')}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex gap-2 mt-3">
                                                            <button onClick={() => approveUpgrade(req.id)} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-1.5 px-3 rounded-xl text-xs flex justify-center items-center gap-1 transition-colors shadow-sm focus:ring-4 focus:ring-emerald-500/20 active:scale-95">
                                                                <CheckCircle className="w-3.5 h-3.5" /> Phê Duyệt
                                                            </button>
                                                            <button onClick={() => rejectUpgrade(req.id)} className="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-1.5 px-3 rounded-xl text-xs flex justify-center items-center gap-1 transition-colors focus:ring-4 focus:ring-slate-400/20 active:scale-95">
                                                                <XCircle className="w-3.5 h-3.5" /> Bỏ Qua
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

                        <button onClick={() => { setIsDropdownOpen(!isDropdownOpen); setIsNotiOpen(false); }} className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center active:scale-95 transition-transform border border-emerald-200 shadow-sm" title="Tuỳ chọn tài khoản">
                            {currentUser?.avatar ? (
                                <img src={currentUser.avatar} className="w-full h-full rounded-full object-cover shrink-0 box-border bg-white" />
                            ) : (
                                <span className="font-bold text-sm uppercase">{currentUser?.username?.charAt(0) || 'U'}</span>
                            )}
                        </button>

                        {isDropdownOpen && (
                            <div className="absolute top-[calc(100%+8px)] right-0 w-56 bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-2 animate-slide-up z-50 origin-top-right">
                                <div className="p-3 mb-1 border-b border-slate-100 flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                                        {currentUser?.avatar ? (
                                            <img src={currentUser.avatar} className="w-full h-full rounded-full object-cover" />
                                        ) : (
                                            <span className="font-bold text-sm uppercase">{currentUser?.username?.charAt(0) || 'U'}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-slate-800 truncate text-sm">{currentUser?.fullname || currentUser?.username}</p>
                                        {currentUser?.isPremium ? (
                                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider truncate mt-0.5 break-all">Tài khoản VIP 💎</p>
                                        ) : (
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider truncate mt-0.5">Basic (Gói Cơ Bản)</p>
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
                                                    showToast('Cập nhật Ảnh thành công');
                                                };
                                                reader.readAsDataURL(file);
                                            }
                                        }}
                                    />
                                    <button className="w-full flex items-center justify-start gap-3 p-2 flex-1 rounded-xl text-slate-600 hover:bg-slate-50 hover:text-emerald-600 transition-colors">
                                        <Camera className="w-4 h-4 shrink-0" />
                                        <span className="text-sm font-semibold">Đổi ảnh đại diện</span>
                                    </button>
                                </div>
                                <div className="h-px bg-slate-100 my-1 mx-2" />
                                <button
                                    onClick={() => {
                                        setIsDropdownOpen(false);
                                        logout();
                                        showToast('Đã đăng xuất');
                                        navigate('/login');
                                    }}
                                    className="w-full flex items-center justify-start gap-3 p-2 flex-1 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut className="w-4 h-4 shrink-0" />
                                    <span className="text-sm font-semibold">Đăng xuất</span>
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                {/* Cấu hình pb-20 để không bị che bởi Bottom Nav ở Mobile, trong đó ở Desktop pb-0 */}
                <div className="flex-1 overflow-auto bg-slate-50/50 pb-20 md:pb-0 scroll-smooth">
                    <Outlet />
                </div>
            </main>
            <BottomNav />

            {/* Global Toast Notification */}
            {toast && (
                <div className="fixed top-4 right-4 z-[100] animate-slide-up bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-xl shadow-slate-900/20 font-semibold text-sm flex items-center gap-3">
                    {toast.type === 'success' ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        </div>
                    ) : null}
                    {toast.message}
                </div>
            )}

            <UpgradeModal />
            <ConfirmModal />
        </div>
    );
}
