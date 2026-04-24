-- ═══════════════════════════════════════════════════════════
-- CLEANUP: Remove duplicate merge triggers if they exist
-- ═══════════════════════════════════════════════════════════

-- Có thể trong quá trình phát triển, database của bạn đã bị tạo trùng 2 Trigger 
-- (VD: 1 cái tên 'handle_qr_order', 1 cái tên 'trigger_merge_qr_order_after_insert')
-- Khi khách đặt đơn, cả 2 trigger cùng nhảy vào chạy, dẫn đến việc cộng dồn đồ ăn bị lặp lại 2 lần (nhân đôi).

-- Chạy lệnh này để xóa hết tất cả các trigger cũ:
DROP TRIGGER IF EXISTS handle_qr_order ON public.orders;
DROP TRIGGER IF EXISTS trigger_merge_qr_order_after_insert ON public.orders;

-- Sau đó tạo lại duy nhất 1 trigger chuẩn:
CREATE TRIGGER trigger_merge_qr_order_after_insert
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.merge_qr_order_after_insert();
