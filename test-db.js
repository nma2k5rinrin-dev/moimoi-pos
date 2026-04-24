import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xxspocdyxwoezelsngli.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4c3BvY2R5eHdvZXplbHNuZ2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxODI4MzEsImV4cCI6MjA4Nzc1ODgzMX0.4owe6Bj8lxgazmk2s4hLeVcN95-wMAuRdG6ymVb6rJk'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testDuplicateAgain() {
    console.log("=== Testing Insertion to verify duplication ===");

    // 1. Create a fresh base order
    const baseId = `QR-BASE4-${Date.now()}`;
    await supabase.from('orders').insert({
        id: baseId, store_id: 'moimoi', table_name: 'Bàn Test Dup 4',
        items: [{ "id": "item_base", "price": 10000, "quantity": 1 }],
        status: 'pending', payment_status: 'unpaid', total_amount: 10000,
        time: new Date().toISOString(), created_by: 'customer'
    });

    await new Promise(r => setTimeout(r, 1000));

    // 2. Insert the second order with EXACTLY ONE ITEM
    await supabase.from('orders').insert({
        id: `QR-ADD4-${Date.now()}`, store_id: 'moimoi', table_name: 'Bàn Test Dup 4',
        items: [{ "id": "item_new", "price": 15000, "quantity": 1 }],
        status: 'pending', payment_status: 'unpaid', total_amount: 15000,
        time: new Date().toISOString(), created_by: 'customer'
    });

    // 3. Fetch the merged order
    const { data: orders } = await supabase.from('orders')
        .select('id, items, total_amount')
        .eq('store_id', 'moimoi')
        .eq('table_name', 'Bàn Test Dup 4')
        .order('time', { ascending: false });

    console.log("Resulting Orders:");
    for (const o of orders) {
        console.log(`ID: ${o.id}, Total: ${o.total_amount}`);
        console.log(`Items count: ${o.items.length}`);
        for (const item of o.items) {
            console.log(` - ${item.name || item.id} (qty: ${item.quantity})`);
        }
    }

    await supabase.from('orders').delete().eq('table_name', 'Bàn Test Dup 4');
}
testDuplicateAgain();
