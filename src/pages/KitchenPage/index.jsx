import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Clock, CheckCircle2, ChefHat, Check, X, User, Store } from 'lucide-react';
import { formatCurrency } from '../../utils/format';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const STATUSES = [
    { id: 'pending', name: 'Đang Chờ', icon: Clock, color: 'bg-orange-50 text-orange-600 border-orange-200', btnAction: 'cooking', btnColor: 'bg-orange-500 hover:bg-orange-600', btnIcon: ChefHat },
    { id: 'cooking', name: 'Đang Nấu', icon: ChefHat, color: 'bg-blue-50 text-blue-600 border-blue-200', btnAction: 'completed', btnColor: 'bg-blue-500 hover:bg-blue-600', btnIcon: CheckCircle2 },
    { id: 'completed', name: 'Hoàn Tất', icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600 border-emerald-200', btnAction: null },
];

export default function KitchenPage() {
    const { orders, currentUser, updateOrderStatus, updateOrderItemStatus, updateOrderPaymentStatus, showToast, sadminViewStoreId, setSadminViewStoreId, USERS, getStoreId } = useStore();
    const storeId = getStoreId();
    const [activeTab, setActiveTab] = useState('all');

    const visibleOrders = React.useMemo(() => {
        let list = orders;
        if (currentUser?.role !== 'sadmin') {
            list = list.filter(o => o.storeId === storeId || (!o.storeId && storeId === 'sadmin'));
        } else if (currentUser?.role === 'sadmin' && sadminViewStoreId !== 'all') {
            list = list.filter(o => o.storeId === sadminViewStoreId || (!o.storeId && sadminViewStoreId === 'sadmin'));
        }
        if (currentUser?.role === 'staff') {
            const todayStr = new Date().toDateString();
            list = list.filter(o => o.time && new Date(o.time).toDateString() === todayStr);
        }
        return list;
    }, [orders, currentUser, storeId, sadminViewStoreId]);

    const filteredOrders = visibleOrders.filter(o => (activeTab === 'all' || o.status === activeTab));

    return (
        <div className="flex flex-col h-full bg-slate-100/50 p-4 md:p-6 lg:p-8 overflow-hidden animate-fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
                {/* Tabs Filter */}
                <div className="flex p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm w-full md:w-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={cn("px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap", activeTab === 'all' ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-50")}
                    >
                        Tất cả
                    </button>
                    {STATUSES.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveTab(s.id)}
                            className={cn("px-4 py-2 text-sm font-semibold rounded-lg transition-all flex items-center gap-2 whitespace-nowrap", activeTab === s.id ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-50")}
                        >
                            <s.icon className={cn("w-4 h-4", activeTab === s.id ? "" : s.id === 'pending' ? 'text-orange-500' : s.id === 'cooking' ? 'text-blue-500' : 'text-emerald-500')} />
                            {s.name}
                        </button>
                    ))}
                </div>

                {/* Sadmin Store Filter */}
                {currentUser?.role === 'sadmin' && (
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-200 shadow-sm w-full md:w-auto">
                        <Store className="w-5 h-5 text-emerald-600 shrink-0" />
                        <select
                            value={sadminViewStoreId}
                            onChange={(e) => setSadminViewStoreId(e.target.value)}
                            className="bg-transparent text-sm font-bold outline-none border-none text-emerald-800 cursor-pointer w-full"
                        >
                            <option value="all">Tất cả Cửa hàng</option>
                            <option value="sadmin">Hệ thống Gốc</option>
                            {USERS.filter(u => u.role === 'admin').map(admin => (
                                <option key={admin.username} value={admin.username}>
                                    {admin.fullname || admin.username}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Kanban Board / Grid */}
            <div className="flex-1 overflow-y-auto pr-2 pb-20 md:pb-0 scroll-smooth">
                {filteredOrders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                        <ChefHat className="w-16 h-16 opacity-30" />
                        <p>Không có đơn hàng nào chờ xử lý.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 auto-rows-max">
                        {filteredOrders.map(order => {
                            const statusConfig = STATUSES.find(s => s.id === order.status) || STATUSES[0];

                            const timeDiffMs = order.time ? Date.now() - new Date(order.time).getTime() : 0;
                            const timeDiffMins = Math.floor(timeDiffMs / 60000);
                            const isLate = order.status === 'pending' && timeDiffMins > 15; // Cảnh báo quá 15 phút chưa nấu

                            return (
                                <div key={order.id} className={cn("bg-white rounded-2xl border p-5 flex flex-col shadow-sm transition-all hover:shadow-md", isLate ? "border-red-300 shadow-red-500/10" : "border-slate-200")}>
                                    {/* Card Header */}
                                    <div className="flex items-start justify-between mb-4 border-b border-slate-100 pb-3">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-lg font-bold text-slate-800">{order.table}</span>
                                                <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium">#{order.id}</span>
                                            </div>
                                            <div className={cn("flex items-center gap-1.5 text-xs font-semibold", isLate ? "text-red-500" : "text-slate-500")}>
                                                <Clock className="w-3.5 h-3.5" />
                                                {timeDiffMins > 0 ? `${timeDiffMins} phút trước` : "Vừa xong"}
                                                <span className="mx-1 text-slate-300">•</span>
                                                <User className="w-3.5 h-3.5" />
                                                NV: <span className="text-slate-700 capitalize">{order.createdBy}</span>
                                            </div>
                                        </div>

                                        {/* Status Badge */}
                                        <div className="flex flex-col items-end gap-2">
                                            <div className={cn("px-3 py-1.5 rounded-lg border text-xs font-bold flex items-center gap-1.5", statusConfig.color)}>
                                                <statusConfig.icon className="w-4 h-4" />
                                                {statusConfig.name}
                                            </div>
                                            <div className={cn("px-2 py-1 flex items-center gap-1 rounded-md text-[11px] font-bold border uppercase tracking-wider shadow-sm", order.paymentStatus === 'paid' ? "bg-emerald-50 text-emerald-600 border-emerald-200 shadow-emerald-500/10" : "bg-orange-50 text-orange-600 border-orange-200 shadow-orange-500/10")}>
                                                {order.paymentStatus === 'paid' ? 'Đã Thanh Toán' : 'Chưa Thu Tiền'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items List */}
                                    <div className="space-y-1 mb-4 flex-1">
                                        {order.items?.map((item, idx) => (
                                            <div
                                                key={idx}
                                                onClick={() => updateOrderItemStatus(order.id, item.id, !item.isDone)}
                                                className={cn(
                                                    "flex justify-between items-start py-2 border-b border-slate-50 last:border-0 cursor-pointer transition-all hover:bg-slate-50/50 rounded-lg px-2 -mx-2",
                                                    item.isDone ? "opacity-50 grayscale" : ""
                                                )}
                                            >
                                                <div className="flex gap-3 items-start w-full">
                                                    <div className={cn(
                                                        "w-6 h-6 rounded flex items-center justify-center shrink-0 mt-0.5 border shadow-sm transition-colors",
                                                        item.isDone ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200 text-transparent"
                                                    )}>
                                                        <Check className="w-4 h-4" />
                                                    </div>
                                                    <span className="bg-slate-100 text-slate-700 w-6 h-6 rounded flex items-center justify-center text-sm font-bold mt-0.5 shrink-0">
                                                        {item.quantity}
                                                    </span>
                                                    <div className="flex flex-col flex-1">
                                                        <span className={cn("font-semibold text-slate-800 transition-all", item.isDone ? "line-through text-slate-500" : "")}>{item.name}</span>
                                                        {item.note && (
                                                            <span className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded inline-block mt-1 w-max">
                                                                Ghi chú: {item.note}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Order Total */}
                                    <div className="flex justify-between items-center mb-4 px-2 border-t border-slate-100 pt-3">
                                        <span className="text-sm font-semibold text-slate-500">Tổng thu:</span>
                                        <span className="text-lg font-bold text-emerald-600">{formatCurrency(order.totalAmount || 0)}</span>
                                    </div>

                                    {/* Actions */}
                                    <div className="mt-auto flex flex-col gap-3 pt-3 border-t border-slate-100">
                                        <div className="grid grid-cols-2 gap-3">
                                            {statusConfig.btnAction ? (
                                                <>
                                                    <button
                                                        className="col-span-1 h-11 bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Huỷ
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            updateOrderStatus(order.id, statusConfig.btnAction);
                                                            if (statusConfig.btnAction === 'ready') showToast('Đã nấu xong');
                                                        }}
                                                        className={cn("col-span-1 h-11 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm", statusConfig.btnColor)}
                                                    >
                                                        <statusConfig.btnIcon className="w-4 h-4" />
                                                        {statusConfig.btnAction === 'cooking' ? 'Nấu' : 'Hoàn tất'}
                                                    </button>
                                                </>
                                            ) : (
                                                <button
                                                    disabled
                                                    className="col-span-2 h-11 bg-emerald-50 text-emerald-600 font-bold rounded-xl flex items-center justify-center gap-2 opacity-70 cursor-not-allowed"
                                                >
                                                    <Check className="w-5 h-5" />
                                                    Đã giao món
                                                </button>
                                            )}
                                        </div>
                                        {order.paymentStatus !== 'paid' && (
                                            <button
                                                onClick={() => {
                                                    updateOrderPaymentStatus(order.id, 'paid');
                                                    updateOrderStatus(order.id, 'completed');
                                                    showToast("Đã thu tiền và Hoàn thành đơn!");
                                                }}
                                                className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-500/20"
                                            >
                                                Thu Tiền Ngay
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
