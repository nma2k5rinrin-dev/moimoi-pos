import React from 'react';
import { useStore } from '../store/useStore';
import { AlertTriangle, X } from 'lucide-react';

export function ConfirmModal() {
    const { confirmDialog, closeConfirm } = useStore();

    if (!confirmDialog) return null;

    const { message, onConfirm } = confirmDialog;

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[110] px-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-slide-up border border-slate-100/80 p-6">
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-500 shrink-0">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <button
                        onClick={closeConfirm}
                        className="p-2 text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2">Xác nhận</h3>
                <p className="text-slate-600 text-sm mb-6">{message}</p>

                <div className="flex justify-end gap-3 w-full">
                    <button
                        onClick={closeConfirm}
                        className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={() => {
                            onConfirm();
                            closeConfirm();
                        }}
                        className="flex-1 py-2.5 px-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-md shadow-red-500/20 active:scale-95 transition-all"
                    >
                        Đồng ý
                    </button>
                </div>
            </div>
        </div>
    );
}
