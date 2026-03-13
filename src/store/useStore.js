import { create } from 'zustand';
import { supabase } from '../lib/supabase';

// Stable empty references — dùng trong selectors để tránh tạo ref mới mỗi render (gây infinite loop)
export const EMPTY_ARRAY = [];
export const EMPTY_OBJ = {};

// ============================================================
// Helper — chuyển đổi field name DB → App
// ============================================================
const mapUser = (u) => u ? ({
    username: u.username,
    pass: u.pass,
    role: u.role,
    fullname: u.fullname || '',
    phone: u.phone || '',
    avatar: u.avatar || '',
    isPremium: u.is_premium || false,
    expiresAt: u.expires_at || null,
    createdBy: u.created_by || null,
    showVipExpired: u.show_vip_expired || false,
    showVipCongrat: u.show_vip_congrat || false,
}) : null;

const mapStoreInfo = (s) => s ? ({
    name: s.name || '',
    phone: s.phone || '',
    address: s.address || '',
    logoUrl: s.logo_url || '',
    bankId: s.bank_id || '',
    bankAccount: s.bank_account || '',
    bankOwner: s.bank_owner || '',
    isPremium: s.is_premium || false,
}) : null;

const mapOrder = (o) => o ? ({
    id: o.id,
    table: o.table_name,
    items: o.items || [],
    status: o.status,
    paymentStatus: o.payment_status,
    totalAmount: o.total_amount,
    createdBy: o.created_by,
    time: o.time,
    storeId: o.store_id,
}) : null;

const mapNotification = (n) => n ? ({
    id: n.id,
    userId: n.user_id,
    title: n.title,
    message: n.message,
    time: n.time,
    read: n.read,
}) : null;

const mapUpgradeReq = (r) => r ? ({
    id: r.id,
    username: r.username,
    planIndex: r.plan_index,
    planName: r.plan_name,
    months: r.months,
    time: r.time,
}) : null;



// ============================================================
// Store
// ============================================================

// Stable default storeInfo (tranh selector || {} tạo object mới mãi)
const DEFAULT_STORE_INFO = { name: 'Nhà Hàng Của Tôi', phone: '', address: '', logoUrl: '', bankId: '', bankAccount: '', bankOwner: '', isPremium: true };

export const useStore = create((set, get) => ({
    // ── Auth & Users ─────────────────────────────────────────
    currentUser: null,
    USERS: [],
    isLoading: false,
    // Khởi tạo với sadmin mặc định — tránh selector || {} tạo object mới mỗi render
    storeInfos: { sadmin: DEFAULT_STORE_INFO },
    storeTables: { sadmin: [] },
    categories: { sadmin: [] },
    products: { sadmin: [] },

    getStoreId: () => {
        const state = get();
        const user = state.currentUser;
        if (!user) return 'sadmin';
        if (user.role === 'sadmin') {
            return state.sadminViewStoreId === 'all' ? 'sadmin' : state.sadminViewStoreId;
        }
        return user.role === 'staff' ? user.createdBy : user.username;
    },

    // Tải toàn bộ data sau khi login
    loadInitialData: async (user) => {
        set({ isLoading: true });
        try {
            const storeId = user.role === 'sadmin' ? null
                : user.role === 'staff' ? user.createdBy
                    : user.username;

            // Load tất cả users (sadmin xem hết, admin/staff xem store mình)
            const { data: usersData } = await supabase.from('users').select('*');
            const USERS = (usersData || []).map(mapUser);

            // Load storeInfos
            const { data: storeInfosData } = await supabase.from('store_infos').select('*');
            const storeInfos = {};
            (storeInfosData || []).forEach(s => { storeInfos[s.store_id] = mapStoreInfo(s); });

            // Load storeTables
            const tablesRes = await supabase.from('store_tables').select('*').order('sort_order');
            if (tablesRes.error) console.warn('[loadInitialData] store_tables error:', tablesRes.error.message, tablesRes.error.hint || '');
            const tablesData = tablesRes.data;
            const storeTables = {};
            (tablesData || []).forEach(t => {
                if (!storeTables[t.store_id]) storeTables[t.store_id] = [];
                storeTables[t.store_id].push(t.name);
            });

            // Load categories
            const { data: catsData } = await supabase.from('categories').select('*');
            const categories = {};
            (catsData || []).forEach(c => {
                if (!categories[c.store_id]) categories[c.store_id] = [];
                categories[c.store_id].push({ id: c.id, name: c.name });
            });

            // Load products
            const prodsRes = await supabase.from('products').select('*');
            if (prodsRes.error) console.warn('[loadInitialData] products error:', prodsRes.error.message, prodsRes.error.hint || '');
            const prodsData = prodsRes.data;
            const products = {};
            (prodsData || []).forEach(p => {
                if (!products[p.store_id]) products[p.store_id] = [];
                products[p.store_id].push({
                    id: p.id, store_id: p.store_id, name: p.name, price: p.price,
                    image: p.image, category: p.category, description: p.description,
                    isOutofStock: p.is_out_of_stock || false,
                    isHot: p.is_hot || false,
                });
            });

            // Load orders (free: 3 ngày, vip: 365 ngày)
            const isPremium = user.isPremium || user.role === 'sadmin';
            const daysToKeep = isPremium ? 365 : 3;
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - daysToKeep);
            let ordersQuery = supabase.from('orders').select('*').gte('time', cutoff.toISOString()).order('time', { ascending: false });
            if (storeId) ordersQuery = ordersQuery.eq('store_id', storeId);
            const ordersRes = await ordersQuery;
            if (ordersRes.error) console.warn('[loadInitialData] orders error:', ordersRes.error.message, ordersRes.error.hint || '');
            const ordersData = ordersRes.data;
            const orders = (ordersData || []).map(mapOrder);

            // Load notifications cho user hiện tại
            const { data: notiData } = await supabase.from('notifications').select('*').eq('user_id', user.username).order('time', { ascending: false });
            const notifications = (notiData || []).map(mapNotification);

            // Load upgrade requests (sadmin xem hết)
            const { data: upgradeData } = await supabase.from('upgrade_requests').select('*').order('time', { ascending: false });
            const upgradeRequests = (upgradeData || []).map(mapUpgradeReq);

            // Đảm bảo sadmin luôn có storeInfo default
            if (!storeInfos['sadmin']) storeInfos['sadmin'] = DEFAULT_STORE_INFO;
            set({ USERS, storeInfos, storeTables, categories, products, orders, notifications, upgradeRequests, isLoading: false });
        } catch (e) {
            console.error('[loadInitialData]', e);
            set({ isLoading: false });
        }
    },

    login: async (username, pass) => {
        const cleanUsername = username.toLowerCase().replace(/\s/g, '');

        try {
            const { data: users, error } = await supabase
                .from('users')
                .select('*')
                .ilike('username', cleanUsername);

            if (error || !users?.length) return 'invalid';

            const rawUser = users.find(u => u.pass === pass);
            if (!rawUser) return 'invalid';

            let user = mapUser(rawUser);

            // Kiểm tra hạn dùng
            if (user.role === 'admin' && user.expiresAt) {
                const isExpired = Date.now() > new Date(user.expiresAt).getTime();
                if (isExpired && user.isPremium) {
                    user = { ...user, isPremium: false, showVipExpired: true };
                    await supabase.from('users').update({ is_premium: false, show_vip_expired: true }).eq('username', user.username);
                }
            }

            set({ currentUser: user });
            await get().loadInitialData(user);
            return 'success';
        } catch (e) {
            console.error('[login]', e);
            return 'invalid';
        }
    },

    register: async ({ fullname, phone, storeName, username, password }) => {
        if (!navigator.onLine) {
            get().showToast('Lỗi: Bạn đang Offline, không thể đăng ký!', 'error');
            return 'offline';
        }

        // Kiểm tra trùng username
        const { data: existing } = await supabase.from('users').select('username').eq('username', username);
        if (existing?.length) {
            get().showToast('Tên đăng nhập đã tồn tại', 'error');
            return 'exists';
        }

        const newUser = { username, pass: password, role: 'admin', fullname, phone: phone || '', is_premium: false };

        const { error: uErr } = await supabase.from('users').insert(newUser);
        if (uErr) { get().showToast('Đăng ký thất bại', 'error'); return 'error'; }

        await supabase.from('store_infos').insert({
            store_id: username,
            name: storeName || fullname,
            phone: phone || '',
            is_premium: false
        });

        const mappedUser = mapUser(newUser);
        set(state => ({ currentUser: mappedUser, USERS: [...state.USERS, mappedUser] }));
        await get().loadInitialData(mappedUser);
        return 'success';
    },

    logout: () => {
        useStore.setState({
            currentUser: null, USERS: [],
            storeInfos: {}, storeTables: {},
            categories: {}, products: {}, orders: [],
            notifications: [], upgradeRequests: [],
            cart: [], selectedTable: '',
        });
    },

    updateUserAvatar: async (avatarUrl) => {
        const { currentUser } = get();
        if (!currentUser) return;
        
        try {
            await supabase.from('users').update({ avatar: avatarUrl }).eq('username', currentUser.username);
        } catch (error) {
            console.error('[updateUserAvatar]', error);
            get().showToast('Lỗi kết nối khi cập nhật', 'error');
            return;
        }
        
        const updatedUser = { ...currentUser, avatar: avatarUrl };
        set(state => ({
            currentUser: updatedUser,
            USERS: state.USERS.map(u => u.username === currentUser.username ? updatedUser : u)
        }));
    },

    addStaff: async ({ fullname, phone, username, password, role = 'staff', createdBy }) => {
        if (!navigator.onLine) {
            get().showToast('Lỗi: Bạn đang Offline!', 'error');
            return;
        }

        const state = get();
        const isAdmin = state.currentUser?.role === 'admin';
        const adminUsername = state.currentUser?.username;
        const isPremium = state.currentUser?.isPremium;

        if (isAdmin && !isPremium) {
            const myStaffCount = state.USERS.filter(u => u.role === 'staff' && u.createdBy === adminUsername).length;
            if (myStaffCount >= 1) {
                setTimeout(() => get().showConfirm(
                    'Tài khoản Miễn Phí đã đạt giới hạn 1 nhân viên. Bạn có muốn nâng cấp?',
                    () => get().setUpgradeModalOpen(true)
                ), 0);
                return;
            }
        }

        if (state.USERS.find(u => u.username === username)) {
            get().showToast('Tên đăng nhập đã tồn tại', 'error');
            return;
        }

        const newStaffRow = {
            username, pass: password, role,
            fullname, phone: phone || '',
            avatar: '', is_premium: false,
            created_by: createdBy || adminUsername
        };

        try {
            const { error } = await supabase.from('users').insert(newStaffRow);
            if (error) { get().showToast('Thêm tài khoản thất bại', 'error'); return; }

            // Nếu tạo admin mới → tạo store_infos
            if (role === 'admin') {
                await supabase.from('store_infos').insert({
                    store_id: username, name: fullname || username,
                    phone: phone || '', is_premium: false
                });
            }
        } catch (error) {
            console.error('[addStaff]', error);
            get().showToast('Lỗi đường dẫn', 'error'); return;
        }

        const mapped = mapUser(newStaffRow);
        get().showToast('Thêm tài khoản thành công!');
        set(state => ({
            USERS: [...state.USERS, mapped],
            storeInfos: role === 'admin'
                ? { ...state.storeInfos, [username]: { name: fullname || username, phone: phone || '', address: '', logoUrl: '', bankId: '', bankAccount: '', bankOwner: '', isPremium: false } }
                : state.storeInfos
        }));
    },

    updateUser: async (username, updatedData) => {
        const state = get();
        const existingUser = state.USERS.find(u => u.username === username);
        const vipRevoked = existingUser?.isPremium === true && updatedData.isPremium === false;
        if (vipRevoked) updatedData = { ...updatedData, showVipExpired: true };

        // Map camelCase → snake_case cho Supabase
        const dbData = {};
        if ('fullname' in updatedData) dbData.fullname = updatedData.fullname;
        if ('phone' in updatedData) dbData.phone = updatedData.phone;
        if ('pass' in updatedData) dbData.pass = updatedData.pass;
        if ('isPremium' in updatedData) dbData.is_premium = updatedData.isPremium;
        if ('expiresAt' in updatedData) dbData.expires_at = updatedData.expiresAt;
        if ('showVipExpired' in updatedData) dbData.show_vip_expired = updatedData.showVipExpired;
        if ('showVipCongrat' in updatedData) dbData.show_vip_congrat = updatedData.showVipCongrat;
        if ('avatar' in updatedData) dbData.avatar = updatedData.avatar;

        if (!navigator.onLine) {
             get().showToast('Lỗi: Bạn đang Offline, không thể ghi nhận thay đổi!', 'error');
             return;
        }

        try {
            await supabase.from('users').update(dbData).eq('username', username);
        } catch (error) {
            console.error('[updateUser]', error);
            get().showToast('Có lỗi kết nối CSDL, tác vụ không thành công', 'error');
            return;
        }

        get().showToast('Cập nhật thông tin thành công!');
        const isSelf = state.currentUser?.username === username;
        set(state => ({
            USERS: state.USERS.map(u => u.username === username ? { ...u, ...updatedData } : u),
            currentUser: isSelf ? { ...state.currentUser, ...updatedData } : state.currentUser
        }));
    },

    deleteUser: async (username) => {
        if (!navigator.onLine) {
            get().showToast('Lỗi: Bạn đang Offline, không thể xoá tài khoản!', 'error');
            return;
        }
        try {
            await supabase.from('users').delete().eq('username', username);
        } catch (err) {
            console.error('[deleteUser]', err);
            get().showToast('Xoá hỏng do lỗi mạng', 'error'); return;
        }
        get().showToast(`Đã xoá người dùng ${username}`);
        set(state => ({ USERS: state.USERS.filter(u => u.username !== username) }));
    },

    cancelOrder: async (orderId) => {
        await supabase.from('orders').delete().eq('id', orderId);
        set(state => ({ orders: state.orders.filter(o => o.id !== orderId) }));
    },

    // ── Không còn cần cleanupStoreData vì query DB đã filter theo ngày ─
    cleanupStoreData: () => { },

    // ── Confirm Modal ─────────────────────────────────────────
    confirmDialog: null,
    showConfirm: (message, onConfirm) => set({ confirmDialog: { message, onConfirm } }),
    closeConfirm: () => set({ confirmDialog: null }),

    // ── Notifications ─────────────────────────────────────────
    notifications: [],
    addNotification: async (userId, title, message) => {
        const newN = { id: Date.now().toString(), user_id: userId, title, message, time: new Date().toISOString(), read: false };
        await supabase.from('notifications').insert(newN);
        set(state => ({ notifications: [mapNotification(newN), ...state.notifications] }));
    },
    markNotificationAsRead: async (id) => {
        await supabase.from('notifications').update({ read: true }).eq('id', id);
        set(state => ({ notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n) }));
    },
    clearNotifications: async (userId) => {
        await supabase.from('notifications').delete().eq('user_id', userId);
        set(state => ({ notifications: state.notifications.filter(n => n.userId !== userId) }));
    },

    // ── Upgrade Modal ─────────────────────────────────────────
    isUpgradeModalOpen: false,
    setUpgradeModalOpen: (isOpen) => set({ isUpgradeModalOpen: isOpen }),

    // ── Upgrade Requests ──────────────────────────────────────
    upgradeRequests: [],
    requestUpgrade: async (username, planIndex, planName, months) => {
        const state = get();
        if (state.upgradeRequests.some(r => r.username === username)) {
            get().showToast('Bạn đã có yêu cầu đang chờ duyệt!', 'error');
            return;
        }
        const newReq = { id: Date.now().toString(), username, plan_index: planIndex, plan_name: planName, months, time: new Date().toISOString() };
        await supabase.from('upgrade_requests').insert(newReq);
        get().showToast(`Đã gửi yêu cầu nâng cấp ${planName}!`);
        set(state => ({
            upgradeRequests: [...state.upgradeRequests, mapUpgradeReq(newReq)],
            isUpgradeModalOpen: false
        }));
    },

    approveUpgrade: async (requestId) => {
        const state = get();
        const req = state.upgradeRequests.find(r => r.id === requestId);
        if (!req) return;

        const targetUser = state.USERS.find(u => u.username === req.username);
        if (!targetUser) { get().showToast('Không tìm thấy tài khoản', 'error'); return; }

        const baseDate = (targetUser.expiresAt && new Date(targetUser.expiresAt).getTime() > Date.now())
            ? new Date(targetUser.expiresAt) : new Date();
        baseDate.setDate(baseDate.getDate() + (req.months * 30));

        const updates = { is_premium: true, expires_at: baseDate.toISOString(), show_vip_congrat: true };
        await supabase.from('users').update(updates).eq('username', req.username);
        await supabase.from('store_infos').update({ is_premium: true }).eq('store_id', req.username);
        await supabase.from('upgrade_requests').delete().eq('id', requestId);

        const notiRow = {
            id: Date.now().toString(), user_id: req.username,
            title: 'Nâng cấp VIP thành công',
            message: `Yêu cầu gói ${req.planName} đã được duyệt. Hạn đến ${baseDate.toLocaleDateString('vi-VN')}`,
            time: new Date().toISOString(), read: false
        };
        await supabase.from('notifications').insert(notiRow);

        get().showToast(`Đã duyệt gói ${req.planName} cho ${req.username}`);
        const isSelf = state.currentUser?.username === req.username;
        set(state => ({
            USERS: state.USERS.map(u => u.username === req.username ? { ...u, isPremium: true, expiresAt: baseDate.toISOString(), showVipCongrat: true } : u),
            storeInfos: { ...state.storeInfos, [req.username]: { ...state.storeInfos[req.username], isPremium: true } },
            upgradeRequests: state.upgradeRequests.filter(r => r.id !== requestId),
            notifications: [mapNotification(notiRow), ...state.notifications],
            currentUser: isSelf ? { ...state.currentUser, isPremium: true, expiresAt: baseDate.toISOString(), showVipCongrat: true } : state.currentUser,
        }));
    },

    rejectUpgrade: async (requestId) => {
        const state = get();
        const req = state.upgradeRequests.find(r => r.id === requestId);
        await supabase.from('upgrade_requests').delete().eq('id', requestId);
        if (req) {
            const notiRow = {
                id: Date.now().toString(), user_id: req.username,
                title: 'Yêu cầu VIP bị từ chối',
                message: `Yêu cầu gói ${req.planName} chưa được duyệt.`,
                time: new Date().toISOString(), read: false
            };
            await supabase.from('notifications').insert(notiRow);
            set(state => ({
                upgradeRequests: state.upgradeRequests.filter(r => r.id !== requestId),
                notifications: [mapNotification(notiRow), ...state.notifications]
            }));
        }
        get().showToast('Đã từ chối yêu cầu nâng cấp', 'error');
    },

    clearVipCongrat: async (username) => {
        await supabase.from('users').update({ show_vip_congrat: false }).eq('username', username);
        set(state => ({
            USERS: state.USERS.map(u => u.username === username ? { ...u, showVipCongrat: false } : u),
            currentUser: state.currentUser?.username === username ? { ...state.currentUser, showVipCongrat: false } : state.currentUser,
        }));
    },

    closeVipExpiredModal: async (username) => {
        await supabase.from('users').update({ show_vip_expired: false }).eq('username', username);
        set(state => ({
            USERS: state.USERS.map(u => u.username === username ? { ...u, showVipExpired: false } : u),
            currentUser: state.currentUser?.username === username ? { ...state.currentUser, showVipExpired: false } : state.currentUser,
        }));
    },

    // ── Store Info ────────────────────────────────────────────
    // (storeInfos đã khai báo ở trên với default sadmin, KHÔNG khai báo lại)
    updateStoreInfo: async (info) => {
        const storeId = get().getStoreId();
        const dbData = {
            name: info.name,
            phone: info.phone,
            address: info.address,
            logo_url: info.logoUrl,
            bank_id: info.bankId,
            bank_account: info.bankAccount,
            bank_owner: info.bankOwner,
        };
        Object.keys(dbData).forEach(k => dbData[k] === undefined && delete dbData[k]);
        await supabase.from('store_infos').upsert({ store_id: storeId, ...dbData });
        set(state => ({
            storeInfos: { ...state.storeInfos, [storeId]: { ...state.storeInfos[storeId], ...info } }
        }));
    },

    // ── Store Tables ──────────────────────────────────────────
    storeTables: {},
    addTable: async (tableName) => {
        const storeId = get().getStoreId();
        const currentTables = get().storeTables[storeId] || [];
        if (currentTables.includes(tableName)) return;
        await supabase.from('store_tables').insert({ store_id: storeId, name: tableName, sort_order: currentTables.length });
        set(state => ({
            storeTables: { ...state.storeTables, [storeId]: [...currentTables, tableName] }
        }));
    },
    removeTable: async (tableName) => {
        const storeId = get().getStoreId();
        const currentTables = get().storeTables[storeId] || [];
        const newTables = currentTables.filter(t => t !== tableName);
        await supabase.from('store_tables').delete().eq('store_id', storeId).eq('name', tableName);
        set(state => ({
            storeTables: { ...state.storeTables, [storeId]: newTables },
            selectedTable: state.selectedTable === tableName ? (newTables[0] || '') : state.selectedTable
        }));
    },
    updateTable: async (oldName, newName) => {
        if (!oldName || !newName || oldName === newName) return;
        const storeId = get().getStoreId();
        const currentTables = get().storeTables[storeId] || [];
        if (!currentTables.includes(oldName) || currentTables.includes(newName)) return;
        
        await supabase.from('store_tables').update({ name: newName }).eq('store_id', storeId).eq('name', oldName);
        
        const newTables = currentTables.map(t => t === oldName ? newName : t);
        set(state => ({
            storeTables: { ...state.storeTables, [storeId]: newTables },
            selectedTable: state.selectedTable === oldName ? newName : state.selectedTable
        }));
    },

    // ── Categories ────────────────────────────────────────────
    categories: {},
    addCategory: async (categoryName) => {
        const storeId = get().getStoreId();
        const currentCategories = get().categories[storeId] || [];
        const state = get();
        const isPremium = state.currentUser?.isPremium;
        const isSadmin = state.currentUser?.role === 'sadmin';
        if (!isPremium && !isSadmin && currentCategories.length >= 2) {
            setTimeout(() => get().showConfirm('Tài khoản Miễn Phí đã đạt giới hạn 2 phân loại. Nâng cấp để thêm không giới hạn?', () => get().setUpgradeModalOpen(true)), 0);
            return;
        }
        const newCat = { id: 'cat_' + Date.now().toString(), store_id: storeId, name: categoryName };
        await supabase.from('categories').insert(newCat);
        set(state => ({ categories: { ...state.categories, [storeId]: [...currentCategories, { id: newCat.id, name: newCat.name }] } }));
    },
    updateCategory: async (updatedCategory) => {
        const storeId = get().getStoreId();
        await supabase.from('categories').update({ name: updatedCategory.name }).eq('id', updatedCategory.id);
        set(state => ({
            categories: { ...state.categories, [storeId]: (state.categories[storeId] || []).map(c => c.id === updatedCategory.id ? updatedCategory : c) }
        }));
    },
    deleteCategory: async (categoryId) => {
        const storeId = get().getStoreId();
        await supabase.from('categories').delete().eq('id', categoryId);
        await supabase.from('products').update({ category: '' }).eq('store_id', storeId).eq('category', categoryId);
        set(state => ({
            categories: { ...state.categories, [storeId]: (state.categories[storeId] || []).filter(c => c.id !== categoryId) },
            products: { ...state.products, [storeId]: (state.products[storeId] || []).map(p => p.category === categoryId ? { ...p, category: '' } : p) }
        }));
    },

    // ── Products ──────────────────────────────────────────────
    products: {},
    addProduct: async (product) => {
        const storeId = get().getStoreId();
        const currentProducts = get().products[storeId] || [];
        const state = get();
        const isPremium = state.currentUser?.isPremium;
        const isSadmin = state.currentUser?.role === 'sadmin';
        if (!isPremium && !isSadmin && currentProducts.length >= 5) {
            setTimeout(() => get().showConfirm('Tài khoản Miễn Phí đã đạt giới hạn 5 món. Nâng cấp để thêm không giới hạn?', () => get().setUpgradeModalOpen(true)), 0);
            return;
        }
        const newProd = { ...product, id: Date.now().toString(), store_id: storeId };
        const { error } = await supabase.from('products').insert({
            id: newProd.id, store_id: storeId, name: newProd.name,
            price: newProd.price, image: newProd.image || '',
            category: newProd.category || '', description: newProd.description || ''
        });
        if (error) { console.error('[addProduct] Supabase error:', error.message, error.hint || '', error.details || ''); get().showToast('Thêm món thất bại: ' + error.message, 'error'); return; }
        set(state => ({ products: { ...state.products, [storeId]: [newProd, ...currentProducts] } }));
    },
    updateProduct: async (updatedProduct) => {
        const storeId = get().getStoreId();
        await supabase.from('products').update({
            name: updatedProduct.name, price: updatedProduct.price,
            image: updatedProduct.image, category: updatedProduct.category,
            description: updatedProduct.description
        }).eq('id', updatedProduct.id);
        set(state => ({
            products: { ...state.products, [storeId]: (state.products[storeId] || []).map(p => p.id === updatedProduct.id ? updatedProduct : p) }
        }));
    },
    deleteProduct: async (productId) => {
        const storeId = get().getStoreId();
        await supabase.from('products').delete().eq('id', productId);
        set(state => ({
            products: { ...state.products, [storeId]: (state.products[storeId] || []).filter(p => p.id !== productId) }
        }));
    },

    // ── Orders ────────────────────────────────────────────────
    orders: [],
    updateOrderStatus: async (orderId, status) => {
        await supabase.from('orders').update({ status }).eq('id', orderId);
        set(state => ({ orders: state.orders.map(o => o.id === orderId ? { ...o, status } : o) }));
    },
    updateOrderPaymentStatus: async (orderId, paymentStatus) => {
        await supabase.from('orders').update({ payment_status: paymentStatus }).eq('id', orderId);
        set(state => ({ orders: state.orders.map(o => o.id === orderId ? { ...o, paymentStatus } : o) }));
    },
    updateOrderItemStatus: async (orderId, itemId, isDone) => {
        const order = get().orders.find(o => o.id === orderId);
        if (!order) return;
        const newItems = order.items.map(item => item.id === itemId ? { ...item, isDone } : item);
        await supabase.from('orders').update({ items: newItems }).eq('id', orderId);
        set(state => ({
            orders: state.orders.map(o => o.id === orderId ? { ...o, items: newItems } : o)
        }));
    },
    updateOrderItems: async (orderId, newItems, newTotalAmount) => {
        const order = get().orders.find(o => o.id === orderId);
        if (!order) return;
        
        await supabase.from('orders').update({ items: newItems, total_amount: newTotalAmount }).eq('id', orderId);
        set(state => ({
            orders: state.orders.map(o => o.id === orderId ? { ...o, items: newItems, totalAmount: newTotalAmount } : o)
        }));
    },

    checkoutOrder: async (paymentStatus = 'unpaid') => {
        const state = get();
        if (state.cart.length === 0) return;

        const isPremium = state.currentUser?.isPremium;
        const isSadmin = state.currentUser?.role === 'sadmin';

        if (!isPremium && !isSadmin) {
            const todayStr = new Date().toDateString();
            const storeOwner = state.currentUser?.role === 'staff' ? state.currentUser?.createdBy : state.currentUser?.username;
            const storeUsers = state.USERS.filter(u => u.username === storeOwner || u.createdBy === storeOwner).map(u => u.username);
            const totalToday = state.orders.filter(o => storeUsers.includes(o.createdBy) && new Date(o.time).toDateString() === todayStr).length;
            if (totalToday >= 10) {
                setTimeout(() => get().showConfirm('Đã đạt 10 đơn hôm nay (giới hạn Miễn Phí). Nâng cấp để tạo không giới hạn?', () => get().setUpgradeModalOpen(true)), 0);
                return;
            }
        }

        const totalAmount = get().getCartTotal();
        const storeId = get().getStoreId();
        const newOrder = {
            id: `ORD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
            store_id: storeId,
            table_name: state.selectedTable,
            items: state.cart.map(item => ({ ...item, isDone: false })),
            status: 'pending',
            payment_status: paymentStatus,
            time: new Date().toISOString(),
            total_amount: totalAmount,
            created_by: state.currentUser?.username || 'unknown',
        };

        const { error } = await supabase.from('orders').insert(newOrder);
        if (error) { console.error('[checkoutOrder] Supabase error:', error.message, error.hint || '', error.details || ''); get().showToast('Tạo đơn thất bại: ' + error.message, 'error'); return; }

        set(state => ({ orders: [mapOrder(newOrder), ...state.orders], cart: [] }));
    },

    // ── Cart (local only) ─────────────────────────────────────
    cart: [],
    selectedCategory: 'all',
    searchQuery: '',
    selectedTable: '',
    sadminViewStoreId: 'all',
    setSadminViewStoreId: (storeId) => set({ sadminViewStoreId: storeId }),
    setSelectedTable: (table) => set({ selectedTable: table }),
    theme: 'light',
    toast: null,

    addToCart: (product) => set(state => {
        const existing = state.cart.find(item => item.id === product.id);
        if (existing) return { cart: state.cart.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item) };
        return { cart: [...state.cart, { ...product, quantity: 1, note: '' }] };
    }),
    removeFromCart: (productId) => set(state => ({ cart: state.cart.filter(item => item.id !== productId) })),
    updateQuantity: (productId, amount) => set(state => ({
        cart: state.cart.map(item => item.id === productId ? { ...item, quantity: Math.max(1, item.quantity + amount) } : item)
    })),
    addNote: (productId, note) => set(state => ({
        cart: state.cart.map(item => item.id === productId ? { ...item, note } : item)
    })),
    clearCart: () => set({ cart: [] }),
    getCartTotal: () => get().cart.reduce((total, item) => total + (item.price * item.quantity), 0),

    setCategory: (category) => set({ selectedCategory: category }),
    setSearchQuery: (query) => set({ searchQuery: query }),

    showToast: (message, type = 'success') => {
        set({ toast: { message, type } });
        setTimeout(() => set(state => state.toast?.message === message ? { toast: null } : state), 1800);
    },

    toggleTheme: () => set(state => {
        const newTheme = state.theme === 'light' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        return { theme: newTheme };
    }),

    bestSellers: [],
}));

// ── Derived Hook ──────────────────────────────────────────────
export const useStoreId = () => useStore(state => {
    const user = state.currentUser;
    if (!user) return 'sadmin';
    if (user.role === 'sadmin') return state.sadminViewStoreId === 'all' ? 'sadmin' : state.sadminViewStoreId;
    return user.role === 'staff' ? user.createdBy : user.username;
});
