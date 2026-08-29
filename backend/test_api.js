/**
 * AquaFix Backend API Diagnostic Test Script
 * Run with: node test_api.js
 * Uses built-in node fetch (v18+) to run end-to-end API verification.
 */

const BASE_URL = 'http://127.0.0.1:5000/api';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runTests() {
  console.log('=== Starting AquaFix API Diagnostics ===');

  let customerToken = '';
  let ownerToken = '';
  let customerId = '';
  let ownerId = '';
  let bookingId = '';
  let paymentId = '';

  const timestamp = Date.now();
  const customerEmail = `customer-${timestamp}@test.com`;
  const ownerEmail = `owner-${timestamp}@test.com`;

  try {
    // 1. Health check
    console.log('\n[TEST 1] Checking API Server Health...');
    const healthRes = await fetch('http://127.0.0.1:5000/');
    const healthData = await healthRes.json();
    console.log('Response:', healthData);
    if (healthData.status !== 'online') throw new Error('Server health check failed');

    // 2. Register Customer
    console.log('\n[TEST 2] Registering a Customer...');
    const regCustRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Vishal Mishra',
        email: customerEmail,
        password: 'password123',
        phone: '9876543210',
        role: 'customer',
        address: 'MG Road, Bangalore',
      }),
    });
    const regCustData = await regCustRes.json();
    console.log('Cust Reg Response:', regCustData);
    if (!regCustData.success) throw new Error('Customer registration failed');
    customerToken = regCustData.token;
    customerId = regCustData.user.id;

    // 3. Register Machine Owner
    console.log('\n[TEST 3] Registering a Machine Owner...');
    const regOwnerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Suresh Rig Operators',
        email: ownerEmail,
        password: 'password123',
        phone: '8765432109',
        role: 'owner',
        address: 'Whitefield, Bangalore',
        machineType: 'DTH High-Pressure Rig',
        pricePerFt: 75,
        lat: 12.9716, // Bangalore Center
        lng: 77.5946,
      }),
    });
    const regOwnerData = await regOwnerRes.json();
    console.log('Owner Reg Response:', regOwnerData);
    if (!regOwnerData.success) throw new Error('Owner registration failed');
    ownerToken = regOwnerData.token;
    ownerId = regOwnerData.user.id;

    // 4. Register Admin
    console.log('\n[TEST 4] Registering/Verifying Owner via Admin mock login...');
    // In our models, verified defaults to false. Let's verify the owner directly in database or since we don't have an admin UI yet, we can create a temporary admin or we can mock verify the owner to let it show up in nearby list.
    // Wait, let's register an admin so we can test the admin endpoint to verify the owner!
    const adminEmail = `admin-${timestamp}@test.com`;
    const regAdminRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'AquaFix Admin',
        email: adminEmail,
        password: 'adminpassword123',
        phone: '1111122222',
        role: 'admin',
        address: 'AquaFix Head Office',
      }),
    });
    const regAdminData = await regAdminRes.json();
    console.log('Admin Reg Response:', regAdminData);
    if (!regAdminData.success) throw new Error('Admin registration failed');
    const adminToken = regAdminData.token;

    console.log('\n[TEST 5] Admin verifying the Owner...');
    const verifyRes = await fetch(`${BASE_URL}/admin/owners/${ownerId}/verify`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ verified: true }),
    });
    const verifyData = await verifyRes.json();
    console.log('Verification Response:', verifyData);
    if (!verifyData.success) throw new Error('Owner verification failed');

    // 5. Get Nearby Owners
    console.log('\n[TEST 6] Searching Nearby Machine Owners...');
    const nearbyRes = await fetch(`${BASE_URL}/owners/nearby?lat=12.9600&lng=77.5800&radius=50`);
    const nearbyData = await nearbyRes.json();
    console.log('Nearby Owners List (Count):', nearbyData.count);
    console.log('First Owner Details:', nearbyData.data[0]);
    if (nearbyData.count === 0) throw new Error('No nearby owners found');

    // 6. Create Booking Request
    console.log('\n[TEST 7] Creating a Booking Request...');
    const bookingRes = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        ownerId: ownerId,
        location: 'Koramangala 4th Block, Bangalore',
        borewellDetails: '6 inch diameter, expected depth 250 ft, clay soil',
        preferredDate: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days later
        siteImageUrl: '/uploads/dummy-site.jpg',
      }),
    });
    const bookingData = await bookingRes.json();
    console.log('Booking Creation Response:', bookingData);
    if (!bookingData.success) throw new Error('Booking creation failed');
    bookingId = bookingData.data._id;

    // 7. List Bookings (Customer view)
    console.log('\n[TEST 8] Fetching Booking List (Customer)...');
    const custBookingsRes = await fetch(`${BASE_URL}/bookings`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const custBookingsData = await custBookingsRes.json();
    console.log('Customer Bookings Count:', custBookingsData.count);

    // 8. Accept Booking (Owner view)
    console.log('\n[TEST 9] Owner Accepting the Booking...');
    const acceptRes = await fetch(`${BASE_URL}/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'accepted' }),
    });
    const acceptData = await acceptRes.json();
    console.log('Booking Accept Response:', acceptData);
    if (acceptData.data.status !== 'accepted') throw new Error('Status transition to accepted failed');

    // 9. Start Booking (Owner view)
    console.log('\n[TEST 10] Owner Starting Drilling Job...');
    const progressRes = await fetch(`${BASE_URL}/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'in_progress' }),
    });
    const progressData = await progressRes.json();
    console.log('Booking Progress Response:', progressData);

    // 10. Complete Booking (Owner view) - Auto-generates invoice
    console.log('\n[TEST 11] Owner Completing Drilling Job (200 ft)...');
    const completeRes = await fetch(`${BASE_URL}/bookings/${bookingId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        status: 'completed',
        depth: 200, // 200 ft * 75 pricePerFt = 15000
      }),
    });
    const completeData = await completeRes.json();
    console.log('Booking Complete Response:', completeData);

    // 11. Fetch Invoice
    console.log('\n[TEST 12] Fetching Auto-Generated Invoice...');
    const invoiceRes = await fetch(`${BASE_URL}/payments/booking/${bookingId}`, {
      headers: { Authorization: `Bearer ${customerToken}` },
    });
    const invoiceData = await invoiceRes.json();
    console.log('Invoice Details:', invoiceData.data);
    if (!invoiceData.success) throw new Error('Invoice fetching failed');
    paymentId = invoiceData.data._id;
    console.log(`Calculated Invoice Amount: Rs. ${invoiceData.data.amount} (Expected: 15000)`);
    if (invoiceData.data.amount !== 15000) throw new Error('Invoice pricing calculation incorrect');

    // 12. Pay Invoice
    console.log('\n[TEST 13] Paying the Invoice...');
    const payRes = await fetch(`${BASE_URL}/payments/${paymentId}/pay`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({ method: 'UPI' }),
    });
    const payData = await payRes.json();
    console.log('Payment Response:', payData);
    if (payData.data.status !== 'paid') throw new Error('Invoice payment update failed');

    // 13. Owner Summary
    console.log('\n[TEST 14] Owner Retrieving Earnings Summary...');
    const summaryRes = await fetch(`${BASE_URL}/payments/owner/summary`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const summaryData = await summaryRes.json();
    console.log('Owner Earnings Summary:', summaryData.data);
    if (summaryData.data.todayEarnings !== 15000) throw new Error('Owner today earnings calculation incorrect');

    // 14. Create Review
    console.log('\n[TEST 15] Customer Creating a Review...');
    const reviewRes = await fetch(`${BASE_URL}/reviews`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        bookingId,
        rating: 5,
        comment: 'Excellent work, quick drilling and very transparent prices!',
      }),
    });
    const reviewData = await reviewRes.json();
    console.log('Review Response:', reviewData);

    // 15. Verify Owner Rating Update
    console.log('\n[TEST 16] Fetching Owner Details to Verify Rating Update...');
    const checkOwnerRes = await fetch(`${BASE_URL}/owners/${ownerId}`);
    const checkOwnerData = await checkOwnerRes.json();
    console.log('Owner Details rating check:', checkOwnerData.data.rating);
    if (checkOwnerData.data.rating !== 5) throw new Error('Owner rating update failed');

    console.log('\n=== ALL DIAGNOSTIC TESTS PASSED SUCCESSFULLY! ===');
  } catch (err) {
    console.error('\n!!! DIAGNOSTIC TEST FAILED !!!');
    console.error(err);
    process.exit(1);
  }
}

runTests();
