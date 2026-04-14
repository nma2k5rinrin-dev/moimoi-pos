import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import CustomerMenuPage from './pages/CustomerMenuPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/menu/:storeId" element={<CustomerMenuPage />} />
        <Route path="*" element={
          <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-orange-50 flex items-center justify-center p-6">
            <div className="text-center max-w-sm">
              <span className="text-6xl block mb-4">📱</span>
              <h1 className="text-2xl font-extrabold text-slate-800 mb-2">MoiMoi Menu</h1>
              <p className="text-slate-500 text-sm">Vui lòng quét mã QR tại bàn để xem thực đơn và đặt món.</p>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
