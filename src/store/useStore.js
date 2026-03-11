import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
    persist(
        (set, get) => ({
            // Auth & Users
            currentUser: null,
            USERS: [
                { username: 'sadmin', pass: '1', role: 'sadmin', fullname: 'Super Admin', avatar: '', isPremium: true },
                { username: 'nv1', pass: '1', role: 'staff', fullname: 'Nhân viên 1', avatar: '', createdBy: 'sadmin' }
            ],
            // Helper function lấy ID của Cửa hàng mẹ
            getStoreId: () => {
                const state = get();
                const user = state.currentUser;
                if (!user) return 'sadmin';
                if (user.role === 'sadmin') {
                    return state.sadminViewStoreId === 'all' ? 'sadmin' : state.sadminViewStoreId;
                }
                return user.role === 'staff' ? user.createdBy : user.username;
            },
            login: (username, pass) => {
                // Bypass login cho SuperAdmin ngay cả khi mảng USERS chưa được persist cập nhật
                if (username === 'sadmin' && pass === '1') {
                    const superAdminData = { username: 'sadmin', pass: '1', role: 'sadmin', fullname: 'SuperAdmin', avatar: '', isPremium: true };
                    set(state => ({
                        currentUser: superAdminData,
                        USERS: state.USERS.find(u => u.username === 'sadmin')
                            ? state.USERS
                            : [...state.USERS, superAdminData]
                    }));
                    get().cleanupStoreData();
                    return 'success';
                }

                const cleanInputUsername = username.toLowerCase().replace(/\s/g, '');
                const user = get().USERS.find(u => {
                    const cleanDbUsername = u.username.toLowerCase().replace(/\s/g, '');
                    return cleanDbUsername === cleanInputUsername && u.pass === pass;
                });
                if (user) {
                    // Check Hạn Sử Dụng (License) cho Admin
                    if (user.role === 'admin' && user.expiresAt) {
                        const isExpired = Date.now() > new Date(user.expiresAt).getTime();
                        if (isExpired) {
                            // User is expired, demote to free tier but DO NOT block login
                            if (user.isPremium) {
                                user.isPremium = false;
                            }
                            user.showVipExpired = true; // Flag to show the Renewal Modal

                            // Remove showVipCongrat if it somehow lingered
                            if (user.showVipCongrat) {
                                user.showVipCongrat = false;
                            }
                        }
                    }
                    // Nếu Staff đăng nhập, kiểm tra xem Cửa Hàng (Admin quản lý) có bị hết hạn không
                    if (user.role === 'staff' && user.createdBy) {
                        const parentAdmin = get().USERS.find(u => u.username === user.createdBy);
                        if (parentAdmin && parentAdmin.expiresAt) {
                            const isParentExpired = Date.now() > new Date(parentAdmin.expiresAt).getTime();
                            if (isParentExpired) {
                                // Just let staff login but inform them if necessary. For now, we allow them to login.
                                // Or we could block them? Let's allow but they also face limitations.
                            }
                        }
                    }

                    // Update the USERS array to reflect isPremium and showVipExpired changes
                    const updatedUsers = get().USERS.map(u => u.username === user.username ? { ...u, isPremium: user.isPremium, showVipExpired: user.showVipExpired, showVipCongrat: user.showVipCongrat } : u);

                    const updatedStoreInfos = { ...get().storeInfos };
                    if (updatedStoreInfos[user.username] && user.role === 'admin') {
                        updatedStoreInfos[user.username] = { ...updatedStoreInfos[user.username], isPremium: user.isPremium };
                    }

                    set({
                        currentUser: user,
                        USERS: updatedUsers,
                        storeInfos: updatedStoreInfos
                    });
                    get().cleanupStoreData();
                    return 'success';
                }
                return 'invalid';
            },
            register: ({ fullname, phone, storeName, username, password }) => {
                const newUser = { username, pass: password, role: 'admin', fullname, phone, expiresAt: null, isPremium: false };
                set(state => ({
                    USERS: [...state.USERS, newUser],
                    currentUser: newUser,
                    storeInfos: {
                        ...state.storeInfos,
                        [username]: {
                            name: storeName || fullname,
                            phone: phone || '',
                            address: '',
                            logoUrl: '',
                            bankId: '',
                            bankAccount: '',
                            bankOwner: '',
                            isPremium: false
                        }
                    },
                    storeTables: {
                        ...state.storeTables,
                        [username]: []
                    },
                    categories: {
                        ...state.categories,
                        [username]: []
                    },
                    products: {
                        ...state.products,
                        [username]: []
                    }
                }));
            },
            logout: () => set({ currentUser: null }),
            updateUserAvatar: (avatarUrl) => set(state => {
                if (!state.currentUser) return state;
                const updatedUser = { ...state.currentUser, avatar: avatarUrl };
                return {
                    currentUser: updatedUser,
                    USERS: state.USERS.map(u => u.username === updatedUser.username ? updatedUser : u)
                };
            }),
            addStaff: ({ fullname, phone, username, password, role = 'staff', createdBy }) => set(state => {
                const isSuperAdmin = state.currentUser?.role === 'sadmin';
                const isAdmin = state.currentUser?.role === 'admin';
                const adminUsername = state.currentUser?.username;
                const isPremium = state.currentUser?.isPremium;

                // Đếm staff thuộc riêng admin này (không tính toàn hệ thống)
                if (isAdmin && !isPremium) {
                    const myStaffCount = state.USERS.filter(u => u.role === 'staff' && u.createdBy === adminUsername).length;
                    if (myStaffCount >= 1) {
                        setTimeout(() => get().showConfirm(
                            'Tài khoản Miễn Phí đã đạt giới hạn 1 nhân viên. Bạn có muốn nâng cấp lên bản trả phí để thêm không giới hạn không?',
                            () => get().setUpgradeModalOpen(true)
                        ), 0);
                        return state;
                    }
                }

                if (state.USERS.find(u => u.username === username)) {
                    get().showToast('Tên đăng nhập đã tồn tại', 'error');
                    return state;
                }
                const newStaff = { username, pass: password, role: role, isPremium: false, fullname, phone, avatar: '', createdBy: createdBy || state.currentUser?.username };
                get().showToast('Thêm tài khoản thành công!');

                const updatedStoreInfos = role === 'admin' ? {
                    ...state.storeInfos,
                    [username]: {
                        name: fullname || username,
                        phone: phone || '',
                        address: '',
                        logoUrl: '',
                        bankId: '',
                        bankAccount: '',
                        bankOwner: '',
                        isPremium: false
                    }
                } : state.storeInfos;

                const updatedStoreTables = role === 'admin' ? {
                    ...state.storeTables,
                    [username]: []
                } : state.storeTables;

                const updatedCategories = role === 'admin' ? {
                    ...state.categories,
                    [username]: []
                } : state.categories;

                const updatedProducts = role === 'admin' ? {
                    ...state.products,
                    [username]: []
                } : state.products;

                return {
                    USERS: [...state.USERS, newStaff],
                    storeInfos: updatedStoreInfos,
                    storeTables: updatedStoreTables,
                    categories: updatedCategories,
                    products: updatedProducts
                };
            }),
            updateUser: (username, updatedData) => set(state => {
                const existingUser = state.USERS.find(u => u.username === username);

                // Nếu sadmin tắt VIP (isPremium: true → false), tự động báo hết hạn
                const vipRevoked = existingUser?.isPremium === true && updatedData.isPremium === false;
                if (vipRevoked) {
                    updatedData = { ...updatedData, showVipExpired: true };
                }

                const updatedUsers = state.USERS.map(u =>
                    u.username === username ? { ...u, ...updatedData } : u
                );

                // Nếu đổi username cho Staff, cập nhật lại createdBy trong các Order cũ
                let updatedOrders = state.orders;
                const newUsername = updatedData.username;
                if (newUsername && newUsername !== username) {
                    updatedOrders = state.orders.map(o =>
                        o.createdBy === username ? { ...o, createdBy: newUsername } : o
                    );
                }

                get().showToast('Cập nhật thông tin thành công!');
                // Nếu đang update chính mình, cập nhật luôn session currentUser
                const isSelf = state.currentUser?.username === username;
                return {
                    USERS: updatedUsers,
                    orders: updatedOrders,
                    currentUser: isSelf ? { ...state.currentUser, ...updatedData } : state.currentUser
                };
            }),
            deleteUser: (username) => set(state => {
                state.showToast(`Đã xoá nhân viên ${username}`);
                return { USERS: state.USERS.filter(u => u.username !== username) };
            }),
            cancelOrder: (orderId) => set(state => ({
                orders: state.orders.filter(o => o.id !== orderId)
            })),

            // Tự động phân loại dọn dẹp Local Store khi Login (Tránh tràn Memory)
            cleanupStoreData: () => set(state => {
                const storeId = get().getStoreId();
                const currentStoreInfo = state.storeInfos[storeId] || state.storeInfos['sadmin'] || {};

                // Mặc định gói Free lưu 3 ngày, VIP lưu 365 ngày
                const isPremium = currentStoreInfo?.isPremium || false;
                const daysToKeep = isPremium ? 365 : 3;

                const cutoffDate = new Date();
                cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
                cutoffDate.setHours(0, 0, 0, 0);

                const validOrders = state.orders.filter(order => new Date(order.time) >= cutoffDate);
                return { orders: validOrders };
            }),

            // Global Confirm Modal UI
            confirmDialog: null,
            showConfirm: (message, onConfirm) => set({ confirmDialog: { message, onConfirm } }),
            closeConfirm: () => set({ confirmDialog: null }),

            // Notification System
            notifications: [],
            addNotification: (userId, title, message) => set(state => ({
                notifications: [{
                    id: Date.now().toString(),
                    userId,
                    title,
                    message,
                    time: new Date().toISOString(),
                    read: false
                }, ...state.notifications]
            })),
            markNotificationAsRead: (id) => set(state => ({
                notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
            })),
            clearNotifications: (userId) => set(state => ({
                notifications: state.notifications.filter(n => n.userId !== userId)
            })),

            // Upgrade Modal State
            isUpgradeModalOpen: false,
            setUpgradeModalOpen: (isOpen) => set({ isUpgradeModalOpen: isOpen }),

            // Hệ thống Kiểm duyệt VIP
            upgradeRequests: [],
            requestUpgrade: (username, planIndex, planName, months) => set(state => {
                if (state.upgradeRequests.some(req => req.username === username)) {
                    state.showToast('Bạn đã có yêu cầu nâng cấp đang chờ duyệt!', 'error');
                    return state;
                }
                const newReq = { id: Date.now().toString(), username, planIndex, planName, months, time: new Date().toISOString() };
                state.showToast(`Đã gửi yêu cầu Nâng cấp ${planName} đến SuperAdmin!`);
                return { upgradeRequests: [...state.upgradeRequests, newReq], isUpgradeModalOpen: false };
            }),
            approveUpgrade: (requestId) => set(state => {
                const req = state.upgradeRequests.find(r => r.id === requestId);
                if (!req) return state;

                const targetUserIndex = state.USERS.findIndex(u => u.username === req.username);
                if (targetUserIndex === -1) {
                    state.showToast('Không tìm thấy tài khoản để duyệt', 'error');
                    return { upgradeRequests: state.upgradeRequests.filter(r => r.id !== requestId) };
                }

                const currentUserObj = state.USERS[targetUserIndex];

                // Merge Hạn sử dụng: Nếu đang còn Hạn -> Cộng dồn. Nếu Đã hết/Chưa có -> Tính từ Hiện tại.
                const baseDate = (currentUserObj.expiresAt && new Date(currentUserObj.expiresAt).getTime() > Date.now())
                    ? new Date(currentUserObj.expiresAt)
                    : new Date();

                baseDate.setDate(baseDate.getDate() + (req.months * 30));

                const updatedUser = {
                    ...currentUserObj,
                    isPremium: true,
                    expiresAt: baseDate.toISOString(),
                    showVipCongrat: true
                };

                const newUsers = [...state.USERS];
                newUsers[targetUserIndex] = updatedUser;

                state.showToast(`Đã duyệt gói ${req.planName} cho Cửa hàng ${req.username}`);

                // Nếu người click duyệt lại chính là đối tượng đang Login (Tự duyệt) -> update cả currentUser
                const isSelf = state.currentUser?.username === req.username;

                // Sync VIP Status vào storeInfos của Admin đó
                const updatedStoreInfos = { ...state.storeInfos };
                if (updatedStoreInfos[req.username]) {
                    updatedStoreInfos[req.username] = { ...updatedStoreInfos[req.username], isPremium: true };
                }

                const newNotification = {
                    id: Date.now().toString(),
                    userId: req.username,
                    title: 'Nâng cấp VIP thành công',
                    message: `Yêu cầu gói ${req.planName} của bạn đã được duyệt. Hạn sử dụng đến ${baseDate.toLocaleDateString('vi-VN')}`,
                    time: new Date().toISOString(),
                    read: false
                };

                return {
                    USERS: newUsers,
                    currentUser: isSelf ? updatedUser : state.currentUser,
                    storeInfos: updatedStoreInfos,
                    upgradeRequests: state.upgradeRequests.filter(r => r.id !== requestId),
                    notifications: [newNotification, ...state.notifications]
                };
            }),
            rejectUpgrade: (requestId) => set(state => {
                const req = state.upgradeRequests.find(r => r.id === requestId);
                if (req) {
                    const newNotification = {
                        id: Date.now().toString(),
                        userId: req.username,
                        title: 'Yêu cầu VIP bị từ chối',
                        message: `Yêu cầu tự động nâng cấp gói ${req.planName} chưa được duyệt.`,
                        time: new Date().toISOString(),
                        read: false
                    };
                    state.showToast('Đã từ chối yêu cầu Nâng cấp', 'error');
                    return {
                        upgradeRequests: state.upgradeRequests.filter(r => r.id !== requestId),
                        notifications: [newNotification, ...state.notifications]
                    };
                }
                state.showToast('Đã từ chối yêu cầu Nâng cấp', 'error');
                return { upgradeRequests: state.upgradeRequests.filter(r => r.id !== requestId) };
            }),

            clearVipCongrat: (username) => set(state => {
                const updatedUsers = state.USERS.map(u => u.username === username ? { ...u, showVipCongrat: false } : u);
                const isSelf = state.currentUser?.username === username;
                return {
                    USERS: updatedUsers,
                    currentUser: isSelf ? { ...state.currentUser, showVipCongrat: false } : state.currentUser
                };
            }),

            closeVipExpiredModal: (username) => set(state => {
                const updatedUsers = state.USERS.map(u => u.username === username ? { ...u, showVipExpired: false } : u);
                const isSelf = state.currentUser?.username === username;
                return {
                    USERS: updatedUsers,
                    currentUser: isSelf ? { ...state.currentUser, showVipExpired: false } : state.currentUser
                };
            }),

            // Store Info
            storeInfos: {
                'sadmin': {
                    name: 'Nhà Hàng Của Tôi',
                    address: 'Số 102, Đường Nguyễn Văn Linh, Phường Tân Phú, Quận 7, TP.HCM',
                    phone: '0987 654 321',
                    logoUrl: '',
                    bankId: '',
                    bankAccount: '',
                    bankOwner: '',
                    isPremium: true
                }
            },
            updateStoreInfo: (info) => set(state => {
                const storeId = state.getStoreId();
                const currentInfo = state.storeInfos[storeId] || {};
                return {
                    storeInfos: {
                        ...state.storeInfos,
                        [storeId]: { ...currentInfo, ...info }
                    }
                };
            }),

            // Dynamic Tables
            storeTables: {
                'sadmin': []
            },
            addTable: (tableName) => set(state => {
                const storeId = state.getStoreId();
                const currentTables = state.storeTables[storeId] || [];
                return {
                    storeTables: {
                        ...state.storeTables,
                        [storeId]: currentTables.includes(tableName) ? currentTables : [...currentTables, tableName]
                    }
                };
            }),
            removeTable: (tableName) => set(state => {
                const storeId = state.getStoreId();
                const currentTables = state.storeTables[storeId] || [];
                const newTables = currentTables.filter(t => t !== tableName);
                return {
                    storeTables: {
                        ...state.storeTables,
                        [storeId]: newTables
                    },
                    selectedTable: state.selectedTable === tableName ? (newTables[0] || '') : state.selectedTable
                };
            }),

            categories: { 'sadmin': [{ id: 'main', name: 'Món Chính' }, { id: 'drink', name: 'Đồ Uống' }] },
            products: { 'sadmin': [] },
            bestSellers: [],
            cart: [],
            orders: [],
            selectedCategory: 'all',
            searchQuery: '',
            selectedTable: 'Mang về',
            sadminViewStoreId: 'all', // all hoặc username của admin
            setSadminViewStoreId: (storeId) => set({ sadminViewStoreId: storeId }),
            setSelectedTable: (table) => set({ selectedTable: table }),
            theme: 'light',
            toast: null,

            showToast: (message, type = 'success') => {
                set({ toast: { message, type } });
                setTimeout(() => {
                    set(state => state.toast?.message === message ? { toast: null } : state);
                }, 1800);
            },

            toggleTheme: () => set(state => {
                const newTheme = state.theme === 'light' ? 'dark' : 'light';
                // Apply class directly to HTML
                if (newTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
                return { theme: newTheme };
            }),

            setCategory: (category) => set({ selectedCategory: category }),
            setSearchQuery: (query) => set({ searchQuery: query }),

            updateOrderStatus: (orderId, status) => set(state => ({
                orders: state.orders.map(order => order.id === orderId ? { ...order, status } : order)
            })),

            updateOrderPaymentStatus: (orderId, paymentStatus) => set(state => ({
                orders: state.orders.map(o => o.id === orderId ? { ...o, paymentStatus } : o)
            })),

            updateOrderItemStatus: (orderId, itemId, isDone) => set(state => ({
                orders: state.orders.map(order => {
                    if (order.id === orderId) {
                        return {
                            ...order,
                            items: order.items.map(item => item.id === itemId ? { ...item, isDone } : item)
                        };
                    }
                    return order;
                })
            })),

            addToCart: (product) => set((state) => {
                const existingItem = state.cart.find(item => item.id === product.id);
                if (existingItem) {
                    return {
                        cart: state.cart.map(item =>
                            item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                        )
                    };
                }
                return { cart: [...state.cart, { ...product, quantity: 1, note: '' }] };
            }),

            removeFromCart: (productId) => set((state) => ({
                cart: state.cart.filter(item => item.id !== productId)
            })),

            updateQuantity: (productId, amount) => set((state) => ({
                cart: state.cart.map(item => {
                    if (item.id === productId) {
                        const newQuantity = Math.max(1, item.quantity + amount);
                        return { ...item, quantity: newQuantity };
                    }
                    return item;
                })
            })),

            addNote: (productId, note) => set((state) => ({
                cart: state.cart.map(item =>
                    item.id === productId ? { ...item, note } : item
                )
            })),

            clearCart: () => set({ cart: [] }),

            setSelectedTable: (table) => set({ selectedTable: table }),

            checkoutOrder: (paymentStatus = 'unpaid') => set(state => {
                if (state.cart.length === 0) return state;

                // Check giới hạn 10 đơn/ngày - chỉ áp dụng cho tài khoản miễn phí
                const isPremium = state.currentUser?.isPremium;
                const isSadmin = state.currentUser?.role === 'sadmin';

                if (!isPremium && !isSadmin) {
                    const todayStr = new Date().toDateString();
                    // Đếm đơn hôm nay của cửa hàng (admin + staff của cửa hàng đó)
                    const storeOwner = state.currentUser?.role === 'staff' ? state.currentUser?.createdBy : state.currentUser?.username;
                    const storeUsers = state.USERS
                        .filter(u => u.username === storeOwner || u.createdBy === storeOwner)
                        .map(u => u.username);
                    const totalOrdersToday = state.orders.filter(
                        o => storeUsers.includes(o.createdBy) && new Date(o.time).toDateString() === todayStr
                    ).length;

                    if (totalOrdersToday >= 10) {
                        setTimeout(() => get().showConfirm(
                            'Cửa hàng đã đạt 10 đơn hôm nay (giới hạn Gói Miễn Phí). Bạn có muốn nâng cấp lên bản trả phí để tạo đơn không giới hạn không?',
                            () => get().setUpgradeModalOpen(true)
                        ), 0);
                        return state;
                    }
                }

                const totalAmount = get().getCartTotal();
                const newOrder = {
                    id: `ORD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
                    table: state.selectedTable,
                    items: state.cart.map(item => ({ ...item, isDone: false })),
                    status: 'pending',
                    paymentStatus,
                    time: new Date().toISOString(),
                    totalAmount,
                    createdBy: state.currentUser?.username || 'unknown',
                    storeId: get().getStoreId()
                };
                return {
                    orders: [newOrder, ...state.orders],
                    cart: []
                };
            }),

            // Quản lý Thực Đơn
            updateProduct: (updatedProduct) => set(state => {
                const storeId = state.getStoreId();
                const currentProducts = state.products[storeId] || [];
                return {
                    products: {
                        ...state.products,
                        [storeId]: currentProducts.map(p => p.id === updatedProduct.id ? updatedProduct : p)
                    }
                };
            }),
            deleteProduct: (productId) => set(state => {
                const storeId = state.getStoreId();
                const currentProducts = state.products[storeId] || [];
                return {
                    products: {
                        ...state.products,
                        [storeId]: currentProducts.filter(p => p.id !== productId)
                    }
                };
            }),
            addProduct: (product) => set(state => {
                const storeId = get().getStoreId();
                const currentProducts = state.products[storeId] || [];
                const isPremium = state.currentUser?.isPremium;
                const isSadmin = state.currentUser?.role === 'sadmin';

                if (!isPremium && !isSadmin && currentProducts.length >= 5) {
                    setTimeout(() => get().showConfirm(
                        'Tài khoản Miễn Phí đã đạt giới hạn 5 món ăn. Bạn có muốn nâng cấp lên bản trả phí để thêm không giới hạn không?',
                        () => get().setUpgradeModalOpen(true)
                    ), 0);
                    return state;
                }

                return {
                    products: {
                        ...state.products,
                        [storeId]: [{ ...product, id: Date.now().toString() }, ...currentProducts]
                    }
                };
            }),

            // Quản lý Danh Mục
            addCategory: (categoryName) => set(state => {
                const storeId = get().getStoreId();
                const currentCategories = state.categories[storeId] || [];
                const isPremium = state.currentUser?.isPremium;
                const isSadmin = state.currentUser?.role === 'sadmin';

                if (!isPremium && !isSadmin && currentCategories.length >= 2) {
                    setTimeout(() => get().showConfirm(
                        'Tài khoản Miễn Phí đã đạt giới hạn 2 phân loại. Bạn có muốn nâng cấp lên bản trả phí để thêm không giới hạn không?',
                        () => get().setUpgradeModalOpen(true)
                    ), 0);
                    return state;
                }

                return {
                    categories: {
                        ...state.categories,
                        [storeId]: [...currentCategories, { id: 'cat_' + Date.now().toString(), name: categoryName }]
                    }
                };
            }),
            updateCategory: (updatedCategory) => set(state => {
                const storeId = get().getStoreId();
                const currentCategories = state.categories[storeId] || [];
                return {
                    categories: {
                        ...state.categories,
                        [storeId]: currentCategories.map(c => c.id === updatedCategory.id ? updatedCategory : c)
                    }
                };
            }),
            deleteCategory: (categoryId) => set(state => {
                const storeId = get().getStoreId();
                const currentCategories = state.categories[storeId] || [];
                const currentProducts = state.products[storeId] || [];
                return {
                    categories: {
                        ...state.categories,
                        [storeId]: currentCategories.filter(c => c.id !== categoryId)
                    },
                    products: {
                        ...state.products,
                        [storeId]: currentProducts.map(p => p.category === categoryId ? { ...p, category: '' } : p)
                    }
                };
            }),

            getCartTotal: () => {
                const { cart } = get();
                return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
            }
        }),
        {
            name: 'pos-store-v1', // unique name
            version: 3,
            migrate: (persistedState, version) => {
                if (version < 2) {
                    persistedState.USERS = [
                        { username: 'sadmin', pass: '1', role: 'sadmin', fullname: 'Super Admin', avatar: '', isPremium: true },
                        { username: 'nv1', pass: '1', role: 'staff', fullname: 'Nhân viên 1', avatar: '', createdBy: 'sadmin' }
                    ];
                }
                if (version < 3) {
                    persistedState.categories = { 'sadmin': [{ id: 'main', name: 'Món Chính' }, { id: 'drink', name: 'Đồ Uống' }] };
                    persistedState.products = { 'sadmin': [] };
                }
                return persistedState;
            }
        }
    )
);

// Derived Hook để Reactivity với User và StoreView
export const useStoreId = () => useStore(state => {
    const user = state.currentUser;
    if (!user) return 'sadmin';
    if (user.role === 'sadmin') {
        return state.sadminViewStoreId === 'all' ? 'sadmin' : state.sadminViewStoreId;
    }
    return user.role === 'staff' ? user.createdBy : user.username;
});
