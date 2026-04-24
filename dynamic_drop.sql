-- Xóa tất cả các trigger gọi hàm merge_qr_order_after_insert trên bảng orders
DO $$ 
DECLARE
    trigger_record RECORD;
BEGIN
    FOR trigger_record IN 
        SELECT tgname 
        FROM pg_trigger 
        WHERE tgrelid = 'public.orders'::regclass 
        AND tgfoid = 'public.merge_qr_order_after_insert'::regproc
    LOOP
        EXECUTE 'DROP TRIGGER IF EXISTS ' || quote_ident(trigger_record.tgname) || ' ON public.orders';
    END LOOP;
END $$;

-- Tạo lại duy nhất 1 trigger
CREATE TRIGGER trigger_merge_qr_order_after_insert
AFTER INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.merge_qr_order_after_insert();
