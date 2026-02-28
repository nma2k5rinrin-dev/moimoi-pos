import React, { useState } from 'react';
import { useStore } from '../../../store/useStore';
import { formatCurrency } from '../../../utils/format';
import { ShoppingBag, X, Plus, Minus, Trash2, Edit3, CreditCard, Banknote, QrCode } from 'lucide-react';
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function MobileCart() {
    const [isOpen, setIsOpen] = useState(false);
    const cart = useStore(state => state.cart);
    const removeFromCart = useStore(state => state.removeFromCart);
    const updateQuantity = useStore(state => state.updateQuantity);
    const clearCart = useStore(state => state.clearCart);
    const getCartTotal = useStore(state => state.getCartTotal);
    const selectedTable = useStore(state => state.selectedTable);
    const setSelectedTable = useStore(state => state.setSelectedTable);
    const checkoutOrder = useStore(state => state.checkoutOrder);
    const showToast = useStore(state => state.showToast);
    const currentUser = useStore(state => state.currentUser);
    const getStoreId = useStore(state => state.getStoreId);
    const sadminViewStoreId = useStore(state => state.sadminViewStoreId);
    const storeId = getStoreId();

    const tables = useStore(state => state.storeTables[storeId] || []);
    const addNote = useStore(state => state.addNote);
    const orders = useStore(state => state.orders);
    const storeInfo = useStore(state => state.storeInfos[storeId] || state.storeInfos['sadmin'] || {});

    const [editingNoteId, setEditingNoteId] = useState(null);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);

    const totalQuantity = cart.reduce((acc, item) => acc + item.quantity, 0);
    const totalAmount = getCartTotal();

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

    // Nút Float chỉ hiện khi có món trong giỏ và drawer đang đóng
    if (cart.length === 0) return null;

    return (
        <>
            {/* Floating Action Bar */}
            <div
                className={cn(
                    "md:hidden fixed bottom-20 left-4 right-4 bg-emerald-800 text-white rounded-2xl shadow-xl shadow-emerald-500/20 p-4 flex items-center justify-between cursor-pointer transition-transform duration-300 z-40",
                    isOpen ? "translate-y-32 opacity-0 pointer-events-none" : "translate-y-0 opacity-100"
                )}
                onClick={() => setIsOpen(true)}
            >
                <div className="flex items-center gap-3">
                    <div className="bg-emerald-700 w-10 h-10 rounded-full flex items-center justify-center relative shadow-inner">
                        <ShoppingBag className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 bg-red-500 w-5 h-5 text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-emerald-800">
                            {totalQuantity}
                        </span>
                    </div>
                    <span className="font-semibold px-2 py-0.5 rounded shadow-sm">Xem giỏ hàng</span>
                </div>
                <span className="text-lg font-bold">{formatCurrency(totalAmount)}</span>
            </div>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 animate-fade-in"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Bottom Sheet Cart */}
            <div
                className={cn(
                    "lg:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-[0_-10px_40px_-5px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-out z-50 flex flex-col max-h-[85vh]",
                    isOpen ? "translate-y-0" : "translate-y-full"
                )}
            >
                <div className="flex flex-col border-b border-slate-100">
                    <div className="flex items-center justify-between px-6 py-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <ShoppingBag className="w-5 h-5 text-emerald-500" />
                            Giỏ hàng ({totalQuantity})
                        </h3>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Table Selection Mobile */}
                    <div className="flex gap-2 w-full overflow-x-auto px-6 pb-4 scrollbar-hide">
                        {tables.map(table => {
                            const countOrders = visibleOrders.filter(o => o.table === table && o.status !== 'completed').length;
                            return (
                                <button
                                    key={table}
                                    onClick={() => setSelectedTable(table)}
                                    className={cn(
                                        "px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap outline-none transition-all flex items-center gap-2",
                                        selectedTable === table
                                            ? "bg-slate-800 text-white shadow-md shadow-slate-800/20"
                                            : "bg-slate-100 text-slate-600 border border-transparent"
                                    )}
                                >
                                    {table}
                                    {countOrders > 0 && (
                                        <span className="bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold shadow-sm">
                                            {countOrders}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Danh sách Order cũ (View-only -> Removed at request) */}

                {/* Danh sách món ăn scrollable */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {cart.map(item => (
                        <div key={item.id} className="bg-white border text-sm border-slate-100 p-3 rounded-2xl flex gap-3 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] relative pr-10">
                            <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl bg-slate-50" />
                            <div className="flex-1 flex flex-col">
                                <h4 className="font-semibold text-slate-800 line-clamp-1">{item.name}</h4>
                                <span className="text-emerald-500 font-medium mb-1">{formatCurrency(item.price)}</span>

                                {editingNoteId === item.id ? (
                                    <div className="mt-1 mb-2 flex items-center gap-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={item.note || ''}
                                            onChange={(e) => addNote(item.id, e.target.value)}
                                            onBlur={() => setEditingNoteId(null)}
                                            onKeyDown={(e) => e.key === 'Enter' && setEditingNoteId(null)}
                                            placeholder="Ghi chú (Ví dụ: Ít đường)..."
                                            className="flex-1 w-full text-xs border border-emerald-200 bg-emerald-50 rounded p-1.5 outline-none focus:border-emerald-400"
                                        />
                                    </div>
                                ) : (
                                    item.note && (
                                        <p className="text-[11px] text-orange-500 bg-orange-50 px-2 py-0.5 rounded inline-block mb-1 w-max line-clamp-2">
                                            Lưu ý: {item.note}
                                        </p>
                                    )
                                )}

                                <div className="mt-auto flex items-center gap-3 w-max">
                                    <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-100">
                                        <button
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className="w-7 h-7 rounded-md bg-white shadow-sm text-slate-600 flex items-center justify-center active:scale-95"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="font-semibold text-slate-800 w-4 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="w-7 h-7 rounded-md bg-white shadow-sm text-slate-600 flex items-center justify-center active:scale-95"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="absolute right-3 top-3 flex gap-2">
                                    <button
                                        onClick={() => setEditingNoteId(item.id)}
                                        className="p-2 text-slate-400 hover:text-blue-500 bg-slate-50 rounded-xl"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => removeFromCart(item.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 bg-red-50/50 rounded-xl"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Footer Checkout */}
                <div className="p-6 pb-24 border-t border-slate-100 bg-slate-50 mt-auto">
                    <div className="flex items-center justify-between mb-4">
                        <span className="text-slate-500 font-medium">Tổng thanh toán</span>
                        <span className="text-xl font-bold text-emerald-600">{formatCurrency(totalAmount)}</span>
                    </div>
                    <button
                        onClick={() => setShowCheckoutModal(true)}
                        className="w-full h-14 bg-emerald-500 active:bg-emerald-600 text-white rounded-full font-bold text-lg shadow-lg shadow-emerald-500/25 active:scale-[0.98] transition-all"
                    >
                        Thanh Toán Thôi
                    </button>
                </div>

                {/* Checkout Modal (Mobile) */}
                {showCheckoutModal && (
                    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex flex-col justify-end animate-fade-in" onClick={() => setShowCheckoutModal(false)}>
                        <div className="bg-white rounded-t-3xl w-full overflow-hidden shadow-2xl animate-slide-up" onClick={e => e.stopPropagation()}>
                            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                                <h3 className="text-lg font-bold text-slate-800 ml-2">Xác nhận thanh toán</h3>
                                <button onClick={() => setShowCheckoutModal(false)} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-xl transition-colors bg-white shadow-sm border border-slate-100"><X className="w-5 h-5" /></button>
                            </div>
                            <div className="p-6 flex flex-col items-center gap-6 max-h-[80vh] overflow-y-auto pb-28 border-t-4 border-emerald-500/20">

                                <div className="text-center space-y-1 w-full flex flex-col items-center">
                                    <p className="text-slate-500 text-sm font-semibold">Cần thanh toán</p>
                                    <p className="text-4xl font-black text-emerald-600 tracking-tight">{formatCurrency(totalAmount)}</p>

                                    {storeInfo?.bankId && storeInfo?.bankAccount && (
                                        <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl mt-5 w-full flex flex-col items-center shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-blue-300 via-blue-500 to-blue-300"></div>
                                            <div className="flex items-center gap-2 mb-3 bg-white px-4 py-1.5 rounded-full border border-blue-100 shadow-sm mt-1 text-blue-700">
                                                <QrCode className="w-4 h-4" />
                                                <p className="text-xs font-bold uppercase tracking-wider">Mã VietQR động</p>
                                            </div>
                                            <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-blue-100/50">
                                                <img
                                                    src={`https://img.vietqr.io/image/${storeInfo.bankId}-${storeInfo.bankAccount}-compact2.png?amount=${totalAmount}&addInfo=Ban ${selectedTable}&accountName=${storeInfo.bankOwner}`}
                                                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain mix-blend-multiply"
                                                    alt="VietQR code"
                                                />
                                            </div>
                                            <div className="text-center mt-4">
                                                <p className="text-[11px] text-blue-500 font-bold uppercase tracking-widest">{storeInfo.bankOwner}</p>
                                                <p className="text-[13px] text-blue-800 font-extrabold mt-1.5 bg-white px-3 py-1.5 rounded-lg shadow-sm border border-blue-100 inline-block tracking-widest">{storeInfo.bankId} • {storeInfo.bankAccount}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3 w-full mt-2">
                                    <button
                                        onClick={() => {
                                            checkoutOrder('paid');
                                            setShowCheckoutModal(false);
                                            setIsOpen(false);
                                            showToast("Đã chốt đơn và thu tiền thành công!");
                                        }}
                                        className="w-full flex items-center justify-center gap-3 bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/30 transition-all text-base"
                                    >
                                        <Banknote className="w-6 h-6" />
                                        Đã nhận Tiền mặt / CK
                                    </button>
                                    <button
                                        onClick={() => {
                                            checkoutOrder('unpaid');
                                            setShowCheckoutModal(false);
                                            setIsOpen(false);
                                            showToast("Đã lên món (Cho khách nợ / Thanh toán sau)");
                                        }}
                                        className="w-full flex items-center justify-center gap-3 bg-orange-50 active:bg-orange-100 border-2 border-orange-200 text-orange-600 py-3.5 rounded-xl font-bold transition-all text-base shadow-sm"
                                    >
                                        <CreditCard className="w-6 h-6" />
                                        Ghi sổ / Thanh toán sau
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Active Order Detail Modal (Mobile) Deleted */}
            </div>
        </>
    );
}
