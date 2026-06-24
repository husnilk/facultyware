/**
 * CSS/Playwright Selectors for FacultyWare E2E Tests
 * 
 * Centralized selectors derived from the actual EJS templates.
 * Uses data-slot attributes, IDs, and semantic selectors matching the real markup.
 */

const SELECTORS = {
  // ========================
  // LOGIN PAGE
  // ========================
  login: {
    form: 'form[action="/login"]',
    usernameInput: '#username',
    passwordInput: '#password',
    submitButton: 'button[type="submit"]',
    errorMessage: '.bg-destructive\\/15',
    heading: 'h1',
  },

  // ========================
  // GENERAL / LAYOUT
  // ========================
  layout: {
    sidebar: '[data-slot="sidebar"]',
    card: '[data-slot="card"]',
    toaster: '#toaster',
    successAlert: '.bg-emerald-500, .text-emerald-600',
    errorAlert: '.bg-destructive',
  },

  // ========================
  // PEGAWAI DASHBOARD
  // ========================
  pegawaiDashboard: {
    statsCards: '[data-slot="card"]',
    totalPermohonan: 'h3:has-text("Total Permohonan")',
    disetujui: 'h3:has-text("Disetujui")',
    menungguApproval: 'h3:has-text("Menunggu Approval")',
    totalReimburse: 'h3:has-text("Total Reimburse")',
    recentTravelsTable: 'table',
    lihatSemua: 'a:has-text("Lihat Semua")',
    statistikStatus: 'h3:has-text("Statistik Status")',
  },

  // ========================
  // PEGAWAI TRAVELS
  // ========================
  pegawaiTravels: {
    table: 'table',
    createButton: 'a[href="/pegawai/travels/create"]',
    detailLink: 'a:has-text("Detail")',
    editLink: 'a:has-text("Edit")',
    deleteLink: 'a:has-text("Hapus")',
    submitLink: 'a:has-text("Ajukan")',
    exportButton: 'a[href="/pegawai/export/travels"]',
  },

  // ========================
  // PEGAWAI TRAVEL FORM
  // ========================
  travelForm: {
    form: 'form[action^="/pegawai/travels/"]',
    purposeInput: '#purpose',
    destinationInput: '#destination',
    startDateInput: '#start_date',
    endDateInput: '#end_date',
    invitationInput: '#invitation',
    submitButton: 'button[type="submit"]',
    cancelLink: 'a:has-text("Batal")',
  },

  // ========================
  // PEGAWAI TRAVEL DETAIL
  // ========================
  travelDetail: {
    requestNumber: 'text=/SPD\\//i',
    statusBadge: '[class*="badge-"]',
    itinerariesTable: 'table',
    documentsSection: 'h3:has-text("Dokumen")',
    membersSection: 'h3:has-text("Anggota")',
  },

  // ========================
  // PEGAWAI EXPENSES
  // ========================
  pegawaiExpenses: {
    table: 'table',
    createButton: 'a[href="/pegawai/expenses/create"]',
    exportButton: 'a[href="/pegawai/export/expenses"]',
  },

  // ========================
  // PEGAWAI EXPENSE FORM
  // ========================
  expenseForm: {
    form: 'form[action^="/pegawai/expenses/"]',
    travelSelect: '#official_travel_id',
    costComponentSelect: '#travel_cost_component_id',
    amountInput: '#amount',
    descriptionInput: '#description',
    receiptInput: '#receipt',
    submitButton: 'button[type="submit"]',
  },

  // ========================
  // PIMPINAN DASHBOARD
  // ========================
  pimpinanDashboard: {
    statsCards: '[data-slot="card"]',
    totalPerjalanan: 'h3:has-text("Total Perjalanan Dinas")',
    pendingApproval: 'h3:has-text("Pending Approval")',
    laporanSelesai: 'h3:has-text("Laporan Selesai")',
    klaimReimburse: 'h3:has-text("Klaim Reimburse Pending")',
    pendingTable: 'table',
    prosesLink: 'a:has-text("Proses")',
    statistikSection: 'h3:has-text("Statistik Perjalanan Dinas")',
  },

  // ========================
  // PIMPINAN TRAVEL DETAIL (APPROVAL)
  // ========================
  pimpinanApproval: {
    approvalForm: '#approvalForm',
    notesInput: '#notes',
    approveButton: 'button:has-text("Setujui")',
    rejectButton: 'button:has-text("Tolak")',
    keputusanHeading: 'h3:has-text("Keputusan Pimpinan")',
    travelInfoCard: 'h3:has-text("Informasi Perjalanan")',
    approvalHistory: 'h3:has-text("Riwayat Log Approval")',
  },

  // ========================
  // PIMPINAN EXPENSES
  // ========================
  pimpinanExpenses: {
    table: 'table',
    approveLink: 'a:has-text("Approve")',
    rejectLink: 'a:has-text("Reject")',
    exportButton: 'a[href="/pimpinan/export/expenses"]',
  },
};

module.exports = SELECTORS;
