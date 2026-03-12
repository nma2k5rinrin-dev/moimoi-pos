import React, { useState } from 'react';
import { useStore, useStoreId } from '../../store/useStore';
import { Clock, CheckCircle2, ChefHat, Check, X, User, Store, Edit2, Plus, Minus } from 'lucide-react';
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
    const { orders, currentUser, updateOrderStatus, updateOrderItemStatus, updateOrderPaymentStatus, cancelOrder, showConfirm, showToast, sadminViewStoreId, setSadminViewStoreId, USERS } = useStore();
    const storeId = useStoreId();
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
        <div className="flex flex-col h-full bg-slate-100/50 p-3 md:p-5 overflow-hidden animate-fade-in">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-3">
                {/* Tabs Filter */}
                <div className="flex p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm w-full sm:w-auto scrollbar-hide">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={cn("px-3 py-1.5 text-sm font-semibold rounded-lg transition-all whitespace-nowrap", activeTab === 'all' ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-50")}
                    >
                        Tất cả
                    </button>
                    {STATUSES.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveTab(s.id)}
                            className={cn("px-3 py-1.5 text-sm font-semibold rounded-lg transition-all flex items-center gap-1.5 whitespace-nowrap", activeTab === s.id ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-slate-50")}
                        >
                            <s.icon className={cn("w-3.5 h-3.5", activeTab === s.id ? "" : s.id === 'pending' ? 'text-orange-500' : s.id === 'cooking' ? 'text-blue-500' : 'text-emerald-500')} />
                            {s.name}
                        </button>
                    ))}
                </div>

                {/* Sadmin Store Filter */}
                {currentUser?.role === 'sadmin' && (
                    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-emerald-200 shadow-sm w-full sm:w-auto">
                        <Store className="w-4 h-4 text-emerald-600 shrink-0" />
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

            {/* Order List */}
            <div className="flex-1 overflow-y-auto pb-20 md:pb-4 scroll-smooth">
                {filteredOrders.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4">
                        <ChefHat className="w-16 h-16 opacity-30" />
                        <p>Không có đơn hàng nào chờ xử lý.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-max">
                        {filteredOrders.map(order => {
                            const statusConfig = STATUSES.find(s => s.id === order.status) || STATUSES[0];
                            const timeDiffMs = order.time ? Date.now() - new Date(order.time).getTime() : 0;
                            const timeDiffMins = Math.floor(timeDiffMs / 60000);
                            const isLate = order.status === 'pending' && timeDiffMins > 15;

                            return (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    statusConfig={statusConfig}
                                    timeDiffMins={timeDiffMins}
                                    isLate={isLate}
                                    users={USERS}
                                    updateOrderItemStatus={updateOrderItemStatus}
                                    updateOrderStatus={updateOrderStatus}
                                    updateOrderPaymentStatus={updateOrderPaymentStatus}
                                    cancelOrder={cancelOrder}
                                    showConfirm={showConfirm}
                                    showToast={showToast}
                                />
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

function OrderCard({ order, statusConfig, timeDiffMins, isLate, users, updateOrderItemStatus, updateOrderStatus, updateOrderPaymentStatus, cancelOrder, showConfirm, showToast }) {
    const [expanded, setExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const updateOrderItems = useStore(state => state.updateOrderItems);
    const products = useStore(state => state.products[order.storeId || 'sadmin'] || []);

    // Lấy tên hiển thị từ username
    const staffUser = users?.find(u => u.username === order.createdBy);
    const staffName = staffUser?.fullname || staffUser?.username || order.createdBy || '—';

    const isUnpaid = order.paymentStatus !== 'paid';

    const cardContent = (
        <div className={cn(
            "flex flex-col shadow-sm transition-all",
            isUnpaid
                ? "order-unpaid-inner"
                : cn("bg-white rounded-2xl border", isLate ? "border-red-300 shadow-red-500/10" : "border-slate-200")
        )}>
            {/* Summary Row — luôn hiển thị, bấm để mở/đóng */}
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer select-none gap-2"
                onClick={() => setExpanded(e => !e)}
            >
                {/* Left: tên bàn + mã đơn + thời gian + nhân viên */}
                <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                    {/* Hàng 1: tên bàn + mã đơn */}
                    <div className="flex items-center gap-2">
                        <span className="text-base font-bold text-slate-800 leading-tight">{order.table}</span>
                        <span className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-medium shrink-0">#{order.id}</span>
                    </div>

                    {/* Hàng 2: thời gian order */}
                    <div className={cn("flex items-center gap-1.5 text-xs font-medium", isLate ? "text-red-500" : "text-slate-500")}>
                        <Clock className="w-3 h-3 shrink-0" />
                        {order.time && (() => {
                            const d = new Date(order.time);
                            const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
                            const timeStr = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                            return <span className="font-semibold">{dateStr} {timeStr}</span>;
                        })()}
                        <span className="text-slate-300">•</span>
                        <span className={isLate ? "text-red-400" : "text-slate-400"}>
                            {timeDiffMins > 0 ? `${timeDiffMins} phút` : "Vừa xong"}
                        </span>
                    </div>

                    {/* Hàng 3: nhân viên */}
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                        <User className="w-3 h-3 shrink-0" />
                        <span>NV: <span className="font-semibold text-slate-700">{staffName}</span></span>
                    </div>
                </div>

                {/* Right: badge trạng thái + thanh toán */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <div className={cn("px-2.5 py-1 rounded-lg border text-xs font-bold flex items-center gap-1.5", statusConfig.color)}>
                        <statusConfig.icon className={cn(
                            "w-3.5 h-3.5 shrink-0",
                            order.status === 'cooking' && "animate-cooking-icon",
                            order.status === 'pending' && "animate-pending-icon"
                        )} />
                        <span>{statusConfig.name}</span>
                    </div>
                    <div className={cn("px-2 py-0.5 flex items-center gap-1 rounded-md text-[10px] font-bold border uppercase tracking-wide",
                        order.paymentStatus === 'paid'
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                            : "bg-red-50 text-red-600 border-red-200"
                    )}>
                        {order.paymentStatus === 'paid' ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'}
                    </div>
                </div>
            </div>

            {/* Expanded Content */}
            {expanded && (
                <div className="px-4 pb-4 flex flex-col gap-3 border-t border-slate-100">
                    {/* Danh sách món */}
                    <div className="space-y-0.5 mt-3">
                        {order.items?.map((item, idx) => (
                            <div
                                key={idx}
                                onClick={() => updateOrderItemStatus(order.id, item.id, !item.isDone)}
                                className={cn(
                                    "flex items-start py-2 border-b border-slate-50 last:border-0 cursor-pointer transition-all hover:bg-slate-50/50 rounded-lg px-2 -mx-2",
                                    item.isDone ? "opacity-50 grayscale" : ""
                                )}
                            >
                                <div className="flex gap-3 items-start w-full">
                                    <div className={cn(
                                        "w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border shadow-sm transition-colors",
                                        item.isDone ? "bg-emerald-500 border-emerald-500 text-white" : "bg-white border-slate-200 text-transparent"
                                    )}>
                                        <Check className="w-3.5 h-3.5" />
                                    </div>
                                    <span className="bg-slate-100 text-slate-700 w-5 h-5 rounded flex items-center justify-center text-xs font-bold mt-0.5 shrink-0">
                                        {item.quantity}
                                    </span>
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <span className={cn("font-semibold text-slate-800 text-sm transition-all", item.isDone ? "line-through text-slate-500" : "")}>{item.name}</span>
                                        {item.note && (
                                            <span className="text-xs text-orange-500 bg-orange-50 px-2 py-0.5 rounded inline-block mt-1 w-max max-w-full truncate">
                                                Ghi chú: {item.note}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tổng tiền */}
                    <div className="flex justify-between items-center px-1 pt-1 border-t border-slate-100 mt-2">
                        <span className="text-sm font-semibold text-slate-500">Tổng thu:</span>
                        <div className="flex items-center gap-2">
                            {order.paymentStatus !== 'paid' && statusConfig.id !== 'completed' && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsEditing(true);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100"
                                    title="Sửa món trong đơn"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            )}
                            <span className="text-base font-bold text-emerald-600">{formatCurrency(order.totalAmount || 0)}</span>
                        </div>
                    </div>

                    {/* Nút thao tác */}
                    <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                            {statusConfig.btnAction ? (
                                <>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (order.paymentStatus === 'paid') return;
                                            showConfirm(
                                                `Huỷ đơn #${order.id} (${order.table})? Đơn sẽ bị xoá hoàn toàn và không tính vào doanh thu.`,
                                                () => {
                                                    cancelOrder(order.id);
                                                    showToast(`Đã huỷ đơn #${order.id}`, 'error');
                                                }
                                            );
                                        }}
                                        className="col-span-1 h-10 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors text-sm"
                                    >
                                        <X className="w-4 h-4" />
                                        Huỷ Đơn
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            updateOrderStatus(order.id, statusConfig.btnAction);
                                            if (statusConfig.btnAction === 'ready') showToast('Đã nấu xong');
                                        }}
                                        className={cn("col-span-1 h-10 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm text-sm", statusConfig.btnColor)}
                                    >
                                        <statusConfig.btnIcon className="w-4 h-4" />
                                        {statusConfig.btnAction === 'cooking' ? 'Nấu' : 'Hoàn tất'}
                                    </button>
                                </>
                            ) : (
                                <button
                                    disabled
                                    className="col-span-2 h-10 bg-emerald-50 text-emerald-600 font-bold rounded-xl flex items-center justify-center gap-2 opacity-70 cursor-not-allowed text-sm"
                                >
                                    <Check className="w-4 h-4" />
                                    Đã giao món
                                </button>
                            )}
                        </div>
                        {order.paymentStatus !== 'paid' && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    updateOrderPaymentStatus(order.id, 'paid');
                                    updateOrderStatus(order.id, 'completed');
                                    showToast("Đã thu tiền và Hoàn thành đơn!");
                                }}
                                className="w-full h-10 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-sm shadow-blue-500/20 text-sm"
                            >
                                Thu Tiền Ngay
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    if (isUnpaid) {
        return (
            <div className="order-unpaid-border shadow-sm relative">
                {cardContent}
                {isEditing && <EditOrderModal order={order} products={products} onClose={() => setIsEditing(false)} onSave={(newItems, newTotal) => { updateOrderItems(order.id, newItems, newTotal); setIsEditing(false); showToast('Đã cập nhật đơn hàng'); }} />}
            </div>
        );
    }
    return (
        <div className="relative">
            {cardContent}
            {isEditing && <EditOrderModal order={order} products={products} onClose={() => setIsEditing(false)} onSave={(newItems, newTotal) => { updateOrderItems(order.id, newItems, newTotal); setIsEditing(false); showToast('Đã cập nhật đơn hàng'); }} />}
        </div>
    );
}

function EditOrderModal({ order, products, onClose, onSave }) {
    const [items, setItems] = useState([...order.items]);

    const handleUpdateQuantity = (idx, delta) => {
        const newItems = [...items];
        const newQuantity = newItems[idx].quantity + delta;
        if (newQuantity <= 0) {
            newItems.splice(idx, 1);
        } else {
            newItems[idx].quantity = newQuantity;
        }
        setItems(newItems);
    };

    const handleAddProduct = (product) => {
        const existingIdx = items.findIndex(i => i.id === product.id && !i.note); 
        if (existingIdx >= 0) {
            handleUpdateQuantity(existingIdx, 1);
        } else {
            setItems([...items, { ...product, quantity: 1, note: '', isDone: false }]);
        }
    };

    const handleSave = () => {
        const newTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
        onSave(items, newTotal);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl flex flex-col max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                    <div>
                        <h3 className="font-bold text-slate-800 text-lg">Sửa Đơn #{order.id}</h3>
                        <p className="text-xs text-slate-500 mt-0.5">{order.table}</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-100 rounded-xl transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    <div className="space-y-3">
                        <h4 className="font-semibold text-sm text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg inline-block">Món trong đơn:</h4>
                        {items.length === 0 && (
                            <p className="text-sm text-slate-400 italic px-2">Đơn hàng hiện trống.</p>
                        )}
                        <div className="flex flex-col gap-2">
                        {items.map((item, idx) => (
                            <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-slate-200 rounded-xl gap-3">
                                <div className="flex flex-col min-w-0 flex-1">
                                    <span className="font-semibold text-sm text-slate-800">{item.name}</span>
                                    <span className="text-xs font-bold text-emerald-600">{formatCurrency(item.price)}</span>
                                    {item.note && <span className="text-[10px] text-orange-500 bg-orange-50 px-2 py-0.5 rounded w-max mt-1 truncate">Ghi chú: {item.note}</span>}
                                </div>
                                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-lg p-1 shrink-0 self-end sm:self-auto">
                                    <button onClick={() => handleUpdateQuantity(idx, -1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-md transition-all active:scale-95">
                                        <Minus className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm font-bold text-slate-800 w-5 text-center">{item.quantity}</span>
                                    <button onClick={() => handleUpdateQuantity(idx, 1)} className="w-8 h-8 flex items-center justify-center text-slate-500 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-all active:scale-95">
                                        <Plus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                        </div>
                    </div>

                    <div className="space-y-3 pt-4 border-t border-slate-100">
                        <h4 className="font-semibold text-sm text-slate-700 bg-slate-50 px-3 py-1.5 rounded-lg inline-block">Thêm món khác:</h4>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                            {products.filter(p => !p.isOutofStock).map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => handleAddProduct(p)}
                                    className="flex items-center gap-2 p-2 bg-white border border-slate-200 hover:border-emerald-500/50 hover:bg-emerald-50 hover:shadow-sm rounded-xl text-left transition-all active:scale-95 group"
                                >
                                    {p.image ? (
                                        <img src={p.image} className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0 border border-slate-100" />
                                    ) : (
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 shrink-0 flex items-center justify-center border border-slate-200 text-slate-300">
                                            <ChefHat className="w-5 h-5" />
                                        </div>
                                    )}
                                    <div className="flex flex-col min-w-0">
                                        <span className="text-xs font-semibold text-slate-700 truncate group-hover:text-emerald-700">{p.name || 'Trống'}</span>
                                        <span className="text-[10px] font-bold text-emerald-600">{formatCurrency(p.price)}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                        {products.filter(p => !p.isOutofStock).length === 0 && (
                            <p className="text-sm text-slate-400 italic px-2">Không có món ăn khả dụng.</p>
                        )}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex items-center justify-between shrink-0">
                    <div className="flex flex-col">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tổng tiền mới</span>
                        <span className="text-xl font-bold text-emerald-600">
                            {formatCurrency(items.reduce((acc, item) => acc + item.price * item.quantity, 0))}
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={onClose} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100 transition-colors active:scale-95 text-sm">
                            Hủy
                        </button>
                        <button onClick={handleSave} className="px-5 py-2.5 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 transition-all active:scale-95 flex items-center gap-2 text-sm">
                            <CheckCircle2 className="w-4 h-4" />
                            Xong
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
