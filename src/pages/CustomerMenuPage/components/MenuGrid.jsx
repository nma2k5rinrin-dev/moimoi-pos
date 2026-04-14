import React, { useState, useMemo } from 'react';
import { Search, Flame, Plus, Minus, X } from 'lucide-react';

export default function MenuGrid({ products, categories, cart, onAddToCart, onUpdateQuantity, onRemoveFromCart }) {
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    const filteredProducts = useMemo(() => {
        let list = [...products];
        if (selectedCategory !== 'all') {
            list = list.filter(p => p.category === selectedCategory);
        }
        if (searchQuery.trim()) {
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
        <div className="flex flex-col flex-1 min-h-0">
            {/* Search Bar */}
            <div className="px-4 pt-3 pb-2">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="Tìm món ăn..."
                        className="w-full h-10 pl-9 pr-9 bg-slate-100 border-0 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-emerald-500/30 focus:bg-white transition-all"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Category Tabs */}
            <div className="px-4 pb-2">
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    <button
                        onClick={() => setSelectedCategory('all')}
                        className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                            selectedCategory === 'all'
                                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                    >
                        Tất cả
                    </button>
                    {categories.map(c => (
                        <button
                            key={c.id}
                            onClick={() => setSelectedCategory(c.id)}
                            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                                selectedCategory === c.id
                                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/25'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            {c.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <div className="flex-1 overflow-y-auto px-4 pb-32">
                <div className="grid grid-cols-2 gap-3">
                    {filteredProducts.map(product => {
                        const qty = getCartQuantity(product.id);
                        return (
                            <div
                                key={product.id}
                                onClick={() => !product.isOutofStock && onAddToCart(product)}
                                className={`bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-md transition-all group ${product.isOutofStock ? 'opacity-75' : 'cursor-pointer active:scale-[0.97]'}`}
                            >
                                {/* Product Image */}
                                <div className="relative aspect-square bg-slate-100 overflow-hidden">
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
                                            <span className="bg-red-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">Hết hàng</span>
                                        </div>
                                    )}
                                </div>

                                {/* Product Info */}
                                <div className="p-3">
                                    <h4 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2 min-h-[2.5rem]">
                                        {product.name}
                                    </h4>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-emerald-600 font-extrabold text-sm">
                                            {product.price ? product.price.toLocaleString() : '0'}đ
                                        </span>

                                        {product.isOutofStock ? (
                                            <span className="text-[11px] font-bold text-red-400">Hết hàng</span>
                                        ) : qty === 0 ? (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onAddToCart(product); }}
                                                className="w-8 h-8 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-md shadow-emerald-500/30 transition-all active:scale-90"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-1.5">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); qty === 1 ? onRemoveFromCart(product.id) : onUpdateQuantity(product.id, -1); }}
                                                    className="w-7 h-7 bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-600 rounded-full flex items-center justify-center transition-all active:scale-90"
                                                >
                                                    <Minus className="w-3.5 h-3.5" />
                                                </button>
                                                <span className="w-5 text-center font-bold text-slate-800 text-sm">{qty}</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity(product.id, 1); }}
                                                    className="w-7 h-7 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-sm transition-all active:scale-90"
                                                >
                                                    <Plus className="w-3.5 h-3.5" />
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
                        <span className="text-5xl block mb-3">🔍</span>
                        <p className="font-medium">Không tìm thấy món ăn nào</p>
                    </div>
                )}
            </div>
        </div>
    );
}
