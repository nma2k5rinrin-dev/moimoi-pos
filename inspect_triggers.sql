-- Create a temporary function to inspect all triggers
CREATE OR REPLACE FUNCTION get_order_triggers()
RETURNS TABLE(trigger_name text, function_name text)
LANGUAGE sql SECURITY DEFINER AS $$
    SELECT 
        t.tgname::text as trigger_name,
        p.proname::text as function_name
    FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE t.tgrelid = 'public.orders'::regclass;
$$;
