import { useStore, useStoreId } from '../store/useStore';

/**
 * Hook trả về 2 con số dùng làm badge trên icon Bếp:
 *  - pendingKitchen : số đơn hàng đang "pending" (bếp chưa làm xong)
 *  - unpaidTables   : số bàn/đơn còn paymentStatus === 'unpaid'
 *
 * Chỉ tính trong phạm vi cửa hàng của user đang đăng nhập.
 */
export function useKitchenBadges() {
    const storeId = useStoreId();
    const currentUser = useStore(state => state.currentUser);
    const USERS = useStore(state => state.USERS);
    const orders = useStore(state => state.orders);

    // Lấy danh sách username thuộc cửa hàng hiện tại
    const storeUsernames = (() => {
        if (!currentUser) return [];

        // sadmin xem tất cả  đơn (hoặc xem theo store đang chọn)
        if (currentUser.role === 'sadmin') {
            if (storeId === 'sadmin') {
                // Đang ở chế độ "all" → nhìn thấy tất cả
                return USERS.map(u => u.username);
            }
            // Đang xem 1 cửa hàng cụ thể
            return USERS
                .filter(u => u.username === storeId || u.createdBy === storeId)
                .map(u => u.username);
        }

        // Admin: tính theo chính mình + nhân viên trực thuộc
        const owner = currentUser.role === 'staff' ? currentUser.createdBy : currentUser.username;
        return USERS
            .filter(u => u.username === owner || u.createdBy === owner)
            .map(u => u.username);
    })();

    // Lọc đơn của cửa hàng
    const storeOrders = orders.filter(o => storeUsernames.includes(o.createdBy));

    // Badge đỏ: đơn mới chốt, bếp chưa bấm nấu
    const pendingKitchen = storeOrders.filter(o => o.status === 'pending').length;

    // Badge cam: bếp đang nấu (không phân biệt đã thanh toán hay chưa)
    const unpaidTables = storeOrders.filter(o => o.status === 'cooking').length;

    return { pendingKitchen, unpaidTables };
}
