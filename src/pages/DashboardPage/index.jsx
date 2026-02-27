import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line
} from 'recharts';
import { useStore } from '../../store/useStore';
import { formatCurrency } from '../../utils/format';
import {
    TrendingUp,
    Users,
    ShoppingBag,
    ArrowUpRight,
    ArrowDownRight,
    CalendarDays,
    BadgeCheck
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
    return twMerge(clsx(inputs));
}

// Mock Data
const revenueData = [
    { name: 'T2', total: 4500000 },
    { name: 'T3', total: 5200000 },
    { name: 'T4', total: 4800000 },
    { name: 'T5', total: 6100000 },
    { name: 'T6', total: 7500000 },
    { name: 'T7', total: 9800000 },
    { name: 'CN', total: 8900000 },
];

const bestSellers = [
    { id: 1, name: 'Phở Bò Đặc Biệt', sold: 342, revenue: 22230000 },
    { id: 2, name: 'Bún Chả Hà Nội', sold: 289, revenue: 17340000 },
    { id: 3, name: 'Cơm Tấm Sườn Bì', sold: 256, revenue: 14080000 },
];


const TIME_RANGES = [
    { id: 'today', label: 'Hôm nay' },
    { id: 'month', label: 'Tháng này' },
    { id: 'year', label: 'Năm nay' },
];

export default function DashboardPage() {
    const orders = useStore(state => state.orders);
    const currentUser = useStore(state => state.currentUser);
    const storeId = currentUser ? (currentUser.role === 'staff' ? currentUser.createdBy : currentUser.username) : 'sadmin';
    const currentUser = useStore(state => state.currentUser);
    const USERS = useStore(state => state.USERS);
    const [timeRange, setTimeRange] = useState('today');
    const [customDate, setCustomDate] = useState(new Date().toISOString().split('T')[0]);
    const [activeModal, setActiveModal] = useState(null);

    let targetDateStr = new Date().toDateString();
    if (timeRange === 'custom') {
        targetDateStr = new Date(customDate).toDateString();
    }
    // Dashboard tính doanh thu dựa trên các đơn đã Hoàn Thành (completed) OR Đã Trả Tiền (paid)
    // Và phải lọc đúng đơn của Quán (ngoại trừ Sadmin)
    const currentFilteredOrders = React.useMemo(() => {
        return orders.filter(o => {
            const isDateMatch = new Date(o.time).toDateString() === targetDateStr;
            const isStatusMatch = o.status === 'completed' || o.paymentStatus === 'paid';
            const isStoreMatch = currentUser?.role === 'sadmin' ? true : (o.storeId === storeId || !o.storeId);
            return isDateMatch && isStatusMatch && isStoreMatch;
        });
    }, [orders, targetDateStr, currentUser, storeId]);

    const revenueByTable = currentFilteredOrders.reduce((acc, order) => {
        if (!acc[order.table]) acc[order.table] = { count: 0, total: 0 };
        acc[order.table].count += 1;
        acc[order.table].total += order.totalAmount || 0;
        return acc;
    }, {});

    const getStatsByTimeRange = (range) => {
        const extraRevenue = currentFilteredOrders.reduce((acc, o) => acc + (o.totalAmount || 0), 0);
        const extraOrders = currentFilteredOrders.length;
        const extraCustomers = extraOrders * 2;

        const baseStats = {
            today: { revenue: 8900000 + (range === 'today' ? extraRevenue : 0), orders: 145 + (range === 'today' ? extraOrders : 0), customers: 342 + (range === 'today' ? extraCustomers : 0), trend: 12.5 },
            month: { revenue: 245000000 + extraRevenue, orders: 4250 + extraOrders, customers: 9800 + extraCustomers, trend: 8.2 },
            year: { revenue: 3150000000 + extraRevenue, orders: 52000 + extraOrders, customers: 115000 + extraCustomers, trend: 15.4 },
            custom: { revenue: extraRevenue, orders: extraOrders, customers: extraCustomers, trend: 0 },
        };
        const data = baseStats[range] || baseStats.today;

        let revenueLabel = 'Doanh thu hôm nay';
        if (range === 'month') revenueLabel = 'Doanh thu tháng';
        if (range === 'year') revenueLabel = 'Doanh thu năm';
        if (range === 'custom') revenueLabel = 'Doanh thu tuỳ chọn';

        return [
            { label: revenueLabel, value: data.revenue, trend: data.trend, isUp: true, icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            { label: 'Tổng số đơn', value: data.orders, trend: data.trend - 4.3, isUp: true, icon: ShoppingBag, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Khách hàng', value: data.customers, trend: data.trend - 14.9, isUp: data.trend - 14.9 > 0, icon: Users, color: 'text-orange-500', bg: 'bg-orange-50' },
        ];
    };

    const stats = getStatsByTimeRange(timeRange);

    // Tính toán báo cáo theo Staff (chỉ Admin mới thấy)
    const staffRevenue = currentFilteredOrders.reduce((acc, order) => {
        const creator = order.createdBy || 'unknown';
        if (!acc[creator]) acc[creator] = { orders: 0, revenue: 0 };
        acc[creator].orders += 1;
        acc[creator].revenue += order.totalAmount || 0;
        return acc;
    }, {});

    // Convert object to array và gán tên hiển thị
    const staffStatsArray = Object.keys(staffRevenue).map(username => {
        const staffInfo = USERS.find(u => u.username === username);
        return {
            username,
            fullname: staffInfo?.fullname || username,
            orders: staffRevenue[username].orders,
            revenue: staffRevenue[username].revenue
        };
    }).sort((a, b) => b.revenue - a.revenue); // Xếp hạng theo doanh thu giảm dần

    return (
        <div className="flex flex-col h-full bg-slate-50 p-4 md:p-6 lg:p-8 animate-fade-in overflow-y-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-800">Thống Kê Doanh Thu</h1>

                {/* Time Filter */}
                <div className="flex items-center p-1 bg-white border border-slate-200 rounded-xl overflow-x-auto shadow-sm">
                    {TIME_RANGES.map(range => (
                        <button
                            key={range.id}
                            onClick={() => setTimeRange(range.id)}
                            className={cn(
                                "px-4 py-2 text-sm font-semibold rounded-lg transition-all whitespace-nowrap",
                                timeRange === range.id ? "bg-slate-800 text-white shadow-md shadow-slate-800/20" : "text-slate-500 hover:bg-slate-50"
                            )}
                        >
                            {range.label}
                        </button>
                    ))}
                    <div className="flex items-center ml-2 border-l border-slate-100 pl-2">
                        <CalendarDays className="w-4 h-4 text-slate-400 mr-2" />
                        <input
                            type="date"
                            className="px-3 py-1.5 rounded-lg border border-transparent text-sm font-semibold text-slate-700 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all bg-slate-50 hover:bg-slate-100 cursor-pointer"
                            value={customDate}
                            onChange={(e) => {
                                setCustomDate(e.target.value);
                                setTimeRange('custom');
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Top Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {stats.map((stat, idx) => (
                    <div
                        key={idx}
                        onClick={() => {
                            if (idx === 0) setActiveModal('revenue');
                            if (idx === 1) setActiveModal('orders');
                        }}
                        className={cn(
                            "bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between relative overflow-hidden group transition-all",
                            (idx === 0 || idx === 1) ? "cursor-pointer hover:border-emerald-300 hover:shadow-md" : ""
                        )}
                    >
                        <div className="relative z-10 pointer-events-none">
                            <p className="text-slate-500 font-medium mb-1">{stat.label}</p>
                            <h3 className="text-2xl lg:text-3xl font-bold text-slate-800 animate-slide-up" style={{ animationDelay: `${idx * 100}ms` }}>
                                {idx === 0 ? formatCurrency(stat.value) : stat.value}
                            </h3>
                            <div className={cn("flex items-center gap-1 mt-2 text-sm font-bold", stat.isUp ? "text-emerald-500" : "text-red-500")}>
                                {stat.isUp ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                                <span>{Math.abs(stat.trend).toFixed(1)}%</span>
                                <span className="text-slate-400 font-medium ml-1">vs kỳ trước</span>
                            </div>
                        </div>
                        <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center relative z-10 group-hover:scale-110 transition-transform duration-300", stat.bg, stat.color)}>
                            <stat.icon className="w-7 h-7" />
                        </div>

                        {/* Background decoration */}
                        <div className={cn("absolute -bottom-6 -right-6 w-32 h-32 rounded-full opacity-[0.03] pointer-events-none transition-transform duration-500 group-hover:scale-150", stat.bg.replace('50', '500'))} />
                    </div>
                ))}
            </div>

            {/* Charts & Lists Area */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                {/* Main Chart */}
                <div className="xl:col-span-2 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Biểu đồ Doanh Thu</h3>
                    </div>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData} maxBarSize={40}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} tickFormatter={(val) => `${val / 1000000}M`} dx={-10} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 20px -5px rgba(0,0,0,0.1)' }}
                                    formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                                />
                                <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Best Sellers */}
                <div className="xl:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-slate-800 mb-6">Món Bán Chạy Nhất</h3>
                    <div className="flex-1 flex flex-col gap-5">
                        {bestSellers.map((item, idx) => (
                            <div key={item.id} className="flex items-center gap-4">
                                <span className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0",
                                    idx === 0 ? "bg-amber-100 text-amber-600" :
                                        idx === 1 ? "bg-slate-100 text-slate-600" :
                                            idx === 2 ? "bg-orange-100 text-orange-600" : "bg-slate-50 text-slate-400"
                                )}>
                                    #{idx + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-semibold text-slate-800 truncate">{item.name}</h4>
                                    <p className="text-sm text-slate-500">{item.sold} lượt bán</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="font-bold text-emerald-500">{formatCurrency(item.revenue)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Staff Ranking (Chỉ dành cho Admin) */}
            {['admin', 'sadmin'].includes(currentUser?.role) && staffStatsArray.length > 0 && (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm mb-8 animate-fade-in">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <BadgeCheck className="w-5 h-5 text-emerald-500" />
                        Bảng Xếp Hạng Nhân Sự
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {staffStatsArray.map((staff, idx) => (
                            <div key={staff.username} className="flex items-center gap-4 p-4 border border-slate-200 rounded-2xl bg-slate-50 relative overflow-hidden group hover:border-emerald-300 transition-colors">
                                {/* Rank Ribbon */}
                                <div className={cn(
                                    "absolute flex items-center justify-center top-0 right-0 w-8 h-8 rounded-bl-2xl font-bold text-sm",
                                    idx === 0 ? "bg-amber-100 text-amber-600" :
                                        idx === 1 ? "bg-slate-200 text-slate-600" :
                                            idx === 2 ? "bg-orange-100 text-orange-600" : "bg-white border-b border-l border-slate-200 text-slate-400"
                                )}>
                                    #{idx + 1}
                                </div>

                                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xl uppercase shadow-sm">
                                    {(staff.fullname && staff.fullname.length > 0) ? staff.fullname.charAt(0) : staff.username.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-800 text-sm">{(staff.fullname && staff.fullname.length > 0) ? staff.fullname : staff.username}</h4>
                                    <p className="text-xs text-slate-500 font-medium">@{staff.username}</p>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 font-semibold uppercase">Số đơn</span>
                                            <span className="text-sm font-bold text-blue-600">{staff.orders}</span>
                                        </div>
                                        <div className="w-[1px] h-6 bg-slate-200"></div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-slate-500 font-semibold uppercase">Doanh thu</span>
                                            <span className="text-sm font-bold text-emerald-600">{formatCurrency(staff.revenue)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Modal */}
            {activeModal && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setActiveModal(null)}>
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh] animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="font-bold text-lg text-slate-800">
                                {activeModal === 'revenue' ? 'Phân Bổ Doanh Thu (Bàn/Mang Về)' : 'Danh Sách Đơn Đã Hoàn Tất'}
                            </h3>
                            <button onClick={() => setActiveModal(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors">
                                <span className="font-bold text-sm">X</span>
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto flex-1">
                            {activeModal === 'revenue' ? (
                                <div className="flex flex-col gap-3">
                                    {Object.entries(revenueByTable).length === 0 ? (
                                        <p className="text-center text-slate-500 py-4">Chưa có doanh thu nào được ghi nhận.</p>
                                    ) : (
                                        Object.entries(revenueByTable).map(([table, data]) => (
                                            <div key={table} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50 hover:border-emerald-200 hover:bg-emerald-50/30 transition-colors">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-slate-800">{table}</span>
                                                    <span className="text-xs bg-white px-2 py-0.5 rounded-lg border border-slate-200 text-slate-500 w-max shadow-sm font-semibold">x {data.count} đơn</span>
                                                </div>
                                                <span className="font-bold text-emerald-600 text-lg">{formatCurrency(data.total)}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    {currentFilteredOrders.length === 0 ? (
                                        <p className="text-center text-slate-500 py-4">Chưa có đơn hàng nào.</p>
                                    ) : (
                                        currentFilteredOrders.map((order, idx) => (
                                            <div key={order.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-xl bg-slate-50 hover:border-blue-200 hover:bg-blue-50/30 transition-colors animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-slate-800">{order.table}</span>
                                                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1"><CalendarDays className="w-3 h-3" />#{order.id}</span>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="font-bold text-emerald-600">{formatCurrency(order.totalAmount || 0)}</span>
                                                    <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">Đã giao</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
