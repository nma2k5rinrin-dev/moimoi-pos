import React from 'react';
import { useStore } from '../../../store/useStore';
import { formatCurrency } from '../../../utils/format';
import { Trash2, Minus, Plus, ShoppingBag, Edit3, X, CreditCard, Banknote, QrCode } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function Cart() {
    const cart = useStore(state => state.cart);
    const removeFromCart = useStore(state => state.removeFromCart);
    const updateQuantity = useStore(state => state.updateQuantity);
    const clearCart = useStore(state => state.clearCart);
    const getCartTotal = useStore(state => state.getCartTotal);
    const selectedTable = useStore(state => state.selectedTable);
    const setSelectedTable = useStore(state => state.setSelectedTable);
    const checkoutOrder = useStore(state => state.checkoutOrder);
    const showToast = useStore(state => state.showToast);
    const storeId = useStore(state => state.getStoreId());
    const tables = useStore(state => state.storeTables[storeId] || []);
    const addNote = useStore(state => state.addNote);
    const orders = useStore(state => state.orders);
    const storeInfo = useStore(state => state.storeInfos[storeId] || state.storeInfos['sadmin']);
    const currentUser = useStore(state => state.currentUser);
    const total = getCartTotal();

    const visibleOrders = React.useMemo(() => {
        let list = orders;
        if (currentUser?.role !== 'sadmin') {
            list = list.filter(o => o.storeId === storeId || !o.storeId);
        }
        if (currentUser?.role === 'staff') {
            const todayStr = new Date().toDateString();
            list = list.filter(o => o.time && new Date(o.time).toDateString() === todayStr);
        }
        return list;
    }, [orders, currentUser, storeId]);

    const [editingNoteId, setEditingNoteId] = React.useState(null);
    const [showCheckoutModal, setShowCheckoutModal] = React.useState(false);

    return (
        <div className="hidden lg:flex flex-col w-full h-full bg-white border-l border-slate-200">
            <div className="p-6 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/50">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <ShoppingBag className="w-6 h-6 text-emerald-500" />
                        Đơn Hàng
                        <span className="bg-emerald-100 text-emerald-700 text-sm py-0.5 px-2.5 rounded-full ml-1">
                            {cart.reduce((acc, item) => acc + item.quantity, 0)}
                        </span>
                    </h2>
                    {cart.length > 0 && (
                        <button
                            onClick={clearCart}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                            title="Xóa tất cả"
                        >
                            <Trash2 className="w-5 h-5" />
                        </button>
                    )}
                </div>

                {/* Table Selection */}
                <div className="flex gap-2 w-full overflow-x-auto pb-1 scrollbar-hide">
                    {tables.map(table => {
                        const countOrders = visibleOrders.filter(o => o.table === table && o.status !== 'completed').length;
                        return (
                            <button
                                key={table}
                                onClick={() => setSelectedTable(table)}
                                className={cn(
                                    "px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all outline-none flex items-center gap-2",
                                    selectedTable === table
                                        ? "bg-slate-800 text-white shadow-md shadow-slate-800/20"
                                        : "bg-white border border-slate-200 text-slate-600 hover:border-emerald-500 hover:text-emerald-600"
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

            {/* List Order đang xử lý View-only -> Removed at request */}

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cart.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 opacity-50">
                        <ShoppingBag className="w-16 h-16 stroke-1 border-2 border-dashed border-slate-300 rounded-full p-4" />
                        <p>Giỏ hàng đang trống</p>
                    </div>
                ) : (
                    cart.map(item => (
                        <div key={item.id} className="bg-white border text-sm md:text-base border-slate-100 p-3 rounded-2xl flex gap-3 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] animate-fade-in group">
                            <img src={item.image} alt={item.name} className="w-16 h-16 object-cover rounded-xl bg-slate-100" />
                            <div className="flex-1 flex flex-col">
                                <h4 className="font-semibold text-slate-800 line-clamp-1">{item.name}</h4>
                                <span className="text-emerald-500 font-medium">{formatCurrency(item.price)}</span>

                                {editingNoteId === item.id ? (
                                    <div className="mt-2 flex items-center gap-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={item.note || ''}
                                            onChange={(e) => addNote(item.id, e.target.value)}
                                            onBlur={() => setEditingNoteId(null)}
                                            onKeyDown={(e) => e.key === 'Enter' && setEditingNoteId(null)}
                                            placeholder="Ghi chú (Ví dụ: Ít đường)..."
                                            className="flex-1 text-xs border border-emerald-200 bg-emerald-50 rounded p-1.5 outline-none focus:border-emerald-400"
                                        />
                                    </div>
                                ) : (
                                    item.note && (
                                        <p className="text-xs text-orange-500 bg-orange-50 px-2 py-1 rounded inline-block mt-1 w-max">
                                            {item.note}
                                        </p>
                                    )
                                )}

                                <div className="mt-auto flex items-center justify-between pt-2">
                                    <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-100">
                                        <button
                                            onClick={() => updateQuantity(item.id, -1)}
                                            className="w-7 h-7 rounded-md hover:bg-white hover:shadow-sm text-slate-600 flex items-center justify-center transition-all"
                                        >
                                            <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="font-semibold text-slate-800 w-4 text-center">{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, 1)}
                                            className="w-7 h-7 rounded-md hover:bg-white hover:shadow-sm text-slate-600 flex items-center justify-center transition-all"
                                        >
                                            <Plus className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingNoteId(item.id)}
                                            className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Ghi chú"
                                        >
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Xóa"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white">
                <div className="flex items-center justify-between mb-6 pt-2">
                    <span className="text-lg font-bold text-slate-800">Tổng thanh toán</span>
                    <span className="text-2xl font-bold text-emerald-500">{formatCurrency(total)}</span>
                </div>

                <button
                    disabled={cart.length === 0}
                    onClick={() => setShowCheckoutModal(true)}
                    className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-2xl font-bold text-lg shadow-lg shadow-emerald-500/30 disabled:shadow-none transition-all active:scale-[0.98]"
                >
                    Thanh Toán Thôi
                </button>
            </div>

            {/* Checkout Modal */}
            {showCheckoutModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowCheckoutModal(false)}>
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-lg font-bold text-slate-800">Xác nhận thanh toán</h3>
                            <button onClick={() => setShowCheckoutModal(false)} className="p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <div className="p-6 flex flex-col items-center gap-6">

                            <div className="text-center space-y-1 w-full flex flex-col items-center">
                                <p className="text-slate-500 text-sm font-semibold">Số tiền cần thanh toán</p>
                                <p className="text-4xl font-black text-emerald-600 tracking-tight">{formatCurrency(total)}</p>

                                {storeInfo?.bankId && storeInfo?.bankAccount && (
                                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl mt-5 w-full flex flex-col items-center shadow-inner">
                                        <div className="flex items-center gap-2 mb-2">
                                            <QrCode className="w-5 h-5 text-blue-600" />
                                            <p className="text-sm font-bold text-blue-900">Mã VietQR động</p>
                                        </div>
                                        <div className="bg-white p-2 rounded-xl shadow-sm">
                                            <img
                                                src={`https://img.vietqr.io/image/${storeInfo.bankId}-${storeInfo.bankAccount}-compact2.png?amount=${total}&addInfo=Ban ${selectedTable}&accountName=${storeInfo.bankOwner}`}
                                                className="w-48 h-48 object-contain mix-blend-multiply"
                                                alt="VietQR code"
                                            />
                                        </div>
                                        <div className="text-center mt-3">
                                            <p className="text-[11px] text-blue-500 font-bold uppercase tracking-wider">{storeInfo.bankOwner}</p>
                                            <p className="text-xs text-blue-700 font-semibold mt-0.5">{storeInfo.bankId} • {storeInfo.bankAccount}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3 w-full mt-2">
                                <button
                                    onClick={() => {
                                        checkoutOrder('paid');
                                        setShowCheckoutModal(false);
                                        showToast("Đã chốt đơn và thu tiền thành công!");
                                    }}
                                    className="flex flex-col items-center justify-center gap-2 bg-emerald-50 hover:bg-emerald-500 hover:text-white border border-emerald-200 text-emerald-600 py-3 rounded-xl transition-all font-bold group shadow-sm hover:shadow-emerald-500/25"
                                >
                                    <Banknote className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    Tiền mặt / CK
                                </button>
                                <button
                                    onClick={() => {
                                        checkoutOrder('unpaid');
                                        setShowCheckoutModal(false);
                                        showToast("Đã lên món (Chưa tính tiền)");
                                    }}
                                    className="flex flex-col items-center justify-center gap-2 bg-orange-50 hover:bg-orange-500 hover:text-white border border-orange-200 text-orange-600 py-3 rounded-xl transition-all font-bold group shadow-sm hover:shadow-orange-500/25"
                                >
                                    <CreditCard className="w-6 h-6 group-hover:scale-110 transition-transform" />
                                    Thanh toán sau
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Active Order Detail Modal Deleted */}
        </div>
    );
}
