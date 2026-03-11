import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
    console.log("Testing insert user...");
    const newUser = { username: 'testuser', pass: 'Test@1234', role: 'admin', fullname: 'Test', phone: '0123', is_premium: false };
    const { data, error } = await supabase.from('users').insert(newUser);
    console.log("Users insert error:", error);

    if (!error) {
        console.log("Testing insert store_info...");
        const { data: d2, error: e2 } = await supabase.from('store_infos').insert({
            store_id: 'testuser',
            name: 'Test Store',
            phone: '0123',
            is_premium: false
        });
        console.log("Store_infos insert error:", e2);
        
        await supabase.from('users').delete().eq('username', 'testuser');
        await supabase.from('store_infos').delete().eq('store_id', 'testuser');
    }
}
test();
