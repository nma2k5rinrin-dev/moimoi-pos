import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore, useStoreId } from '../../store/useStore';
import { Store, User, Lock, LogIn, UserPlus, Phone, Briefcase, BadgeCheck, KeyRound, ArrowLeft, CheckCircle, XCircle, Loader2, Eye, EyeOff } from 'lucide-react';
import { validatePassword } from '../../utils/validators';

// ─── Forgot Password View ────────────────────────────────────────────────────
function ForgotPasswordView({ onBack, onRegister }) {
    const USERS = useStore(state => state.USERS);

    const [phone, setPhone] = useState('');
    const [status, setStatus] = useState('idle'); // idle | loading | found | notfound
    const [foundPassword, setFoundPassword] = useState('');

    const handleLookup = async (e) => {
        e.preventDefault();
        if (!phone.trim()) return;
        setStatus('loading');
        try {
            const { supabase } = await import('../../lib/supabase');
            const normalizedInput = phone.trim().replace(/\s/g, '');
            const { data: users } = await supabase
                .from('users')
                .select('username, pass, phone')
                .neq('role', 'sadmin');
            const matched = (users || []).find(u => (u.phone || '').replace(/\s/g, '') === normalizedInput);
            if (matched) { setFoundPassword(matched.pass); setStatus('found'); }
            else setStatus('notfound');
        } catch { setStatus('notfound'); }
    };

    const handleReset = () => {
        setPhone('');
        setStatus('idle');
        setFoundPassword('');
    };

    return (
        <div className="space-y-5 relative z-10">
            {/* Header */}
            <div className="flex items-center gap-3 mb-2">
                <button
                    type="button"
                    onClick={onBack}
                    className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-500 hover:text-slate-700"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h3 className="font-bold text-slate-800 text-lg">Quên mật khẩu</h3>
                    <p className="text-xs text-slate-500">Nhập số điện thoại đã đăng ký</p>
                </div>
            </div>

            {status === 'idle' && (
                <form onSubmit={handleLookup} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại đăng ký</label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <Phone className="w-5 h-5 text-slate-400" />
                            </div>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="w-full pl-10 h-11 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-800"
                                placeholder="VD: 0987 654 321"
                                autoFocus
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={!phone.trim()}
                        className="w-full flex items-center justify-center gap-2 h-12 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl font-bold text-base shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98]"
                    >
                        <KeyRound className="w-5 h-5" />
                        Lấy lại mật khẩu
                    </button>
                </form>
            )}

            {status === 'loading' && (
                <div className="flex flex-col items-center justify-center py-8 gap-4 animate-fade-in">
                    <div className="relative">
                        <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-500 animate-spin" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Phone className="w-6 h-6 text-emerald-500" />
                        </div>
                    </div>
                    <div className="text-center">
                        <p className="font-semibold text-slate-700">Đang tìm kiếm...</p>
                        <p className="text-sm text-slate-400 mt-1">Vui lòng đợi trong giây lát</p>
                    </div>
                </div>
            )}

            {status === 'found' && (
                <div className="animate-fade-in space-y-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
                        <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-emerald-700 mb-3">Tìm thấy tài khoản!</p>
                        <p className="text-xs text-slate-500 mb-2">Mật khẩu của bạn là:</p>
                        <div className="inline-block px-6 py-2 bg-white border-2 border-emerald-300 rounded-xl">
                            <span className="text-2xl font-bold tracking-widest text-slate-800 font-mono">{foundPassword}</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={handleReset}
                            className="flex-1 h-10 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Tìm lại
                        </button>
                        <button
                            onClick={onBack}
                            className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-500/30"
                        >
                            Đăng nhập ngay
                        </button>
                    </div>
                </div>
            )}

            {status === 'notfound' && (
                <div className="animate-fade-in space-y-4">
                    <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-center">
                        <XCircle className="w-10 h-10 text-red-400 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-red-600 mb-1">Không tìm thấy!</p>
                        <p className="text-sm text-slate-500">
                            Số điện thoại <span className="font-bold text-slate-700">"{phone}"</span> chưa được đăng ký tài khoản.
                        </p>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                        <p className="text-sm text-slate-600 mb-3">Bạn có muốn đăng ký tài khoản không?</p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleReset}
                                className="flex-1 h-10 border border-slate-200 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
                            >
                                Thử lại
                            </button>
                            <button
                                onClick={onRegister}
                                className="flex-1 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-sm font-bold transition-all shadow-md shadow-emerald-500/30 flex items-center justify-center gap-1"
                            >
                                <UserPlus className="w-4 h-4" />
                                Đăng ký ngay
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Main Auth Page ──────────────────────────────────────────────────────────
export default function AuthPage() {
    const USERS = useStore(state => state.USERS);
    const [isLoginMode, setIsLoginMode] = useState(USERS.length > 2);
    const [isForgotMode, setIsForgotMode] = useState(false);

    // Form states
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [fullname, setFullname] = useState('');
    const [phone, setPhone] = useState('');
    const [storeName, setStoreName] = useState('');

    const [error, setError] = useState('');

    const login = useStore(state => state.login);
    const register = useStore(state => state.register);
    const currentUser = useStore(state => state.currentUser);
    const storeId = useStoreId();
    const storeInfo = useStore(state => state.storeInfos[storeId] || state.storeInfos['sadmin']) || {};
    const showToast = useStore(state => state.showToast);
    const navigate = useNavigate();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);
        try {
            if (isLoginMode) {
                if (!username || !password) { setError('Vui lòng nhập đầy đủ thông tin'); return; }
                const result = await login(username, password);
                if (result === 'success') {
                    showToast('Đăng nhập thành công!');
                    navigate('/');
                } else {
                    setError('Sai tên đăng nhập hoặc mật khẩu');
                    showToast('Đăng nhập thất bại', 'error');
                }
            } else {
                if (!username || !password || !fullname || !phone || !storeName) { setError('Vui lòng điền đủ tất cả các trường'); return; }

                const passError = validatePassword(password);
                if (passError) { setError(passError); return; }

                const result = await register({ username, password, fullname, phone, storeName });
                if (result === 'success') {
                    showToast('Đăng ký cửa hàng thành công!');
                    navigate('/');
                } else if (result === 'exists') {
                    setError('Tên đăng nhập đã tồn tại, vui lòng chọn tên khác');
                } else if (result === 'offline') {
                    setError('Cần cấu hình CSDL và có kết nối Internet để đăng ký');
                } else {
                    setError('Đăng ký thất bại, vui lòng thử lại');
                }
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const goToRegister = () => {
        setIsForgotMode(false);
        setIsLoginMode(false);
        setError('');
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
                    {isForgotMode ? 'Khôi phục mật khẩu' : (isLoginMode ? 'Đăng nhập hệ thống' : 'Khởi tạo Cửa hàng')}
                </h2>
                <p className="mt-2 text-center text-sm text-slate-500 font-medium">
                    POS • {isLoginMode && !isForgotMode ? storeInfo.name : 'Dành cho Chủ Quán'}
                </p>
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md animate-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="bg-white py-8 px-4 shadow-2xl shadow-slate-200/50 sm:rounded-3xl sm:px-10 border border-slate-100 relative overflow-hidden">

                    {/* Background Decoration */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-50 rounded-full blur-3xl opacity-50 pointer-events-none" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-50 pointer-events-none" />

                    {isForgotMode ? (
                        <ForgotPasswordView
                            onBack={() => { setIsForgotMode(false); setIsLoginMode(true); }}
                            onRegister={goToRegister}
                        />
                    ) : (
                        <>
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
                                            onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                                            className="w-full pl-10 h-11 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-800 font-medium"
                                            placeholder="Tên đăng nhập của bạn"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="block text-sm font-semibold text-slate-700">Mật khẩu</label>
                                        {isLoginMode && (
                                            <button
                                                type="button"
                                                onClick={() => { setIsForgotMode(true); setError(''); }}
                                                className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                                            >
                                                Quên mật khẩu?
                                            </button>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="w-5 h-5 text-slate-400" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-10 h-11 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition-all text-slate-800 font-medium"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(v => !v)}
                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                            tabIndex={-1}
                                        >
                                            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                        </button>
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
                                        disabled={isSubmitting}
                                        className="w-full flex items-center justify-center gap-2 h-12 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-70 text-white rounded-xl font-bold text-lg shadow-lg shadow-emerald-500/30 transition-all active:scale-[0.98]"
                                    >
                                        {isSubmitting
                                            ? <Loader2 className="w-5 h-5 animate-spin" />
                                            : (isLoginMode ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />)
                                        }
                                        {isSubmitting ? 'Đang xử lý...' : (isLoginMode ? 'Đăng nhập' : 'Hoàn tất Đăng Ký')}
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
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
