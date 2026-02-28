import React, { useState } from 'react';
import {
    Store,
    MenuSquare,
    Printer,
    DatabaseBackup,
    ChevronRight,
    Save,
    MapPin,
    Phone,
    Image as ImageIcon,
    MonitorSmartphone,
    Moon,
    Sun,
    ChevronLeft,
    LayoutGrid,
    Trash2,
    Users,
    BadgeCheck,
    UserPlus,
    Edit2,
    X
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

const SETTING_MENUS = [
    { id: 'general', name: 'Thông Tin Cửa Hàng', icon: Store, desc: 'Tên quán, địa chỉ, số điện thoại' },
    { id: 'menu', name: 'Quản Lý Thực Đơn', icon: MenuSquare, desc: 'Thêm/sửa món ăn, danh mục' },
    { id: 'tables', name: 'Quản Lý Bàn & Khu Vực', icon: LayoutGrid, desc: 'Thiết lập danh sách bàn Order' },
    { id: 'users', name: 'Quản Lý Nhân Viên', icon: Users, desc: 'Tạo tài khoản, thống kê doanh số', adminOnly: true },
    { id: 'printer', name: 'Máy In & Hoá Đơn', icon: Printer, desc: 'Kết nối máy in bill, in bếp' },
    { id: 'backup', name: 'Lưu Trữ & Phục Hồi', icon: DatabaseBackup, desc: 'Sao lưu dữ liệu đám mây' },
];

function TableManagement({ onBack }) {
    const currentUser = useStore(state => state.currentUser);
    const storeId = currentUser ? (currentUser.role === 'staff' ? currentUser.createdBy : currentUser.username) : 'sadmin';
    const tables = useStore(state => state.storeTables[storeId] || []);
    const addTable = useStore(state => state.addTable);
    const removeTable = useStore(state => state.removeTable);
    const showConfirm = useStore(state => state.showConfirm);
    const [newTable, setNewTable] = useState('');

    const handleAdd = (e) => {
        e.preventDefault();
        if (!newTable.trim()) return;
        addTable(newTable.trim());
        setNewTable('');
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 animate-fade-in max-w-3xl">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[500px]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600 active:scale-95 transition-all">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Quản Lý Bàn</h2>
                            <p className="text-slate-500 text-sm mt-1">Danh sách bàn sẽ đồng bộ sang Order & Giỏ hàng</p>
                        </div>
                    </div>
                </div>

                <div className="p-6">
                    <form onSubmit={handleAdd} className="flex gap-3 mb-6">
                        <input
                            type="text"
                            className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-slate-800"
                            placeholder="Nhập tên bàn mới (VD: Bàn 6, Tầng 2 - Bàn 1)..."
                            value={newTable}
                            onChange={e => setNewTable(e.target.value)}
                        />
                        <button type="submit" className="px-6 py-3 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20 whitespace-nowrap">
                            + Thêm Bàn
                        </button>
                    </form>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {tables.map(table => (
                            <div key={table} className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-500/50 hover:shadow-md transition-all group">
                                <span className="font-bold text-slate-700">{table}</span>
                                <button
                                    onClick={() => showConfirm(`Xóa bàn ${table}?`, () => removeTable(table))}
                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function UserManagement({ onBack }) {
    const USERS = useStore(state => state.USERS);
    const currentUser = useStore(state => state.currentUser);
    const addStaff = useStore(state => state.addStaff);
    const deleteUser = useStore(state => state.deleteUser);
    const updateUser = useStore(state => state.updateUser);
    const orders = useStore(state => state.orders);
    const showConfirm = useStore(state => state.showConfirm);

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ fullname: '', phone: '', username: '', password: '', role: 'staff', createdBy: '' });

    const [editingUsername, setEditingUsername] = useState(null);
    const [editForm, setEditForm] = useState({ fullname: '', phone: '', password: '' });

    const handleAdd = () => {
        if (!form.username || !form.password) return;
        addStaff(form);
        setForm({ fullname: '', phone: '', username: '', password: '', role: 'staff', createdBy: '' });
        setShowForm(false);
    };

    const handleUpdate = () => {
        const payload = { ...editForm };
        if (!payload.isPremium) {
            payload.expiresAt = null;
        }

        // Map đúng trường mật khẩu của DB
        if (payload.password !== undefined) {
            payload.pass = payload.password;
            delete payload.password;
        }

        if (payload.username && payload.username !== editingUsername) {
            const existing = USERS.find(u => u.username === payload.username);
            if (existing) {
                showToast('Tên đăng nhập đã tồn tại!', 'error');
                return;
            }
        }

        updateUser(editingUsername, payload);
        setEditingUsername(null);
    };

    const startEditing = (user) => {
        setEditingUsername(user.username);
        setEditForm({
            username: user.username,
            fullname: user.fullname || '',
            phone: user.phone || '',
            password: user.pass,
            expiresAt: user.expiresAt,
            isPremium: user.isPremium,
            createdBy: user.createdBy || ''
        });
    };

    const getStats = (username) => {
        const userOrders = orders.filter(o => o.createdBy === username);
        const todayStr = new Date().toDateString();
        const todayOrders = userOrders.filter(o => new Date(o.time).toDateString() === todayStr);
        return {
            total: userOrders.length,
            today: todayOrders.length,
            revenue: userOrders.reduce((acc, o) => acc + o.totalAmount, 0)
        };
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 animate-fade-in max-w-5xl">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[500px]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600 active:scale-95 transition-all">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Quản Lý Nhân Viên</h2>
                            <p className="text-slate-500 text-sm mt-1">Quản lý tài khoản Order và xem số KPI đơn hàng</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors shadow-sm flex items-center gap-2"
                    >
                        <UserPlus className="w-4 h-4" />
                        {showForm ? 'Đóng form' : 'Thêm Nhân Viên'}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Add Staff Form */}
                    {showForm && (
                        <form className="bg-slate-50 p-5 border border-slate-200 rounded-xl flex flex-col gap-4 animate-fade-in shadow-sm">
                            <h3 className="font-bold text-slate-800">Tạo Tài Khoản Mới</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {currentUser?.role === 'sadmin' && (
                                    <>
                                        <div className="space-y-1 md:col-span-2">
                                            <label className="text-sm font-semibold text-slate-700 block">Cấp bậc / Quyền hạn *</label>
                                            <select className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 transition-all text-sm font-medium" value={form.role || 'staff'} onChange={e => setForm({ ...form, role: e.target.value, createdBy: e.target.value === 'admin' ? '' : form.createdBy })}>
                                                <option value="staff">Nhân viên thông thường (Staff)</option>
                                                <option value="admin">Quản lý Cửa Hàng (Admin)</option>
                                            </select>
                                        </div>
                                        {form.role !== 'admin' && (
                                            <div className="space-y-1 md:col-span-2">
                                                <label className="text-sm font-semibold text-slate-700 block">Thuộc sự quản lý của (Cửa hàng / Chủ quán) *</label>
                                                <select className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 transition-all text-sm font-medium" value={form.createdBy || ''} onChange={e => setForm({ ...form, createdBy: e.target.value })}>
                                                    <option value="">Trực tiếp bởi SuperAdmin (Hệ thống)</option>
                                                    {USERS.filter(u => u.role === 'admin').map(admin => (
                                                        <option key={admin.username} value={admin.username}>{admin.fullname || admin.username}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}
                                    </>
                                )}
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-700 block">Tên đăng nhập *</label>
                                    <input required className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 transition-all text-sm font-medium" placeholder="VD: nhanvien2" value={form.username} onChange={e => setForm({ ...form, username: e.target.value.toLowerCase().replace(/\s/g, '') })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-700 block">Mật khẩu *</label>
                                    <input required type="password" className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 transition-all text-sm font-medium" placeholder="••••••••" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-700 block">Họ và tên hiển thị</label>
                                    <input className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 transition-all text-sm font-medium" placeholder="Nguyễn Văn B (Tuỳ chọn)" value={form.fullname} onChange={e => setForm({ ...form, fullname: e.target.value })} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-semibold text-slate-700 block">Số điện thoại</label>
                                    <input className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 transition-all text-sm font-medium" placeholder="0987... (Tuỳ chọn)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button type="button" onClick={handleAdd} className="px-6 py-2.5 bg-emerald-500 text-white rounded-lg font-bold hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20">Lưu lại</button>
                            </div>
                        </form>
                    )}

                    {/* Staff List */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {(() => {
                            const displayUsers = currentUser?.role === 'sadmin'
                                ? USERS
                                : USERS.filter(u => u.username === currentUser.username || u.createdBy === currentUser.username);

                            const renderCard = (user, isChild = false, parentAdmin = null) => {
                                const stats = getStats(user.username);
                                return (
                                    <div key={user.username} className={cn("flex flex-col p-4 border border-slate-200 bg-white hover:border-emerald-500/30 transition-all", isChild ? "rounded-xl shadow-sm" : "rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)]")}>
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                {user.avatar ? (
                                                    <img src={user.avatar} className="w-12 h-12 rounded-full object-cover shrink-0 border border-slate-200 bg-slate-50" />
                                                ) : (
                                                    <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-200">
                                                        <span className="font-bold uppercase text-lg">{user.username.charAt(0)}</span>
                                                    </div>
                                                )}
                                                <div>
                                                    <h4 className="font-bold text-slate-800 flex items-center gap-2">
                                                        {user.fullname || user.username}
                                                        {user.role === 'admin' && (
                                                            <>
                                                                <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Admin</span>
                                                                {user.isPremium ? (
                                                                    <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full tracking-wider font-bold shadow-sm shadow-amber-500/20">VIP 💎</span>
                                                                ) : (
                                                                    <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Thường</span>
                                                                )}
                                                            </>
                                                        )}
                                                        {user.role === 'sadmin' && <span className="bg-violet-100 text-violet-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">SuperAdmin</span>}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 mt-0.5 font-medium flex items-center gap-1">@{user.username}</p>

                                                    {user.role === 'admin' && (
                                                        <span className="bg-violet-50 text-violet-600 border border-violet-100 text-[10px] px-2 py-0.5 rounded-full inline-block mt-1.5 font-semibold">Cửa Hàng Quản Lý</span>
                                                    )}
                                                    {user.role === 'staff' && user.createdBy && user.createdBy !== 'sadmin' && (
                                                        <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] px-2 py-0.5 rounded-full inline-block mt-1.5 font-semibold">
                                                            Nhân viên của: {USERS.find(u => u.username === user.createdBy)?.fullname || user.createdBy}
                                                        </span>
                                                    )}
                                                    {user.role === 'staff' && (!user.createdBy || user.createdBy === 'sadmin') && (
                                                        <span className="bg-slate-100 text-slate-500 border border-slate-200 text-[10px] px-2 py-0.5 rounded-full inline-block mt-1.5 font-semibold">
                                                            Nhân viên Trực Thuộc Hệ Thống
                                                        </span>
                                                    )}

                                                    {user.role === 'admin' && currentUser?.role === 'sadmin' && (
                                                        <div className="mt-1.5">
                                                            {user.expiresAt ? (() => {
                                                                const isExpired = Date.now() > new Date(user.expiresAt).getTime();
                                                                const daysLeft = Math.ceil((new Date(user.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                                                                return isExpired ? (
                                                                    <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full inline-block font-semibold border border-red-200 shadow-sm shadow-red-500/10">❌ Hết Hạn License</span>
                                                                ) : (
                                                                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full inline-block font-semibold border shadow-sm", daysLeft <= 7 ? "bg-orange-50 text-orange-600 border-orange-200" : "bg-emerald-50 text-emerald-600 border-emerald-200")}>
                                                                        Thời hạn: {new Date(user.expiresAt).toLocaleDateString('vi-VN')} (còn {daysLeft} ngày)
                                                                    </span>
                                                                );
                                                            })() : (
                                                                <span className="bg-slate-100 text-slate-500 text-[10px] px-2 py-0.5 rounded-full inline-block font-semibold border border-slate-200">💎 Vĩnh viễn (Chưa thiết lập)</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Logic Quyền Trợ Giúp: Sadmin xoá tất. Admin chỉ xoá Staff. Ai cũng có thể tự sửa mình */}
                                            {((currentUser?.role === 'sadmin') ||
                                                (currentUser?.role === 'admin' && user.role !== 'sadmin' && user.role !== 'admin') ||
                                                (currentUser?.username === user.username)) && (
                                                    <div className="flex items-center gap-1">
                                                        <button onClick={() => startEditing(user)} className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-colors" title="Chỉnh sửa thông tin">
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        {/* Ngăn không cho xoá chính mình */}
                                                        {(currentUser?.username !== user.username) && (
                                                            <button onClick={() => showConfirm('Xoá nhân viên này?', () => deleteUser(user.username))} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="Xóa nhân viên">
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                        </div>

                                        {/* Edit Form Inline */}
                                        {editingUsername === user.username && (
                                            <form className="bg-slate-50 p-4 border border-slate-200 rounded-xl mb-4 flex flex-col gap-3 animate-fade-in relative z-10 transition-all shadow-md">
                                                <button type="button" onClick={() => setEditingUsername(null)} className="absolute top-2 right-2 p-1 text-slate-400 hover:text-slate-600 bg-white rounded-md shadow-sm border border-slate-100 transition-colors">
                                                    <X className="w-4 h-4" />
                                                </button>
                                                <h5 className="font-semibold text-sm text-slate-800">Cập nhật tài khoản</h5>
                                                <div className="grid grid-cols-1 gap-3">
                                                    {user.role === 'staff' && (
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-semibold text-slate-700 block">Tên đăng nhập mới</label>
                                                            <input required type="text" className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 transition-all text-sm font-medium" placeholder="VD: nhanvien2" value={editForm.username || ''} onChange={e => setEditForm(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/\s/g, '') }))} />
                                                        </div>
                                                    )}
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-slate-700 block">Mật khẩu (Hiện tại hoặc Mới)</label>
                                                        <input required type="password" minLength={1} className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 transition-all text-sm font-medium" placeholder="Nhập để xác nhận/thay đổi" value={editForm.password || ''} onChange={e => setEditForm(prev => ({ ...prev, password: e.target.value }))} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-slate-700 block">Họ và tên hiển thị</label>
                                                        <input className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 transition-all text-sm font-medium" placeholder="Tên để in order" value={editForm.fullname || ''} onChange={e => setEditForm(prev => ({ ...prev, fullname: e.target.value }))} />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-xs font-semibold text-slate-700 block">Số điện thoại liên hệ</label>
                                                        <input className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 transition-all text-sm font-medium" placeholder="SDT Cá nhân" value={editForm.phone || ''} onChange={e => setEditForm(prev => ({ ...prev, phone: e.target.value }))} />
                                                    </div>
                                                    {user.role === 'staff' && currentUser?.role === 'sadmin' && (
                                                        <div className="space-y-1">
                                                            <label className="text-xs font-semibold text-slate-700 block">Thuộc Cửa Hàng Quản Lý</label>
                                                            <select className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none focus:border-emerald-500 transition-all text-sm font-medium" value={editForm.createdBy || ''} onChange={e => setEditForm(prev => ({ ...prev, createdBy: e.target.value }))}>
                                                                <option value="">Hệ thống Gốc (Sadmin)</option>
                                                                {USERS.filter(u => u.role === 'admin').map(admin => (
                                                                    <option key={admin.username} value={admin.username}>{admin.fullname || admin.username}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    )}
                                                    {user.role === 'admin' && currentUser?.role === 'sadmin' && (
                                                        <>
                                                            <div className="space-y-1">
                                                                <label className="text-xs font-semibold text-violet-600 flex items-center gap-2 cursor-pointer mt-2 mb-1">
                                                                    <input type="checkbox" checked={editForm.isPremium || false} onChange={e => setEditForm(prev => ({ ...prev, isPremium: e.target.checked }))} className="w-4 h-4 cursor-pointer accent-violet-600 rounded" />
                                                                    Tài khoản Premium (VIP)
                                                                </label>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <label className="text-xs font-semibold text-violet-600 block">🔥 Ngày hết hạn License (Sadmin Only)</label>
                                                                <input type="date" className="w-full p-2.5 bg-violet-50/50 border border-violet-200 rounded-lg outline-none focus:border-violet-500 transition-all text-sm font-semibold text-violet-700" value={editForm.expiresAt ? new Date(editForm.expiresAt).toISOString().split('T')[0] : ''} onChange={e => setEditForm(prev => ({ ...prev, expiresAt: e.target.value ? new Date(e.target.value).toISOString() : null }))} />
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                                <div className="flex justify-end mt-2 gap-2">
                                                    <button type="button" onClick={() => setEditingUsername(null)} className="px-4 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg font-bold hover:bg-slate-200 transition-colors active:scale-95">Huỷ thay đổi</button>
                                                    <button type="button" onClick={handleUpdate} className="px-4 py-2 bg-emerald-500 text-white text-sm rounded-lg font-bold hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20 active:scale-95">Lưu thay đổi</button>
                                                </div>
                                            </form>
                                        )}

                                        <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3 border border-slate-100 mt-auto">
                                            <div className="flex flex-col items-center justify-center p-2">
                                                <span className="text-lg font-bold text-emerald-600">{stats.today}</span>
                                                <span className="text-[10px] text-slate-500 font-semibold uppercase text-center mt-1">Đơn hôm nay</span>
                                            </div>
                                            <div className="flex flex-col items-center justify-center p-2 border-l border-r border-slate-200">
                                                <span className="text-lg font-bold text-slate-700">{stats.total}</span>
                                                <span className="text-[10px] text-slate-500 font-semibold uppercase text-center mt-1">Tổng số đơn</span>
                                            </div>
                                            <div className="flex flex-col items-center justify-center p-2">
                                                <span className="text-sm font-bold text-blue-600">{(stats.revenue / 1000).toFixed(0)}k</span>
                                                <span className="text-[10px] text-slate-500 font-semibold uppercase text-center mt-1">Doanh số</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            };

                            const sadmins = displayUsers.filter(u => u.role === 'sadmin');
                            const admins = displayUsers.filter(u => u.role === 'admin');
                            const allStaffs = displayUsers.filter(u => u.role === 'staff');

                            if (currentUser?.role === 'sadmin') {
                                return sadmins.map(sadmin => {
                                    const mySadminStaffs = allStaffs.filter(u => u.createdBy === sadmin.username);
                                    return (
                                        <div key={sadmin.username} className="flex flex-col gap-3">
                                            {/* Render Cấp 1: Super Admin */}
                                            {renderCard(sadmin)}

                                            {(admins.length > 0 || mySadminStaffs.length > 0) && (
                                                <div className="ml-6 md:ml-8 pl-4 border-l-2 border-violet-200 flex flex-col gap-3 relative">
                                                    {mySadminStaffs.map(staff => (
                                                        <div key={staff.username} className="relative flex flex-col gap-3">
                                                            <span className="absolute -left-4 top-10 w-4 border-t-2 border-violet-200"></span>
                                                            {/* Render Cấp 1.5: Sadmin's direct staffs */}
                                                            {renderCard(staff, true, sadmin)}
                                                        </div>
                                                    ))}
                                                    {admins.map(admin => {
                                                        const myStaffs = allStaffs.filter(u => u.createdBy === admin.username || (!u.createdBy && admin.role === 'admin'));
                                                        return (
                                                            <div key={admin.username} className="relative flex flex-col gap-3">
                                                                <span className="absolute -left-4 top-10 w-4 border-t-2 border-violet-200"></span>
                                                                {/* Render Cấp 2: Admin */}
                                                                {renderCard(admin, true, sadmin)}

                                                                {myStaffs.length > 0 && (
                                                                    <div className="ml-6 md:ml-8 pl-4 border-l-2 border-slate-200 flex flex-col gap-3 relative">
                                                                        {myStaffs.map(staff => (
                                                                            <div key={staff.username} className="relative">
                                                                                <span className="absolute -left-4 top-10 w-4 border-t-2 border-slate-200"></span>
                                                                                {/* Render Cấp 3: Staff */}
                                                                                {renderCard(staff, true, admin)}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    );
                                });
                            } else {
                                // Fallback cho màn hình của Admin nhìn xuống Staff
                                return admins.filter(u => u.username === currentUser?.username).map(admin => {
                                    const myStaffs = allStaffs.filter(u => u.createdBy === admin.username || (!u.createdBy && admin.role === 'admin'));
                                    return (
                                        <div key={admin.username} className="flex flex-col gap-3">
                                            {renderCard(admin)}
                                            {myStaffs.length > 0 && (
                                                <div className="ml-6 md:ml-12 pl-4 md:pl-6 border-l-2 border-slate-200 flex flex-col gap-3 relative">
                                                    {myStaffs.map(staff => (
                                                        <div key={staff.username} className="relative">
                                                            <span className="absolute -left-4 md:-left-6 top-10 w-4 md:w-6 border-t-2 border-slate-200"></span>
                                                            {renderCard(staff, true, admin)}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                });
                            }
                        })()}
                    </div>
                </div>
            </div>
        </div>
    );
}

function MenuManagement({ onBack }) {
    const products = useStore(state => state.products);
    const deleteProduct = useStore(state => state.deleteProduct);
    const updateProduct = useStore(state => state.updateProduct);
    const addProduct = useStore(state => state.addProduct);
    const categories = useStore(state => state.categories);
    const showConfirm = useStore(state => state.showConfirm);
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    const handleEdit = (p) => {
        setEditingId(p.id);
        setEditForm(p);
    };

    const handleSave = () => {
        if (editingId === 'new') {
            addProduct(editForm);
        } else {
            updateProduct(editForm);
        }
        setEditingId(null);
    };

    return (
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 animate-fade-in max-w-5xl">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full min-h-[500px]">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600 active:scale-95 transition-all">
                            <ChevronLeft className="w-6 h-6" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Quản Lý Thực Đơn</h2>
                            <p className="text-slate-500 text-sm mt-1">Thêm, sửa, xoá và cập nhật trạng thái món ăn</p>
                        </div>
                    </div>
                    <button onClick={() => { setEditingId('new'); setEditForm({ name: '', price: 0, image: '', category: 'main', isOutofStock: false }); }} className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors shadow-sm">
                        + Thêm Món
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {/* Render Edit Form if editing */}
                    {editingId && (
                        <div className="bg-slate-50 p-4 border border-slate-200 rounded-xl mb-6 flex flex-col gap-4 animate-fade-in shadow-sm">
                            <h3 className="font-bold text-slate-800">{editingId === 'new' ? 'Thêm Món Mới' : 'Cập Nhật Món Ăn'}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input className="p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-slate-800" placeholder="Tên món" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                                <input type="text" className="p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-slate-800" placeholder="Giá tiền" value={editForm.price ? editForm.price.toLocaleString() : ''} onChange={e => setEditForm({ ...editForm, price: Number(e.target.value.replace(/\D/g, '')) })} />
                                <div className="flex items-center gap-3 bg-white border border-slate-200 p-2 rounded-xl">
                                    {editForm.image ? (
                                        <img src={editForm.image} className="w-12 h-12 rounded-lg object-cover bg-slate-100" />
                                    ) : (
                                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                                            <ImageIcon className="w-5 h-5" />
                                        </div>
                                    )}
                                    <div className="flex-1 relative cursor-pointer">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={e => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        setEditForm({ ...editForm, image: reader.result });
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                        <div className="px-3 py-2 bg-slate-50 text-slate-600 font-semibold text-sm rounded-lg text-center button-hover">
                                            Chọn Ảnh Món Ăn
                                        </div>
                                    </div>
                                </div>
                                <select className="p-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-slate-800" value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })}>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer bg-white p-3 rounded-xl border border-slate-200 select-none">
                                    <input type="checkbox" checked={editForm.isOutofStock || false} onChange={e => setEditForm({ ...editForm, isOutofStock: e.target.checked })} className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500 border-slate-300" />
                                    Đánh dấu Hết Hàng
                                </label>
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 cursor-pointer bg-white p-3 rounded-xl border border-slate-200 select-none">
                                    <input type="checkbox" checked={editForm.isHot || false} onChange={e => setEditForm({ ...editForm, isHot: e.target.checked })} className="w-5 h-5 text-red-500 rounded focus:ring-red-500 border-slate-300" />
                                    Đánh dấu Món HOT (🔥)
                                </label>
                            </div>
                            <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-slate-200">
                                <button onClick={() => setEditingId(null)} className="px-5 py-2 hover:bg-slate-200 rounded-xl font-semibold text-slate-600 transition-colors">Huỷ</button>
                                <button onClick={handleSave} className="px-5 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 transition-colors shadow-md shadow-emerald-500/20 flex items-center gap-2">Lưu lại</button>
                            </div>
                        </div>
                    )}

                    {/* Product List */}
                    <div className="grid grid-cols-1 gap-3">
                        {products.map(p => (
                            <div key={p.id} className={cn("flex items-center gap-4 p-3 border rounded-xl bg-white transition-all hover:shadow-sm", p.isOutofStock ? "border-red-200 bg-red-50/30" : "border-slate-100")}>
                                <img src={p.image} className={cn("w-14 h-14 rounded-lg object-cover bg-slate-100", p.isOutofStock && "grayscale opacity-50")} alt={p.name} />
                                <div className="flex-1">
                                    <h4 className="font-semibold text-slate-800 flex items-center gap-2 text-lg">
                                        {p.name}
                                        {p.isHot && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">🔥 HOT</span>}
                                        {p.isOutofStock && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold">Đã hết hàng</span>}
                                    </h4>
                                    <p className="text-sm text-emerald-600 font-bold mt-0.5">{p.price.toLocaleString()}đ</p>
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button onClick={() => handleEdit(p)} className="px-4 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-sm font-bold">Sửa</button>
                                    <button onClick={() => showConfirm('Chắc chắn xoá món này?', () => deleteProduct(p.id))} className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors text-sm font-bold">Xoá</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function SettingsPage() {
    const [activeMenu, setActiveMenu] = useState('general');
    const [isMobileDetailOpen, setIsMobileDetailOpen] = useState(false);
    const theme = useStore(state => state.theme);
    const toggleTheme = useStore(state => state.toggleTheme);
    const showToast = useStore(state => state.showToast);
    const currentUser = useStore(state => state.currentUser);
    const storeId = currentUser ? (currentUser.role === 'staff' ? currentUser.createdBy : currentUser.username) : 'sadmin';
    const storeInfo = useStore(state => state.storeInfos[storeId] || state.storeInfos['sadmin'] || {});
    const updateStoreInfo = useStore(state => state.updateStoreInfo);

    const [generalForm, setGeneralForm] = useState(storeInfo);

    const handleSaveGeneral = () => {
        updateStoreInfo(generalForm);
        showToast('Lưu cài đặt thành công!');
        setIsMobileDetailOpen(false);
    };

    return (
        <div className="flex h-full bg-slate-50 animate-fade-in relative">
            {/* Sidebar Settings (Desktop) */}
            <div className={cn(
                "w-full md:w-80 lg:w-96 border-r border-slate-200 bg-white h-full flex flex-col absolute md:static z-20 transition-transform duration-300",
                isMobileDetailOpen ? "-translate-x-full md:translate-x-0 hidden md:flex" : "flex"
            )}>
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Cài Đặt</h1>
                        <p className="text-slate-500 mt-1 text-sm">Quản lý cấu hình hệ thống</p>
                    </div>
                    <button
                        onClick={toggleTheme}
                        title="Đổi Giao Diện Sáng / Tối"
                        className={cn("p-2.5 rounded-xl transition-all border outline-none active:scale-95", theme === 'dark' ? "bg-slate-800 border-slate-700 text-yellow-400 hover:bg-slate-700 shadow-inner" : "bg-white border-slate-200 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 shadow-sm")}
                    >
                        {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {SETTING_MENUS.filter(menu => !menu.adminOnly || ['admin', 'sadmin'].includes(currentUser?.role)).map(menu => (
                        <button
                            key={menu.id}
                            onClick={() => { setActiveMenu(menu.id); setIsMobileDetailOpen(true); }}
                            className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-xl transition-all text-left group",
                                activeMenu === menu.id
                                    ? "bg-slate-800 text-white shadow-lg shadow-slate-800/20"
                                    : "hover:bg-slate-50 text-slate-700 bg-white border border-transparent hover:border-slate-200"
                            )}
                        >
                            <div className={cn("p-2 rounded-lg transition-colors", activeMenu === menu.id ? "bg-white/20" : "bg-slate-100 text-slate-500 group-hover:bg-white group-hover:text-emerald-500 group-hover:shadow-sm")}>
                                <menu.icon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold">{menu.name}</h3>
                                <p className={cn("text-xs mt-0.5", activeMenu === menu.id ? "text-slate-300" : "text-slate-500")}>
                                    {menu.desc}
                                </p>
                            </div>
                            <ChevronRight className={cn("w-5 h-5 transition-transform", activeMenu === menu.id ? "text-slate-400 translate-x-1" : "text-slate-300")} />
                        </button>
                    ))}
                </div>
            </div>

            {/* Setting Detail Area */}
            <div className={cn(
                "flex-1 flex-col h-full overflow-hidden bg-slate-50/50 absolute inset-0 md:static z-30",
                isMobileDetailOpen ? "flex" : "hidden md:flex"
            )}>
                {activeMenu === 'general' && (
                    <div className="flex-1 overflow-y-auto p-6 lg:p-10 animate-fade-in max-w-3xl">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
                            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                                <button onClick={() => setIsMobileDetailOpen(false)} className="md:hidden p-2 -ml-2 text-slate-400 hover:text-slate-600 active:scale-95 transition-all">
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                                    <Store className="w-8 h-8" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-800">Thông Tin Cửa Hàng</h2>
                                    <p className="text-slate-500 text-sm">Cập nhật thông tin hiển thị trên bill và máy pos</p>
                                </div>
                            </div>

                            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                                {/* Logo Upload Mock */}
                                <div className="flex items-center gap-6">
                                    <div className="w-24 h-24 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-colors cursor-pointer bg-slate-50 relative overflow-hidden group">
                                        <input
                                            type="file"
                                            accept="image/*, image/gif"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                            onChange={e => {
                                                const file = e.target.files[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onload = () => {
                                                        const img = document.getElementById('store-logo-preview');
                                                        if (img) {
                                                            img.src = reader.result;
                                                            img.classList.remove('hidden');
                                                        }
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                        <img id="store-logo-preview" className="absolute inset-0 w-full h-full object-cover hidden z-0 bg-white" />
                                        <ImageIcon className="w-6 h-6 mb-1 relative z-0 group-hover:scale-110 transition-transform bg-white rounded-full" />
                                        <span className="text-xs font-medium relative z-0 bg-white px-1 rounded">Tải Logo</span>
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-slate-800">Logo Quán</h4>
                                        <p className="text-sm text-slate-500 mt-1">Nên dùng ảnh vuông nền trong suốt PNG/GIF</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Tên Cửa Hàng</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Store className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <input type="text" value={generalForm.name} onChange={e => setGeneralForm({ ...generalForm, name: e.target.value })} className="w-full pl-10 h-11 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-800 font-medium" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-700">Số Điện Thoại</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Phone className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <input type="text" value={generalForm.phone} onChange={e => setGeneralForm({ ...generalForm, phone: e.target.value })} className="w-full pl-10 h-11 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-800 font-medium" />
                                        </div>
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-sm font-semibold text-slate-700">Địa Chỉ</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 top-3 pointer-events-none">
                                                <MapPin className="w-5 h-5 text-slate-400" />
                                            </div>
                                            <textarea value={generalForm.address} onChange={e => setGeneralForm({ ...generalForm, address: e.target.value })} className="w-full pl-10 py-3 min-h-[100px] bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-800 font-medium resize-none" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100">
                                    <h3 className="text-lg font-bold text-slate-800 mb-4">Thông Tin Thanh Toán (VietQR)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Tên Ngân Hàng (VD: VCB, MB, TCB...)</label>
                                            <input type="text" value={generalForm.bankId} onChange={e => setGeneralForm({ ...generalForm, bankId: e.target.value })} placeholder="Mã định danh ngân hàng" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-800 font-medium uppercase" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-sm font-semibold text-slate-700">Số Tài Khoản</label>
                                            <input type="text" value={generalForm.bankAccount} onChange={e => setGeneralForm({ ...generalForm, bankAccount: e.target.value })} placeholder="VD: 0123456789" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-800 font-medium" />
                                        </div>
                                        <div className="space-y-2 md:col-span-2">
                                            <label className="text-sm font-semibold text-slate-700">Tên Chủ Tài Khoản</label>
                                            <input type="text" value={generalForm.bankOwner} onChange={e => setGeneralForm({ ...generalForm, bankOwner: e.target.value.toUpperCase() })} placeholder="VD: NGUYEN VAN A" className="w-full h-11 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-800 font-medium" />
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
                                    <button onClick={() => setIsMobileDetailOpen(false)} type="button" className="px-6 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors">
                                        Huỷ
                                    </button>
                                    <button onClick={handleSaveGeneral} type="button" className="px-6 py-2.5 rounded-xl font-semibold bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 flex items-center gap-2 transition-transform active:scale-95">
                                        <Save className="w-5 h-5" />
                                        Lưu Thay Đổi
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {activeMenu === 'menu' && <MenuManagement onBack={() => setIsMobileDetailOpen(false)} />}

                {activeMenu === 'tables' && <TableManagement onBack={() => setIsMobileDetailOpen(false)} />}

                {activeMenu === 'users' && <UserManagement onBack={() => setIsMobileDetailOpen(false)} />}

                {activeMenu !== 'general' && activeMenu !== 'menu' && activeMenu !== 'tables' && activeMenu !== 'users' && (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 text-slate-400 animate-fade-in">
                        <Store className="w-20 h-20 mb-4 opacity-20" />
                        <h3 className="text-lg font-medium text-slate-500">Chức năng này đang được phát triển</h3>
                        <p className="text-sm mt-2 text-center max-w-sm">Tính năng {SETTING_MENUS.find(m => m.id === activeMenu)?.name} sẽ có mặt trong phiên bản cập nhật tiếp theo.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
