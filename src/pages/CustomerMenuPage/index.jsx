import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Store as StoreIcon, WifiOff, MapPin } from 'lucide-react';

import MenuGrid from './components/MenuGrid';
import CustomerCart from './components/CustomerCart';

export default function CustomerMenuPage() {
    const { storeId } = useParams();
    const [searchParams] = useSearchParams();
    const tableFromQR = searchParams.get('table');

    // ── State ─────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [storeInfo, setStoreInfo] = useState(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const selectedTable = tableFromQR || 'QR Order';
    const [cart, setCart] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [lastOrderTotal, setLastOrderTotal] = useState(0);

    // ── Load Store Data ───────────────────────────────────
    useEffect(() => {
        async function loadData() {
            setLoading(true);
            setError(null);
            try {
                // Fetch store info
                const { data: storeData, error: storeErr } = await supabase
                    .from('store_infos').select('*').eq('store_id', storeId).single();
                if (storeErr || !storeData) {
                    setError('notfound');
                    setLoading(false);
                    return;
                }
                setStoreInfo({
                    name: storeData.name || 'Cửa hàng',
                    phone: storeData.phone || '',
                    address: storeData.address || '',
                    logoUrl: storeData.logo_url || '',
                });

                // Fetch categories and products in parallel
                const [catsRes, prodsRes] = await Promise.all([
                    supabase.from('categories').select('*').eq('store_id', storeId),
                    supabase.from('products').select('*').eq('store_id', storeId),
                ]);

                setCategories((catsRes.data || []).map(c => ({ id: c.id, name: c.name })));
                setProducts((prodsRes.data || []).map(p => ({
                    id: p.id, name: p.name, price: p.price,
                    image: p.image, category: p.category,
                    description: p.description,
                    isOutofStock: p.is_out_of_stock || false,
                    isHot: p.is_hot || false,
                })));

            } catch (e) {
                console.error('[CustomerMenuPage] loadData error:', e);
                setError('network');
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, [storeId]);

    // ── Cart Actions ──────────────────────────────────────
    const addToCart = useCallback((product) => {
        setCart(prev => {
            const existing = prev.find(item => item.id === product.id);
            if (existing) {
                return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { ...product, quantity: 1, note: '' }];
        });
    }, []);

    const updateQuantity = useCallback((productId, amount) => {
        setCart(prev => prev.map(item =>
            item.id === productId ? { ...item, quantity: Math.max(1, item.quantity + amount) } : item
        ));
    }, []);

    const removeFromCart = useCallback((productId) => {
        setCart(prev => prev.filter(item => item.id !== productId));
    }, []);

    const addNote = useCallback((productId, note) => {
        setCart(prev => prev.map(item =>
            item.id === productId ? { ...item, note } : item
        ));
    }, []);

    // ── Submit Order ──────────────────────────────────────
    const submitOrder = useCallback(async () => {
        if (cart.length === 0 || !selectedTable) return false;
        setIsSubmitting(true);
        try {
            const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

                // Luôn tạo đơn mới (INSERT). 
                // Database Trigger `handle_qr_order()` sẽ tự động tìm kiếm đơn cũ 
                // (cả pending và processing) và gộp items vào nếu có.
                const newOrder = {
                    id: `QR-${Date.now()}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`,
                    store_id: storeId,
                    table_name: selectedTable,
                    items: cart.map(item => ({ ...item, isDone: false })),
                    status: 'pending',
                    payment_status: 'unpaid',
                    time: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).replace(' ', 'T'),
                    total_amount: totalAmount,
                    created_by: 'customer',
                };

                const { error: insertErr } = await supabase.from('orders').insert(newOrder);
                if (insertErr) {
                    console.error('[CustomerMenuPage] submitOrder error:', insertErr);
                    return false;
                }

            setLastOrderTotal(totalAmount);
            setCart([]);
            return true;
        } catch (e) {
            console.error('[CustomerMenuPage] submitOrder exception:', e);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    }, [cart, selectedTable, storeId]);

    // ── Render: Loading ───────────────────────────────────
    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-orange-50 flex items-center justify-center">
                <div className="text-center">
                    <img src="/an.gif" alt="Loading" className="w-28 h-28 mx-auto mb-4 rounded-2xl" />
                    <p className="text-slate-500 font-medium text-sm">Đang tải menu...</p>
                </div>
            </div>
        );
    }

    // ── Render: Error ─────────────────────────────────────
    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-6">
                <div className="text-center max-w-sm">
                    {error === 'notfound' ? (
                        <>
                            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-5">
                                <StoreIcon className="w-10 h-10 text-red-400" />
                            </div>
                            <h2 className="text-xl font-extrabold text-slate-800 mb-2">Không tìm thấy cửa hàng</h2>
                            <p className="text-slate-500 text-sm">Mã QR không hợp lệ hoặc cửa hàng đã ngừng hoạt động.</p>
                        </>
                    ) : (
                        <>
                            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
                                <WifiOff className="w-10 h-10 text-amber-500" />
                            </div>
                            <h2 className="text-xl font-extrabold text-slate-800 mb-2">Lỗi kết nối</h2>
                            <p className="text-slate-500 text-sm">Vui lòng kiểm tra kết nối mạng và thử lại.</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="mt-6 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-bold shadow-md hover:bg-emerald-600 transition-all"
                            >
                                Thử lại
                            </button>
                        </>
                    )}
                </div>
            </div>
        );
    }


    // ── Render: Menu ──────────────────────────────────────
    const displayTableName = selectedTable.includes('::')
        ? selectedTable.split('::').join(' • ')
        : selectedTable;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Store Header */}
            <div className="bg-white/90 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-50">
                <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
                    {storeInfo?.logoUrl ? (
                        <img src={storeInfo.logoUrl} alt={storeInfo.name} className="w-9 h-9 rounded-xl object-cover border border-slate-200" />
                    ) : (
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                            <StoreIcon className="w-5 h-5 text-white" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <h1 className="font-bold text-slate-800 text-sm truncate">{storeInfo?.name}</h1>
                        <div className="flex items-center gap-1 text-xs text-emerald-600 font-medium">
                            <MapPin className="w-3 h-3" />
                            <span className="truncate">{displayTableName}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Menu Content */}
            <div className="flex-1 max-w-lg mx-auto w-full flex flex-col min-h-0">
                <MenuGrid
                    products={products}
                    categories={categories}
                    cart={cart}
                    onAddToCart={addToCart}
                    onUpdateQuantity={updateQuantity}
                    onRemoveFromCart={removeFromCart}
                />
            </div>

            {/* Cart */}
            <CustomerCart
                cart={cart}
                tableName={displayTableName}
                storeName={storeInfo?.name || ''}
                onUpdateQuantity={updateQuantity}
                onRemoveFromCart={removeFromCart}
                onAddNote={addNote}
                onSubmitOrder={submitOrder}
                isSubmitting={isSubmitting}
                lastOrderTotal={lastOrderTotal}
            />
        </div>
    );
}
