import axios from 'axios';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const API_URL = `http://localhost:${process.env.PORT || 4000}/api/v1`;

const TEST_USERS = [
  { email: 'admin@example.com', password: 'password123', role: 'admin' },
  { email: 'teacher@example.com', password: 'password123', role: 'teacher' },
  { email: 'student@example.com', password: 'password123', role: 'student' }
];

async function verify() {
  console.log('🧪 Starting Backend Auth Verification...');

  for (const user of TEST_USERS) {
    console.log(`\n➜ Testing ${user.email}...`);

    try {
      // 1. Login
      console.log(`  - Attempting login as ${user.role}...`);
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: user.email,
        password: user.password,
        selectedRole: user.role === 'admin' ? 'teacher' : user.role // Assume admin uses teacher path if no specific button
      });

      if (loginRes.data.success) {
        console.log('  ✅ Login Successful!');
        const { session } = loginRes.data.data;
        const token = session.access_token;

        // 2. Fetch Profile
        console.log('  - Attempting to fetch profile (/me)...');
        const meRes = await axios.get(`${API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (meRes.data.success) {
          console.log(`  ✅ Profile Fetched! Role: ${meRes.data.data.role}`);
          if (meRes.data.data.role !== user.role) {
            console.warn(`  ⚠️ Role mismatch: Expected ${user.role}, got ${meRes.data.data.role}`);
          }
        } else {
          console.error('  ❌ Profile Fetch Failed:', meRes.data.message);
        }
      } else {
        console.error('  ❌ Login Failed:', loginRes.data.message);
      }
    } catch (err: any) {
      console.error('  ❌ Request Error:', err.response?.data?.message || err.message);
    }
  }

  console.log('\n🏁 Verification complete!');
}

verify().catch(console.error);
