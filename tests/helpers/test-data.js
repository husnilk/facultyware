/**
 * Test Data for FacultyWare Playwright E2E Tests
 * 
 * IMPORTANT: These credentials must match existing users in the database.
 * Update these values to reflect your test environment.
 * DO NOT use production credentials here.
 */

const TEST_USERS = {
  pegawai: {
    username: 'pegawai',
    password: 'password',
    role: 'pegawai',
    expectedDashboardURL: '/pegawai/dashboard',
  },
  pimpinan: {
    username: 'pimpinan',
    password: 'password',
    role: 'pimpinan',
    expectedDashboardURL: '/pimpinan/dashboard',
  },
  invalid: {
    username: 'nonexistentuser_xyz',
    password: 'wrongpassword123',
  },
};

const URLS = {
  // Public
  root: '/',
  login: '/login',
  logout: '/logout',
  
  // Pegawai
  pegawaiDashboard: '/pegawai/dashboard',
  pegawaiTravels: '/pegawai/travels',
  pegawaiTravelsCreate: '/pegawai/travels/create',
  pegawaiExpenses: '/pegawai/expenses',
  pegawaiExpensesCreate: '/pegawai/expenses/create',
  
  // Pimpinan
  pimpinanDashboard: '/pimpinan/dashboard',
  pimpinanTravels: '/pimpinan/travels',
  pimpinanExpenses: '/pimpinan/expenses',
  pimpinanReports: '/pimpinan/reports',
  
  // API
  apiMyTravel: '/api/my-travel',
  apiMyExpenses: '/api/my-expenses',
  apiMyDocuments: '/api/my-documents',
  apiTravel: '/api/travel',
  apiExpenses: '/api/expenses',
  apiReports: '/api/reports',
  
  // Static assets
  stylesCSS: '/assets/styles.css',
};

const TRAVEL_TEST_DATA = {
  purpose: '[E2E-TEST] Kunjungan riset kolaborasi antar universitas',
  destination: 'Bandung, Jawa Barat',
  start_date: '2026-12-01',
  end_date: '2026-12-05',
};

const TRAVEL_UPDATE_DATA = {
  purpose: '[E2E-TEST] Update: Kunjungan riset kolaborasi antar universitas (diperbarui)',
  destination: 'Surabaya, Jawa Timur',
  start_date: '2026-12-10',
  end_date: '2026-12-15',
};

const EXPENSE_TEST_DATA = {
  amount: '750000',
  description: '[E2E-TEST] Biaya transportasi Kereta Api Jakarta-Bandung PP',
};

module.exports = {
  TEST_USERS,
  URLS,
  TRAVEL_TEST_DATA,
  TRAVEL_UPDATE_DATA,
  EXPENSE_TEST_DATA,
};
