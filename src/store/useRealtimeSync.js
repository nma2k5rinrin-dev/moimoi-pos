import { useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useStore } from './useStore';

const mapOrder = (o) => ({
    id: o.id, table: o.table_name, items: o.items || [],
    status: o.status, paymentStatus: o.payment_status,
    totalAmount: o.total_amount, createdBy: o.created_by,
    time: o.time, storeId: o.store_id,
});

/**
 * Hook đăng ký Supabase Realtime — đặt trong component root sau khi login
 * Tự động cập nhật Zustand khi có thay đổi từ bất kỳ thiết bị nào
 */
export function useRealtimeSync() {
    const currentUser = useStore(s => s.currentUser);
    const set = useStore.setState;

    useEffect(() => {
        if (!currentUser) return;

        const storeId = currentUser.role === 'sadmin' ? null
            : currentUser.role === 'staff' ? currentUser.createdBy
                : currentUser.username;

        // ── Orders: cập nhật realtime ─────────────────────
        const ordersChannel = supabase
            .channel('orders-changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'orders',
                ...(storeId ? { filter: `store_id=eq.${storeId}` } : {})
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const newOrder = mapOrder(payload.new);
                    set(state => {
                        const exists = state.orders.some(o => o.id === newOrder.id);
                        if (exists) return state;
                        return { orders: [newOrder, ...state.orders] };
                    });
                }
                if (payload.eventType === 'UPDATE') {
                    const updated = mapOrder(payload.new);
                    set(state => ({ orders: state.orders.map(o => o.id === updated.id ? updated : o) }));
                }
                if (payload.eventType === 'DELETE') {
                    set(state => ({ orders: state.orders.filter(o => o.id !== payload.old.id) }));
                }
            })
            .subscribe();

        // ── Notifications: chỉ lắng nghe cho user hiện tại ─
        const notiChannel = supabase
            .channel('notifications-' + currentUser.username)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notifications',
                filter: `user_id=eq.${currentUser.username}`
            }, (payload) => {
                const n = payload.new;
                set(state => ({
                    notifications: [{
                        id: n.id, userId: n.user_id, title: n.title,
                        message: n.message, time: n.time, read: n.read
                    }, ...state.notifications]
                }));
            })
            .subscribe();

        // ── Products: cập nhật thực đơn realtime ─────────
        const productsChannel = supabase
            .channel('products-changes')
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'products',
                ...(storeId ? { filter: `store_id=eq.${storeId}` } : {})
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    const p = payload.new;
                    set(state => {
                        const list = state.products[p.store_id] || [];
                        if (list.some(x => x.id === p.id)) return state;
                        return { products: { ...state.products, [p.store_id]: [p, ...list] } };
                    });
                }
                if (payload.eventType === 'UPDATE') {
                    const p = payload.new;
                    set(state => ({
                        products: {
                            ...state.products,
                            [p.store_id]: (state.products[p.store_id] || []).map(x => x.id === p.id ? p : x)
                        }
                    }));
                }
                if (payload.eventType === 'DELETE') {
                    const p = payload.old;
                    set(state => ({
                        products: {
                            ...state.products,
                            [p.store_id]: (state.products[p.store_id] || []).filter(x => x.id !== p.id)
                        }
                    }));
                }
            })
            .subscribe();

        // ── Upgrade requests: sadmin thấy realtime ────────
        let upgradeChannel = null;
        if (currentUser.role === 'sadmin') {
            upgradeChannel = supabase
                .channel('upgrade-requests')
                .on('postgres_changes', {
                    event: 'INSERT', schema: 'public', table: 'upgrade_requests'
                }, (payload) => {
                    const r = payload.new;
                    set(state => ({
                        upgradeRequests: [{
                            id: r.id, username: r.username, planIndex: r.plan_index,
                            planName: r.plan_name, months: r.months, time: r.time
                        }, ...state.upgradeRequests]
                    }));
                })
                .subscribe();
        }

        return () => {
            supabase.removeChannel(ordersChannel);
            supabase.removeChannel(notiChannel);
            supabase.removeChannel(productsChannel);
            if (upgradeChannel) supabase.removeChannel(upgradeChannel);
        };
    }, [currentUser?.username]);
}
