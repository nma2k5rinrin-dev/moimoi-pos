import React from 'react';
import { X, Zap, CheckCircle2, QrCode, Banknote, Copy, ArrowLeft } from 'lucide-react';
import { useStore } from '../store/useStore';

export function UpgradeModal() {
    const { isUpgradeModalOpen, setUpgradeModalOpen, requestUpgrade, currentUser, showToast, storeInfos } = useStore();
    const [selectedPlan, setSelectedPlan] = React.useState(null);

    const sadminInfo = storeInfos['sadmin'] || {};
    const bankName = sadminInfo.bankName || sadminInfo.bankId || 'Ngân hàng chưa cập nhật';
    const bankOwner = sadminInfo.bankOwner || 'CHƯA CẬP NHẬT CTK';
    const bankAccount = sadminInfo.bankAccount || 'CHƯA CẬP NHẬT STK';

    if (!isUpgradeModalOpen) return null;

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text);
        showToast('Đã copy vào bộ nhớ tạm');
    };

    const plans = [
        { id: '1m', title: '1 Tháng', price: '99.000đ', duration: '/tháng', originalPrice: '120.000đ', features: ['Không giới hạn Nhân viên', 'Báo cáo chi tiết', 'Hỗ trợ ưu tiên'], months: 1 },
        { id: '3m', title: '3 Tháng', price: '259.000đ', duration: '/3 tháng', originalPrice: '360.000đ', features: ['Tất cả tính năng 1 tháng', 'Tiết kiệm 28%'], months: 3 },
        { id: '6m', title: '6 Tháng', price: '499.000đ', duration: '/6 tháng', originalPrice: '720.000đ', features: ['Tất cả tính năng', 'Tiết kiệm 30%', 'Ghi nhớ lịch sử 1 năm'], months: 6 },
        { id: '12m', title: '1 Năm', price: '899.000đ', duration: '/năm', originalPrice: '1.440.000đ', popular: true, features: ['Tất cả tính năng', 'Tiết kiệm 37%', 'Miễn phí nâng cấp API', 'Hỗ trợ 24/7'], months: 12 }
    ];

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] px-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-slide-up border border-slate-100/50">
                <button
                    onClick={() => {
                        setUpgradeModalOpen(false);
                        setSelectedPlan(null);
                    }}
                    className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors z-20"
                >
                    <X className="w-5 h-5" />
                </button>

                {!selectedPlan ? (
                    <div className="p-8 md:p-12 text-center relative overflow-hidden bg-gradient-to-b from-amber-50 to-white">
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full max-w-2xl bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-200/40 via-transparent to-transparent opacity-50 pointer-events-none"></div>
                        <div className="relative z-10">
                            <div className="w-16 h-16 bg-gradient-to-tr from-amber-400 to-orange-400 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-amber-500/20 rotate-3 hook-animation">
                                <Zap className="w-8 h-8 text-white absolute" />
                            </div>
                            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 mb-4 tracking-tight">Nâng cấp tài khoản VIP</h2>
                            <p className="text-slate-500 max-w-lg mx-auto text-base">Bứt phá doanh thu với các tính năng quản lý cao cấp như thêm không giới hạn nhân viên và xem báo cáo tài chính chi tiết.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 md:mt-10 relative z-10 text-left pb-4">
                            {plans.map((plan, i) => (
                                <div key={i} className={`relative p-5 rounded-2xl border ${plan.popular ? 'border-amber-400 shadow-xl shadow-amber-500/10 bg-white md:scale-105 z-10' : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-lg hover:bg-white'} transition-all group flex flex-col cursor-pointer`}>
                                    {plan.popular && (
                                        <div className="absolute -top-3 inset-x-0 flex justify-center">
                                            <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">Khuyên Dùng</span>
                                        </div>
                                    )}
                                    <h3 className="font-bold text-slate-700 text-lg mb-1">{plan.title}</h3>
                                    <div className="flex items-end gap-1 mb-1">
                                        <span className="text-2xl font-black text-slate-900 leading-none">{plan.price}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-xs text-slate-400 line-through font-medium">{plan.originalPrice}</span>
                                        <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 rounded-full">{plan.duration}</span>
                                    </div>
                                    <div className="flex-1 space-y-3 mb-6">
                                        {plan.features.map((feat, index) => (
                                            <div key={index} className="flex items-start gap-2">
                                                <CheckCircle2 className={`w-4 h-4 shrink-0 mt-0.5 ${plan.popular ? 'text-amber-500' : 'text-emerald-500'}`} />
                                                <span className="text-sm text-slate-600 font-medium">{feat}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => setSelectedPlan({ ...plan, index: i })}
                                        className={`w-full py-2.5 rounded-xl font-bold text-sm transition-all focus:ring-4 focus:ring-amber-500/20 outline-none ${plan.popular ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-500/30 hover:shadow-lg hover:shadow-amber-500/40' : 'bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900'} mt-auto`}
                                    >
                                        Chọn gói này
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="p-6 md:p-10 flex flex-col md:flex-row gap-8 bg-white relative z-10 w-full animate-fade-in max-w-3xl mx-auto">
                        <button
                            onClick={() => setSelectedPlan(null)}
                            className="absolute top-6 left-6 p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors hidden md:flex z-20"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>

                        <div className="w-full md:w-1/2 flex flex-col items-center pt-2 md:pt-8 bg-slate-50/50 rounded-2xl relative">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                                <QrCode className="w-6 h-6" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">Thanh toán bằng QR</h3>
                            <p className="text-slate-500 text-sm mb-6 text-center">Sử dụng App Ngân hàng quét mã để thanh toán tự động</p>
                            <div className="w-48 h-48 bg-white p-3 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-center">
                                {/* Dynamic VietQR generation */}
                                <img src={`https://img.vietqr.io/image/${bankName}-${bankAccount}-compact2.jpg?amount=${parseInt(selectedPlan.price.replace(/\D/g, ''))}&addInfo=${encodeURIComponent(currentUser?.username + ' mua goi VIP')}&accountName=${encodeURIComponent(bankOwner)}`} className="w-full h-full object-contain mix-blend-multiply" alt="QR Code Khong Hop Le" onError={(e) => { e.target.src = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=CHUA_CAP_NHAT_STK'; }} />
                            </div>
                        </div>

                        <div className="w-full md:w-1/2 flex flex-col justify-center">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
                                <Banknote className="w-6 h-6 text-emerald-500" />
                                Chuyển khoản thủ công
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Ngân hàng</p>
                                    <p className="font-semibold text-slate-800 uppercase">{bankName}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Chủ tài khoản</p>
                                    <p className="font-semibold text-slate-800 uppercase">{bankOwner}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Số tài khoản</p>
                                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2 max-w-max">
                                        <span className="font-bold text-lg text-emerald-600 tracking-wider">{bankAccount}</span>
                                        <button onClick={() => handleCopy(bankAccount)} className="p-1.5 text-slate-400 hover:text-emerald-600 bg-white rounded-md shadow-sm transition-colors cursor-pointer">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Số tiền</p>
                                    <p className="font-bold text-xl text-slate-800">{selectedPlan.price}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nội dung chuyển khoản</p>
                                    <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg p-2 max-w-max">
                                        <span className="font-bold text-sm text-amber-700">{currentUser?.username} mua goi VIP</span>
                                        <button onClick={() => handleCopy(`${currentUser?.username} mua goi VIP`)} className="p-1.5 text-amber-500 hover:text-amber-700 bg-white rounded-md shadow-sm transition-colors cursor-pointer">
                                            <Copy className="w-4 h-4" />
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-red-500 font-medium italic mt-1">* Vui lòng ghi chính xác nội dung chuyển khoản để được duyệt nhanh nhất</p>
                                </div>
                            </div>

                            <button
                                onClick={() => {
                                    requestUpgrade(currentUser?.username, selectedPlan.index, selectedPlan.title, selectedPlan.months);
                                    setSelectedPlan(null);
                                    setTimeout(() => setUpgradeModalOpen(false), 50);
                                }}
                                className="w-full mt-8 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-bold shadow-md shadow-emerald-500/20 hover:shadow-lg hover:shadow-emerald-500/30 transition-all hover:-translate-y-0.5 active:translate-y-0 text-center"
                            >
                                Tôi đã chuyển khoản xong
                            </button>
                            <button
                                onClick={() => setSelectedPlan(null)}
                                className="w-full mt-3 py-3 text-slate-500 font-semibold hover:bg-slate-50 rounded-xl transition-colors md:hidden"
                            >
                                Quay lại chọn gói khác
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
