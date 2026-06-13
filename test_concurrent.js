const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  console.log('--- STARTING CONCURRENCY SCENARIO 1 TEST ---');
  
  // 1. Reset the item stock to 1
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'cn1',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'quickbyte'
  });
  await db.query("UPDATE menu_items SET availability_quantity = 1 WHERE item_id = 2");
  console.log('> Set item #2 availability_quantity to 1 unit');

  // 2. Login to get a token for Customer 1
  console.log('> Logging in as customer (8888888888)...');
  const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ auth_id: '8888888888', password: 'password123', role: 'CUSTOMER' })
  });
  const loginData = await loginRes.json();
  const token = loginData.token;
  if (!token) throw new Error("Login failed: " + JSON.stringify(loginData));

  // 3. Prepare requests
  const orderData = {
    restaurant_id: 1,
    items: [{ item_id: 2, quantity: 1 }],
    customer_address: 'Test Address',
    total_amount: 10
  };

  const reqConfig = {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}` 
    },
    body: JSON.stringify(orderData)
  };
  
  console.log('> Firing two identical order requests at the EXACT SAME TIME');
  
  // 4. Fire them concurrently using Promise.allSettled
  const results = await Promise.allSettled([
    fetch('http://127.0.0.1:5000/api/customer/orders', reqConfig).then(async r => ({ status: r.status, data: await r.json() })),
    fetch('http://127.0.0.1:5000/api/customer/orders', reqConfig).then(async r => ({ status: r.status, data: await r.json() }))
  ]);

  // 5. Output results
  console.log('\n--- RESULTS ---');
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < results.length; i++) {
    const res = results[i].value; 
    if (res.status === 201) {
      console.log(`Request ${i+1}: ✅ SUCCESS (Order ID: ${res.data.order_id})`);
      successCount++;
    } else {
      console.log(`Request ${i+1}: ❌ FAILED (Status: ${res.status}) - ${res.data?.message}`);
      failCount++;
    }
  }

  console.log(`\nFinal tally: ${successCount} order(s) placed, ${failCount} order(s) blocked.`);
  if (successCount === 1 && failCount === 1) {
    console.log('✅ TRANSACTION LOGIC WORKS! The database prevented the second order from succeeding.');
  } else {
    console.log('❌ SOMETHING IS WRONG. Expected exactly 1 success and 1 fail.');
  }
  
  process.exit(0);
}

run().catch(err => {
  console.error("Test error:", err);
  process.exit(1);
});
