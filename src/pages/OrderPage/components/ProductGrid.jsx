import React from 'react';
import { useStore } from '../../../store/useStore';
import { formatCurrency } from '../../../utils/format';
import { Plus, Minus, Store } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export function ProductGrid() {
    const selectedCategory = useStore(state => state.selectedCategory);
    const searchQuery = useStore(state => state.searchQuery);
    const setCategory = useStore(state => state.setCategory);
    const setSearchQuery = useStore(state => state.setSearchQuery);
    const addToCart = useStore(state => state.addToCart);
    const cart = useStore(state => state.cart);
    const updateQuantity = useStore(state => state.updateQuantity);
    const products = useStore(state => state.products);
    const categories = useStore(state => state.categories);
    const bestSellers = useStore(state => state.bestSellers);
    const USERS = useStore(state => state.USERS);
    const currentUser = useStore(state => state.currentUser);
    const sadminViewStoreId = useStore(state => state.sadminViewStoreId);
    const setSadminViewStoreId = useStore(state => state.setSadminViewStoreId);

    const filteredProducts = products.filter(product => {
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    return (
        <div className="flex flex-col h-full col-span-12 lg:col-span-8 xl:col-span-9 p-4 lg:p-6 overflow-hidden">
            {/* Header Search & Filter */}
            <div className="mb-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="w-full md:w-auto flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        placeholder="Tìm kiếm món ăn..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full sm:w-80 h-12 px-5 rounded-2xl bg-white border border-slate-200 outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-sm"
                    />

                    {currentUser?.role === 'sadmin' && (
                        <div className="flex items-center gap-2 bg-white px-3 h-12 rounded-2xl border border-emerald-200 shadow-sm shrink-0 w-full sm:w-auto">
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

                <div className="flex w-full md:w-auto overflow-x-auto gap-2 pb-2 md:pb-0 scrollbar-hide shrink-0">
                    {categories.map(category => (
                        <button
                            key={category.id}
                            onClick={() => setCategory(category.id)}
                            className={cn(
                                "px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all duration-200",
                                selectedCategory === category.id
                                    ? "bg-slate-800 text-white shadow-lg shadow-slate-800/20 scale-105"
                                    : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                            )}
                        >
                            {category.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid View */}
            <div className="flex-1 overflow-y-auto pr-2 pb-20 md:pb-0">
                {filteredProducts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <p className="text-lg font-medium">Không tìm thấy món ăn phù hợp.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6">
                        {filteredProducts.map((product, idx) => {
                            const cartItem = cart.find(i => i.id === product.id);

                            return (
                                <div
                                    key={product.id}
                                    style={{ animationDelay: `${idx * 50}ms` }}
                                    className="bg-white rounded-xl md:rounded-2xl p-2 md:p-3 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-slide-up group flex flex-col cursor-pointer"
                                    onClick={() => !product.isOutofStock && addToCart(product)}
                                >
                                    <div className="relative aspect-square mb-2 md:mb-3 rounded-lg md:rounded-xl overflow-hidden bg-slate-100">
                                        <img
                                            src={product.image}
                                            alt={product.name}
                                            className={cn("w-full h-full object-cover transition-transform duration-500", !product.isOutofStock && "group-hover:scale-110", product.isOutofStock && "grayscale opacity-50")}
                                        />
                                        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        {(product.isHot || bestSellers.some(bs => bs.id === product.id)) && (
                                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs md:text-sm px-2 pt-1 pb-0.5 rounded-full shadow-md animate-pulse z-10 flex items-center justify-center">
                                                🔥
                                            </div>
                                        )}
                                        {product.isOutofStock && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-white/40 backdrop-blur-[2px]">
                                                <span className="bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs md:text-sm shadow-lg">Hết hàng</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto flex flex-col flex-1 justify-between">
                                        <h3 className="font-semibold text-slate-800 text-xs md:text-base line-clamp-2 md:line-clamp-1 group-hover:text-emerald-600 transition-colors leading-tight mb-1">{product.name}</h3>
                                        <div className="mt-1 flex flex-col lg:flex-row lg:items-center justify-between gap-1.5 lg:gap-0">
                                            <span className="font-bold text-emerald-500 text-xs md:text-base">{formatCurrency(product.price)}</span>

                                            {product.isOutofStock ? null : cartItem ? (
                                                <div
                                                    className="flex items-center gap-1.5 md:gap-2 bg-emerald-50 md:bg-slate-50 rounded-lg p-0.5 md:p-1 border border-emerald-100 md:border-slate-100 shadow-sm w-full lg:w-auto justify-between"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <button
                                                        onClick={() => updateQuantity(product.id, -1)}
                                                        className="w-6 h-6 md:w-7 md:h-7 rounded-md bg-white text-emerald-600 md:text-slate-600 flex items-center justify-center shadow-sm active:scale-95 transition-all"
                                                    >
                                                        <Minus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                    </button>
                                                    <span className="font-bold text-emerald-700 md:text-slate-800 text-xs md:text-sm w-4 text-center">{cartItem.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(product.id, 1)}
                                                        className="w-6 h-6 md:w-7 md:h-7 rounded-md bg-white text-emerald-600 md:text-slate-600 flex items-center justify-center shadow-sm active:scale-95 transition-all"
                                                    >
                                                        <Plus className="w-3.5 h-3.5 md:w-4 md:h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); addToCart(product); }}
                                                    className="w-full lg:w-8 h-7 lg:h-8 rounded-lg lg:rounded-full bg-slate-100/80 md:bg-slate-100 text-slate-600 flex items-center justify-center group-hover:bg-emerald-500 group-hover:text-white transition-colors mt-0.5 lg:mt-0"
                                                >
                                                    <Plus className="w-4 h-4 md:w-5 md:h-5" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
