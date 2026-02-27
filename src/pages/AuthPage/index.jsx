import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Store, User, Lock, LogIn, UserPlus, Phone, Briefcase, BadgeCheck } from 'lucide-react';

export default function AuthPage() {
    const USERS = useStore(state => state.USERS);
    // Nếu chỉ có admin và sadmin (length <= 2), tự động mở form Đăng Ký cho lần đầu sử dụng
    const [isLoginMode, setIsLoginMode] = useState(USERS.length > 2);

    // Form states
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullname, setFullname] = useState('');
    const [phone, setPhone] = useState('');
    const [storeName, setStoreName] = useState('');

    const [error, setError] = useState('');

    const login = useStore(state => state.login);
    const register = useStore(state => state.register);
    const storeId = useStore(state => state.getStoreId());
    const storeInfo = useStore(state => state.storeInfos[storeId] || state.storeInfos['sadmin']);
    const showToast = useStore(state => state.showToast);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        setError('');

        if (isLoginMode) {
            if (!username || !password) {
                setError('Vui lòng nhập đầy đủ thông tin');
                return;
            }
            const result = login(username, password);
            if (result === 'success') {
                showToast('Đăng nhập thành công!');
                navigate('/');
            } else if (result === 'expired') {
                setError('Tài khoản của bạn đã hết hạn sử dụng. Vui lòng liên hệ Admin để gia hạn!');
                showToast('License hết hạn', 'error');
            } else if (result === 'parent_expired') {
                setError('Cửa hàng quản lý bạn đã hết hạn sử dụng phần mềm!');
                showToast('License hết hạn', 'error');
            } else {
                setError('Sai tên đăng nhập hoặc mật khẩu');
                showToast('Đăng nhập thất bại', 'error');
            }
        } else {
            if (!username || !password || !fullname || !phone || !storeName) {
                setError('Vui lòng điền đủ tất cả các trường');
                return;
            }
            register({ username, password, fullname, phone, storeName });
            showToast('Đăng ký cửa hàng thành công!');
            navigate('/');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
            <div className="sm:mx-auto sm:w-full sm:max-w-md animate-slide-up">
                <div className="flex justify-center mb-6">
                    {storeInfo.logoUrl ? (
                        <img src={storeInfo.logoUrl} alt="Logo" className="w-24 h-24 rounded-3xl object-cover shadow-xl shadow-emerald-500/20" />
                    ) : (
                        <div className="w-24 h-24 bg-emerald-500 rounded-3xl shadow-xl shadow-emerald-500/20 flex items-center justify-center">
                            <Store className="w-12 h-12 text-white" />
                        </div>
                    )}
                </div>
                <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-800">
                    {isLoginMode ? 'Đăng nhập hệ thống' : 'Khởi tạo Cửa hàng'}
                </h2>
                <p className="mt-2 text-center text-sm text-slate-500 font-medium">
                    POS • {isLoginMode ? storeInfo.name : 'Dành cho Chủ Quán'}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="bg-white py-8 px-4 shadow-2xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100 relative overflow-hidden">

                    {/* Background Decoration */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

                    <form className="space-y-5 relative z-10" onSubmit={handleSubmit}>

                        {!isLoginMode && (
                            <>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1">Cửa hàng của bạn</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Store className="w-5 h-5 text-slate-400" /></div>
                                        <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className="w-full pl-10 h-11 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-800" placeholder="VD: Tiệm Trà Chanh ABC" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Họ và Tên</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><BadgeCheck className="w-5 h-5 text-slate-400" /></div>
                                            <input type="text" value={fullname} onChange={(e) => setFullname(e.target.value)} className="w-full pl-10 h-11 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-800" placeholder="Nguyễn Văn A" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><Phone className="w-5 h-5 text-slate-400" /></div>
                                            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full pl-10 h-11 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-800" placeholder="0987..." />
                                        </div>
                                    </div>
                                </div>
                            </>
                        )}

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Tên đăng nhập</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="w-5 h-5 text-slate-400" />
                                </div>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full pl-10 h-11 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-800 font-medium"
                                    placeholder="Tên đăng nhập của bạn"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="w-5 h-5 text-slate-400" />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-10 h-11 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-800 font-medium"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-500 text-sm font-semibold rounded-xl text-center animate-shake">
                                {error}
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                className="w-full flex items-center justify-center gap-2 h-12 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98]"
                            >
                                {isLoginMode ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                                {isLoginMode ? 'Đăng nhập' : 'Hoàn tất Đăng Ký'}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 flex justify-center">
                        <button
                            type="button"
                            onClick={() => { setIsLoginMode(!isLoginMode); setError(''); }}
                            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                        >
                            {isLoginMode ? 'Bạn chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
