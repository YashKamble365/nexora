const BASE_URL = process.env.API_URL || 'https://nexora-svl9.onrender.com/api';

async function login(email: string, password = 'password123') {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json() as any;
  if (!res.ok) throw new Error(`Login failed for ${email}: ${JSON.stringify(data)}`);
  return { token: data.token, user: data.user };
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  console.log(`  ✓ ${message}`);
}

async function run() {
  console.log('\n--- VERIFYING LIVE GOVERNANCE & ACCESS CONTROL ---\n');
  console.log(`Target: ${BASE_URL}\n`);

  // 1. Authenticate users
  const superAdmin = await login('superadmin@nexora.edu', 'super123');
  console.log(`✓ Super Admin logged in: ${superAdmin.user.name} (${superAdmin.user.role})`);

  const campusAdmin = await login('admin@prpcem.edu', 'admin123');
  console.log(`✓ Campus Admin logged in: ${campusAdmin.user.name} (${campusAdmin.user.role})`);

  const student = await login('prathamesh.patange@prpcem.edu', 'student123');
  console.log(`✓ Student logged in: ${student.user.name} (${student.user.role})`);

  // 2. Test Super Admin Approvals (Institutes list)
  const instRes = await fetch(`${BASE_URL}/institutes/all`, {
    headers: { Authorization: `Bearer ${superAdmin.token}` },
  });
  const instData = await instRes.json() as any;
  assert(instRes.ok, 'Super Admin can fetch /institutes/all');
  assert(Array.isArray(instData.institutes) && instData.institutes.length > 0, `Super Admin sees ${instData.institutes?.length} colleges`);

  // 3. Test Student cannot access Super Admin /institutes/all
  const studentInstRes = await fetch(`${BASE_URL}/institutes/all`, {
    headers: { Authorization: `Bearer ${student.token}` },
  });
  assert(studentInstRes.status === 403, 'Student blocked from /institutes/all (403 Forbidden)');

  // 4. Test Student blocked from /admin/users
  const studentUsersRes = await fetch(`${BASE_URL}/admin/users`, {
    headers: { Authorization: `Bearer ${student.token}` },
  });
  assert(studentUsersRes.status === 403, 'Student blocked from /admin/users (403 Forbidden)');

  // 5. Test Super Admin can access /admin/users
  const adminUsersRes = await fetch(`${BASE_URL}/admin/users?page=1&limit=5`, {
    headers: { Authorization: `Bearer ${superAdmin.token}` },
  });
  const adminUsersData = await adminUsersRes.json() as any;
  assert(adminUsersRes.ok, 'Super Admin can query global /admin/users');
  assert(adminUsersData.total > 0, `Super Admin sees all ${adminUsersData.total} users across all campuses`);

  console.log('\n=============================================');
  console.log('✓ ALL LIVE ROLE SECURITY & GOVERNANCE CHECKS PASSED');
  console.log('=============================================\n');
}

run().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
