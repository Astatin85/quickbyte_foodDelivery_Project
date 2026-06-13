require('dotenv').config();
const fetch = global.fetch;

async function run() {
  console.log('--- PAYMENT CONFLICT TEST ---');

  // Step 1: Login
  const loginRes = await fetch('http://127.0.0.1:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_id: '8888888888',
      password: 'password123'
    })
  });

  const loginData = await loginRes.json();
  const token = loginData.token;

  if (!token) {
    throw new Error('Login failed');
  }

  console.log('✅ Logged in');

  const order_id = 1;

  // Step 2: Fire BOTH requests at same time
  console.log('⚡ Triggering payment + cancel simultaneously...');

  const paymentRequest = fetch('http://127.0.0.1:5000/api/customer/payments', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      order_id,
      amount: 200,
      payment_method: 'CARD'
    })
  });

  const cancelRequest = fetch(`http://127.0.0.1:5000/api/customer/orders/${order_id}/cancel`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  const [paymentRes, cancelRes] = await Promise.all([
    paymentRequest,
    cancelRequest
  ]);

  const paymentData = await paymentRes.json();
  const cancelData = await cancelRes.json();

  console.log('\n--- RESULTS ---');

  console.log('Payment:', paymentRes.status === 201 ? '✅ SUCCESS' : '❌ FAILED', paymentData);
  console.log('Cancel :', cancelRes.status === 200 ? '✅ SUCCESS' : '❌ FAILED', cancelData);

  if (
    (paymentRes.status === 201 && cancelRes.status !== 200) ||
    (paymentRes.status !== 201 && cancelRes.status === 200)
  ) {
    console.log('\n✅ TRANSACTION WORKS: Only one succeeded');
  } else {
    console.log('\n❌ PROBLEM: Both succeeded or both failed');
  }
}

run();