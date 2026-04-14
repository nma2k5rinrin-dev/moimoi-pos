import React, { useState } from 'react';
import { ShoppingBag, Plus, Minus, Trash2, X, Send, CheckCircle, MessageSquare, ChevronUp } from 'lucide-react';

export default function CustomerCart({ cart, tableName, storeName, onUpdateQuantity, onRemoveFromCart, onAddNote, onSubmitOrder, isSubmitting, lastOrderTotal = 0 }) {
    const [isOpen, setIsOpen] = useState(false);
    const [editingNoteId, setEditingNoteId] = useState(null);
    const [orderSuccess, setOrderSuccess] = useState(false);

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

    const handleSubmit = async () => {
        const success = await onSubmitOrder();
        if (success) {
            setOrderSuccess(true);
            setIsOpen(false);
        }
    };

    // Success Screen
    if (orderSuccess) {
        return (
            <div className="fixed inset-0 z-[100] bg-gradient-to-br from-emerald-50 via-white to-emerald-50 flex flex-col items-center justify-center animate-fade-in p-6">
                <div className="text-center max-w-sm">
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce-in">
                        <CheckCircle className="w-14 h-14 text-emerald-500" />
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-800 mb-2">Đặt Hàng Thành Công!</h2>
                    <p className="text-slate-500 mb-2 font-medium">
                        Đơn hàng của bạn tại <span className="font-bold text-emerald-600">{tableName}</span> đã được gửi đến bếp.
                    </p>
                    <p className="text-slate-400 text-sm mb-8">Vui lòng chờ nhân viên phục vụ.</p>

                    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm mb-6">
                        <p className="text-sm text-slate-500 font-medium">Tổng thanh toán</p>
                        <p className="text-3xl font-extrabold text-emerald-600 mt-1">{lastOrderTotal.toLocaleString()}đ</p>
                    </div>

                    <button
                        onClick={() => setOrderSuccess(false)}
                        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.97]"
                    >
                        Đặt Thêm Món
                    </button>
                </div>
            </div>
        );
    }

    if (totalItems === 0) return null;

    return (
        <>
            {/* Floating Bottom Bar */}
            <div className="fixed bottom-0 left-0 right-0 z-[90] p-3 pb-safe">
                <button
                    onClick={() => setIsOpen(true)}
                    className="w-full max-w-lg mx-auto flex items-center justify-between bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl py-3.5 px-5 shadow-xl shadow-emerald-500/30 transition-all active:scale-[0.98]"
                >
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <ShoppingBag className="w-5 h-5" />
                            <span className="absolute -top-2 -right-2 w-5 h-5 bg-white text-emerald-600 text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-sm">
                                {totalItems}
                            </span>
                        </div>
                        <span className="font-bold">Giỏ hàng</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="font-extrabold text-lg">{totalAmount.toLocaleString()}đ</span>
                        <ChevronUp className="w-4 h-4 opacity-70" />
                    </div>
                </button>
            </div>

            {/* Cart Sheet */}
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex flex-col">
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

                    {/* Sheet */}
                    <div className="relative mt-auto bg-white rounded-t-3xl max-h-[85vh] flex flex-col animate-slide-up shadow-2xl">
                        {/* Handle */}
                        <div className="flex justify-center pt-3 pb-1">
                            <div className="w-10 h-1 bg-slate-300 rounded-full" />
                        </div>

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                            <div>
                                <h3 className="font-extrabold text-lg text-slate-800">Giỏ Hàng</h3>
                                <p className="text-xs text-slate-500 font-medium">{tableName} • {totalItems} món</p>
                            </div>
                            <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Items */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
                            {cart.map(item => (
                                <div key={item.id} className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                                    <div className="flex items-start gap-3">
                                        {item.image ? (
                                            <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover shrink-0 bg-white" />
                                        ) : (
                                            <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center text-2xl shrink-0">🍽️</div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-bold text-slate-800 text-sm truncate">{item.name}</h4>
                                            <p className="text-emerald-600 font-extrabold text-sm mt-0.5">
                                                {(item.price * item.quantity).toLocaleString()}đ
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => onRemoveFromCart(item.id)}
                                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all shrink-0"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200/60">
                                        <button
                                            onClick={() => setEditingNoteId(editingNoteId === item.id ? null : item.id)}
                                            className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg transition-all ${
                                                item.note ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                                            }`}
                                        >
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            {item.note ? 'Đã ghi chú' : 'Ghi chú'}
                                        </button>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => item.quantity === 1 ? onRemoveFromCart(item.id) : onUpdateQuantity(item.id, -1)}
                                                className="w-8 h-8 bg-white border border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-500 rounded-lg flex items-center justify-center transition-all active:scale-90"
                                            >
                                                <Minus className="w-3.5 h-3.5" />
                                            </button>
                                            <span className="w-6 text-center font-bold text-slate-800 text-sm">{item.quantity}</span>
                                            <button
                                                onClick={() => onUpdateQuantity(item.id, 1)}
                                                className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg flex items-center justify-center shadow-sm transition-all active:scale-90"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {editingNoteId === item.id && (
                                        <div className="mt-2 animate-fade-in">
                                            <input
                                                type="text"
                                                value={item.note || ''}
                                                onChange={e => onAddNote(item.id, e.target.value)}
                                                placeholder="VD: Ít đá, nhiều đường..."
                                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                                                autoFocus
                                            />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="border-t border-slate-100 p-4 pb-safe bg-white">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-slate-500 font-medium">Tổng cộng</span>
                                <span className="text-xl font-extrabold text-slate-800">{totalAmount.toLocaleString()}đ</span>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/25 transition-all active:scale-[0.97] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <Send className="w-4 h-4" />
                                )}
                                {isSubmitting ? 'Đang gửi...' : 'Gửi Đơn Hàng'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
