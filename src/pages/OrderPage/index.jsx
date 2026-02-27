import React from 'react';
import { ProductGrid } from './components/ProductGrid';
import { Cart } from './components/Cart';
import { MobileCart } from './components/MobileCart';

export default function OrderPage() {
    return (
        <div className="flex h-full animate-fade-in w-full">
            {/* Khu vực danh sách món ăn */}
            <div className="flex-1 md:w-[calc(100%-320px)] lg:w-[calc(100%-350px)] xl:w-[calc(100%-420px)] h-full overflow-hidden">
                <ProductGrid />
            </div>

            {/* Khu vực giỏ hàng cố định bên phải (Desktop) */}
            <div className="hidden md:block w-[320px] lg:w-[350px] xl:w-[420px] h-full shrink-0 shadow-[-4px_0_15px_-3px_rgba(0,0,0,0.02)]">
                <Cart />
            </div>

            {/* Helper Mobile View */}
            <MobileCart />
        </div>
    )
}
