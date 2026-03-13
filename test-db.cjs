const { createClient } = require('@supabase/supabase-js');

const s = createClient(
  'https://xxspocdyxwoezelsngli.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh4c3BvY2R5eHdvZXplbHNuZ2xpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxODI4MzEsImV4cCI6MjA4Nzc1ODgzMX0.4owe6Bj8lxgazmk2s4hLeVcN95-wMAuRdG6ymVb6rJk'
);

(async () => {
  console.log('=== Testing Supabase DB Schema ===\n');

  // Test 1: store_tables without sort_order
  const r1 = await s.from('store_tables').select('*').limit(1);
  console.log('1. store_tables SELECT *:', r1.error ? 'ERROR: ' + r1.error.message : 'OK', r1.data ? '(cols: ' + Object.keys(r1.data[0] || {}).join(', ') + ')' : '(empty)');

  // Test 2: store_tables with sort_order order
  const r1b = await s.from('store_tables').select('*').order('sort_order').limit(1);
  console.log('2. store_tables ORDER BY sort_order:', r1b.error ? 'ERROR: ' + r1b.error.message : 'OK');

  // Test 3: products
  const r2 = await s.from('products').select('*').limit(1);
  console.log('3. products SELECT *:', r2.error ? 'ERROR: ' + r2.error.message : 'OK', r2.data ? '(cols: ' + Object.keys(r2.data[0] || {}).join(', ') + ')' : '(empty)');

  // Test 4: insert product WITH description
  const tp1 = { id: 'test_desc_' + Date.now(), store_id: 'sadmin', name: 'Test', price: 10000, image: '', category: '', description: 'desc' };
  const r4 = await s.from('products').insert(tp1);
  console.log('4. INSERT product WITH description:', r4.error ? 'ERROR: ' + r4.error.message : 'OK');
  if (!r4.error) await s.from('products').delete().eq('id', tp1.id);

  // Test 5: insert product WITHOUT description
  const tp2 = { id: 'test_nodesc_' + Date.now(), store_id: 'sadmin', name: 'Test2', price: 10000, image: '', category: '' };
  const r5 = await s.from('products').insert(tp2);
  console.log('5. INSERT product WITHOUT description:', r5.error ? 'ERROR: ' + r5.error.message : 'OK');
  if (!r5.error) await s.from('products').delete().eq('id', tp2.id);

  // Test 6: orders table
  const r3 = await s.from('orders').select('*').limit(1);
  console.log('6. orders SELECT *:', r3.error ? 'ERROR: ' + r3.error.message : 'OK', r3.data ? '(cols: ' + Object.keys(r3.data[0] || {}).join(', ') + ')' : '(empty)');

  // Test 7: insert order
  const to = { id: 'test_' + Date.now(), store_id: 'sadmin', table_name: 'Test', items: [], status: 'pending', payment_status: 'unpaid', total_amount: 10000, created_by: 'sadmin', time: new Date().toISOString() };
  const r6 = await s.from('orders').insert(to);
  console.log('7. INSERT order:', r6.error ? 'ERROR: ' + r6.error.message : 'OK');
  if (!r6.error) await s.from('orders').delete().eq('id', to.id);

  // Test 8: categories
  const r7 = await s.from('categories').select('*').limit(1);
  console.log('8. categories SELECT *:', r7.error ? 'ERROR: ' + r7.error.message : 'OK', r7.data ? '(cols: ' + Object.keys(r7.data[0] || {}).join(', ') + ')' : '(empty)');

  // Test 9: insert category
  const tc = { id: 'test_cat_' + Date.now(), store_id: 'sadmin', name: 'Test Cat' };
  const r8 = await s.from('categories').insert(tc);
  console.log('9. INSERT category:', r8.error ? 'ERROR: ' + r8.error.message : 'OK');
  if (!r8.error) await s.from('categories').delete().eq('id', tc.id);

  // Test 10: users
  const r9 = await s.from('users').select('*').limit(1);
  console.log('10. users SELECT *:', r9.error ? 'ERROR: ' + r9.error.message : 'OK');

  console.log('\n=== Done ===');
})();
