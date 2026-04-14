import React, { useState, useMemo } from 'react';
import { Flame, Plus, Minus } from 'lucide-react';

export default function MenuGrid({ products, categories, cart, searchQuery, onAddToCart, onUpdateQuantity, onRemoveFromCart }) {
    const [selectedCategory, setSelectedCategory] = useState('all');

    const filteredProducts = useMemo(() => {
        let list = [...products];
        if (selectedCategory !== 'all') {
            list = list.filter(p => p.category === selectedCategory);
        }
        if (searchQuery && searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter(p => p.name.toLowerCase().includes(q));
        }
        return list;
    }, [products, selectedCategory, searchQuery]);

    const getCartQuantity = (productId) => {
        const item = cart.find(c => c.id === productId);
        return item ? item.quantity : 0;
    };

    return (
        <div className="flex flex-row flex-1 min-h-0 bg-slate-50">
            {/* Left Category Sidebar */}
            <div className="w-[85px] bg-white border-r border-slate-200/60 overflow-y-auto no-scrollbar pb-32 flex flex-col items-center">
                <button
                    onClick={() => setSelectedCategory('all')}
                    className={`w-full py-4 px-2 flex flex-col items-center justify-center gap-1 transition-all ${selectedCategory === 'all'
                        ? 'bg-emerald-50/50 text-emerald-600 font-bold border-l-4 border-emerald-500'
                        : 'text-slate-500 font-medium hover:bg-slate-50 border-l-4 border-transparent'
                        }`}
                >
                    <span className="text-[13px] text-center leading-tight">Tất cả</span>
                </button>
                {categories.map(c => (
                    <button
                        key={c.id}
                        onClick={() => setSelectedCategory(c.id)}
                        className={`w-full py-4 px-2 flex flex-col items-center justify-center gap-1 transition-all ${selectedCategory === c.id
                            ? 'bg-emerald-50/50 text-emerald-600 font-bold border-l-4 border-emerald-500'
                            : 'text-slate-500 font-medium hover:bg-slate-50 border-l-4 border-transparent'
                            }`}
                    >
                        <span className="text-[13px] text-center leading-tight">{c.name}</span>
                    </button>
                ))}
            </div>

            {/* Right Product Grid */}
            <div className="flex-1 overflow-y-auto p-3 pb-32">
                <div className="grid grid-cols-2 gap-3 max-w-full">
                    {filteredProducts.map(product => {
                        const qty = getCartQuantity(product.id);
                        return (
                            <div
                                key={product.id}
                                onClick={() => !product.isOutofStock && onAddToCart(product)}
                                className={`bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all group flex flex-col ${product.isOutofStock ? 'opacity-75' : 'cursor-pointer active:scale-[0.97]'}`}
                            >
                                {/* Product Image */}
                                <div className="relative aspect-square bg-slate-100 overflow-hidden shrink-0">
                                    {product.image ? (
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300">
                                            <span className="text-4xl">🍽️</span>
                                        </div>
                                    )}
                                    {product.isHot && !product.isOutofStock && (
                                        <div className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                                            <Flame className="w-3 h-3" /> HOT
                                        </div>
                                    )}
                                    {product.isOutofStock && (
                                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                            <span className="bg-red-500 text-white text-[11px] font-bold px-2 py-1 rounded-full shadow-lg">Hết hàng</span>
                                        </div>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="p-2.5 flex flex-col flex-1 justify-between gap-2">
                                    <h4 className="font-bold text-slate-800 text-[13px] leading-tight line-clamp-2">
                                        {product.name}
                                    </h4>
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className="text-emerald-600 font-extrabold text-[13px]">
                                            {product.price ? product.price.toLocaleString() : '0'}đ
                                        </span>

                                        {product.isOutofStock ? (
                                            <span className="text-[10px] font-bold text-red-400">&nbsp;</span>
                                        ) : qty === 0 ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                                                className="w-7 h-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-md shadow-emerald-500/30 transition-all active:scale-90"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); qty === 1 ? onRemoveFromCart(product.id) : onUpdateQuantity(product.id, -1); }}
                                                    className="w-6 h-6 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-full flex items-center justify-center transition-all active:scale-90 shrink-0"
                                                >
                                                    <Minus className="w-3 h-3" />
                                                </button>
                                                <span className="w-4 text-center font-bold text-slate-800 text-xs shrink-0">{qty}</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity(product.id, 1); }}
                                                    className="w-6 h-6 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-sm transition-all active:scale-90 shrink-0"
                                                >
                                                    <Plus className="w-3 h-3" />
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filteredProducts.length === 0 && (
                    <div className="text-center py-16 text-slate-400">
                        <span className="text-4xl block mb-3">🔍</span>
                        <p className="font-medium text-sm">Không tìm thấy món ăn nào</p>
                    </div>
                )}
            </div>

            {/* Floating Mascot Button */}
            <button
                onClick={() => setSelectedCategory('all')}
                className="fixed bottom-0 right-5 z-[80] w-[120px] h-[120px] transition-all hover:scale-105 active:scale-95 flex items-center justify-center drop-shadow-xl"
                title="Xem tất cả món"
            >
                <img src="/book.gif" alt="Xem tất cả" className="w-full h-full object-contain" />
            </button>
        </div>
    );
}
