import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xxspocdyxwoezelsngli.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4c3BvY2R5eHdvZXplbHNuZ2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxODI4MzEsImV4cCI6MjA4Nzc1ODgzMX0.4owe6Bj8lxgazmk2s4hLeVcN95-wMAuRdG6ymVb6rJk'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testQuery() {
    const { data, error } = await supabase.from('orders')
        .select('*')
        .eq('table_name', 'Sảnh · Bàn 9')
        .order('time', { ascending: false });

    if (error) {
        console.error(error);
    } else {
        console.log("Orders count for Sảnh · Bàn 9:", data.length);
        if (data.length > 0) {
            console.log("Latest order item count:", data[0].items?.length);
            console.log("Status:", data[0].status);
        }
    }
}
testQuery();
