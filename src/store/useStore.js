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
                const user = get().currentUser;
                if (!user) return 'sadmin';
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

                const user = get().USERS.find(u => u.username === username && u.pass === pass);
                if (user) {
                    // Check Hạn Sử Dụng (License) cho Admin
                    if (user.role === 'admin' && user.expiresAt) {
                        const isExpired = Date.now() > new Date(user.expiresAt).getTime();
                        if (isExpired) return 'expired';
                    }
                    // Nếu Staff đăng nhập, kiểm tra xem Cửa Hàng (Admin quản lý) có bị hết hạn không
                    if (user.role === 'staff' && user.createdBy) {
                        const parentAdmin = get().USERS.find(u => u.username === user.createdBy);
                        if (parentAdmin && parentAdmin.expiresAt) {
                            const isParentExpired = Date.now() > new Date(parentAdmin.expiresAt).getTime();
                            if (isParentExpired) return 'parent_expired';
                        }
                    }

                    set({ currentUser: user });
                    get().cleanupStoreData();
                    return 'success';
                }
                return 'invalid';
            },
            register: ({ fullname, phone, storeName, username, password }) => {
                // Khởi tạo expiresAt = null (hoặc thiết lập +14 ngày dùng thử nếu có logic sau này)
                const newUser = { username, pass: password, role: 'admin', fullname, phone, expiresAt: null, isPremium: false };
                set(state => ({
                    USERS: [...state.USERS, newUser],
                    currentUser: newUser,
                    storeInfo: {
                        ...state.storeInfo,
                        name: storeName || state.storeInfo.name,
                        phone: phone || state.storeInfo.phone,
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
                const currentStaffCount = state.USERS.filter(u => u.role !== 'admin' && u.role !== 'sadmin').length;
                if (!isSuperAdmin && currentStaffCount >= 1) {
                    state.showToast('Gói Miễn phí giới hạn tối đa 1 nhân viên. Vui lòng xoá tài khoản nhân viên cũ để tạo mới!', 'error');
                    return state;
                }
                if (state.USERS.find(u => u.username === username)) {
                    state.showToast('Tên đăng nhập đã tồn tại', 'error');
                    return state;
                }
                const newStaff = { username, pass: password, role: role, isPremium: false, fullname, phone, avatar: '', createdBy: createdBy || state.currentUser?.username };
                state.showToast('Thêm tài khoản thành công!');
                return { USERS: [...state.USERS, newStaff] };
            }),
            updateUser: (username, updatedData) => set(state => {
                const updatedUsers = state.USERS.map(u =>
                    u.username === username ? { ...u, ...updatedData } : u
                );
                state.showToast('Cập nhật tài khoản thành công!');
                // Nếu đang update chính mình, cập nhật luôn session currentUser
                const isSelf = state.currentUser?.username === username;
                return {
                    USERS: updatedUsers,
                    currentUser: isSelf ? { ...state.currentUser, ...updatedData } : state.currentUser
                };
            }),
            deleteUser: (username) => set(state => {
                state.showToast(`Đã xoá nhân viên ${username}`);
                return { USERS: state.USERS.filter(u => u.username !== username) };
            }),

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

                // Sync về storeInfo nếu là Cửa hàng duy nhất (để Trigger hàm cleanup không xoá DB)
                const isNeedToSyncStoreInfo = currentUserObj.role === 'admin';

                return {
                    USERS: newUsers,
                    currentUser: isSelf ? updatedUser : state.currentUser,
                    storeInfo: isNeedToSyncStoreInfo ? { ...state.storeInfo, isPremium: true } : state.storeInfo,
                    upgradeRequests: state.upgradeRequests.filter(r => r.id !== requestId)
                };
            }),
            rejectUpgrade: (requestId) => set(state => {
                state.showToast('Đã từ chối yêu cầu Nâng cấp', 'error');
                return { upgradeRequests: state.upgradeRequests.filter(r => r.id !== requestId) };
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

            categories: [],
            products: [],
            bestSellers: [],
            cart: [],
            orders: [],
            selectedCategory: 'all',
            searchQuery: '',
            selectedTable: 'Mang về',
            setSelectedTable: (table) => set({ selectedTable: table }),
            theme: 'light',
            toast: null,

            showToast: (message, type = 'success') => {
                set({ toast: { message, type } });
                setTimeout(() => {
                    set(state => state.toast?.message === message ? { toast: null } : state);
                }, 3000);
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

                // Check giới hạn 10 đơn/ngày cho mỗi user
                const todayStr = new Date().toDateString();
                const totalOrdersToday = state.orders.filter(
                    o => o.createdBy === state.currentUser?.username && new Date(o.time).toDateString() === todayStr
                ).length;

                if (totalOrdersToday >= 10) {
                    state.showToast('Bạn đã đạt giới hạn 10 đơn/ngày của Gói cơ bản', 'error');
                    return state;
                }

                const totalAmount = state.getCartTotal(); // Bỏ VAT
                const newOrder = {
                    id: `ORD-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
                    table: state.selectedTable,
                    items: state.cart.map(item => ({ ...item, isDone: false })),
                    status: 'pending',
                    paymentStatus,
                    time: new Date().toISOString(),
                    totalAmount,
                    createdBy: state.currentUser?.username || 'unknown',
                    storeId: state.getStoreId()
                };
                return {
                    orders: [newOrder, ...state.orders],
                    cart: []
                };
            }),

            // Quản lý Thực Đơn
            updateProduct: (updatedProduct) => set(state => ({
                products: state.products.map(p => p.id === updatedProduct.id ? updatedProduct : p)
            })),
            deleteProduct: (productId) => set(state => ({
                products: state.products.filter(p => p.id !== productId)
            })),
            addProduct: (product) => set(state => ({
                products: [{ ...product, id: Date.now() }, ...state.products]
            })),

            getCartTotal: () => {
                const { cart } = get();
                return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
            }
        }),
        {
            name: 'pos-store-v1', // unique name
            version: 2,
            migrate: (persistedState, version) => {
                if (version !== 2) {
                    persistedState.USERS = [
                        { username: 'sadmin', pass: '1', role: 'sadmin', fullname: 'Super Admin', avatar: '', isPremium: true },
                        { username: 'nv1', pass: '1', role: 'staff', fullname: 'Nhân viên 1', avatar: '', createdBy: 'sadmin' }
                    ];
                }
                return persistedState;
            }
        }
    )
);
