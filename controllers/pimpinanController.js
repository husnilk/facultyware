const xlsx = require('xlsx');
const OfficialTravel = require('../models/OfficialTravel');
const TravelApproval = require('../models/TravelApproval');
const TravelItinerary = require('../models/TravelItinerary');
const TravelDocument = require('../models/TravelDocument');
const TravelMember = require('../models/TravelMember');
const TravelExpense = require('../models/TravelExpense');

const dashboard = async (req, res, next) => {
  try {
    const stats = await OfficialTravel.getStatsPimpinan();
    const expenseStats = await TravelExpense.getStatsPimpinan();

    // Get all travels
    const travels = await OfficialTravel.findAll();
    const pendingTravels = travels.filter(t => t.status === 'pending');
    
    // Get recent approvals/history (limit 5)
    const recentTravels = travels.slice(0, 5);

    res.render('pimpinan/dashboard', {
      title: 'Dashboard Pimpinan',
      stats,
      expenseStats,
      pendingTravels,
      recentTravels
    });
  } catch (err) {
    next(err);
  }
};

const listTravels = async (req, res, next) => {
  try {
    const travels = await OfficialTravel.findAll();
    res.render('pimpinan/travels', {
      title: 'Semua Perjalanan Dinas',
      travels
    });
  } catch (err) {
    next(err);
  }
};

const travelDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const travel = await OfficialTravel.findById(id);

    if (!travel) {
      req.session.error = 'Perjalanan dinas tidak ditemukan.';
      return res.redirect('/pimpinan/travels');
    }

    const itineraries = await TravelItinerary.findByTravelId(id);
    const documents = await TravelDocument.findByTravelId(id);
    const members = await TravelMember.findByTravelId(id);
    const expenses = await TravelExpense.findByTravelId(id);
    const approvals = await TravelApproval.findByTravelId(id);

    res.render('pimpinan/travel-detail', {
      title: `Approval: ${travel.request_number}`,
      travel,
      itineraries,
      documents,
      members,
      expenses,
      approvals
    });
  } catch (err) {
    next(err);
  }
};

const approveTravel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    const travel = await OfficialTravel.findById(id);
    if (!travel) {
      req.session.error = 'Perjalanan dinas tidak ditemukan.';
      return res.redirect('/pimpinan/travels');
    }

    // Update status in official_travel
    await OfficialTravel.updateStatus(id, 'approved', req.session.username || req.session.name, req.session.userId);

    // Insert history to official_travel_approvals
    await TravelApproval.create({
      official_travel_id: id,
      approver_id: req.session.userId,
      status: 'approved',
      notes,
      employee_id: travel.submitted_by_id || travel.submitted_by
    });

    req.session.success = `Permohonan ${travel.request_number} berhasil DISETUJUI.`;
    res.redirect(`/pimpinan/travels/detail/${id}`);
  } catch (err) {
    next(err);
  }
};

const rejectTravel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;

    if (!notes || notes.trim() === '') {
      req.session.error = 'Catatan penolakan harus diisi.';
      return res.redirect(`/pimpinan/travels/detail/${id}`);
    }

    const travel = await OfficialTravel.findById(id);
    if (!travel) {
      req.session.error = 'Perjalanan dinas tidak ditemukan.';
      return res.redirect('/pimpinan/travels');
    }

    // Update status in official_travel
    await OfficialTravel.updateStatus(id, 'rejected', req.session.username || req.session.name, req.session.userId);

    // Insert history to official_travel_approvals
    await TravelApproval.create({
      official_travel_id: id,
      approver_id: req.session.userId,
      status: 'rejected',
      notes,
      employee_id: travel.submitted_by_id || travel.submitted_by
    });

    req.session.warning = `Permohonan ${travel.request_number} telah DITOLAK dengan catatan.`;
    res.redirect(`/pimpinan/travels/detail/${id}`);
  } catch (err) {
    next(err);
  }
};

const listExpenses = async (req, res, next) => {
  try {
    const expenses = await TravelExpense.findAll();
    res.render('pimpinan/expenses', {
      title: 'Approval Reimburse',
      expenses
    });
  } catch (err) {
    next(err);
  }
};

const approveExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await TravelExpense.findById(id);

    if (!expense) {
      req.session.error = 'Reimburse tidak ditemukan.';
      return res.redirect('/pimpinan/expenses');
    }

    await TravelExpense.verify(id, 'approved');
    req.session.success = `Reimburse sebesar Rp ${Number(expense.amount).toLocaleString('id-ID')} disetujui.`;
    res.redirect('/pimpinan/expenses');
  } catch (err) {
    next(err);
  }
};

const rejectExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await TravelExpense.findById(id);

    if (!expense) {
      req.session.error = 'Reimburse tidak ditemukan.';
      return res.redirect('/pimpinan/expenses');
    }

    await TravelExpense.verify(id, 'rejected');
    req.session.warning = `Reimburse sebesar Rp ${Number(expense.amount).toLocaleString('id-ID')} ditolak.`;
    res.redirect('/pimpinan/expenses');
  } catch (err) {
    next(err);
  }
};

const listReports = async (req, res, next) => {
  try {
    const travels = await OfficialTravel.findAll();
    const completedTravels = travels.filter(t => t.status === 'completed');
    res.render('pimpinan/reports', {
      title: 'Laporan Perjalanan Dinas',
      travels: completedTravels
    });
  } catch (err) {
    next(err);
  }
};

// Export all travels
const exportAllTravels = async (req, res, next) => {
  try {
    const travels = await OfficialTravel.findAll();
    const data = travels.map(t => ({
      'Nomor Permohonan': t.request_number,
      'Diajukan Oleh': t.submitter_name || t.submitter_username || `ID ${t.submitted_by_id}`,
      'Keperluan': t.purpose,
      'Tujuan': t.destination,
      'Tanggal Mulai': t.start_date,
      'Tanggal Selesai': t.end_date,
      'Status': t.status.toUpperCase(),
      'Diajukan Tanggal': t.submitted_at ? new Date(t.submitted_at).toLocaleDateString() : '',
      'Disetujui Oleh': t.approved_by || '-',
      'Disetujui Tanggal': t.approved_at ? new Date(t.approved_at).toLocaleDateString() : '-',
      'Hasil Perjalanan': t.travel_outcome || '-',
      'Tindak Lanjut': t.outcome_followup || '-'
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Semua Perjalanan');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=semua-perjalanan-dinas.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

// Export all expenses
const exportAllExpenses = async (req, res, next) => {
  try {
    const expenses = await TravelExpense.findAll();
    const data = expenses.map(e => ({
      'Nomor Permohonan': e.request_number,
      'Pegawai': e.name,
      'Komponen Biaya': e.component_name,
      'Jumlah': e.amount,
      'Keterangan': e.description || '-',
      'Diajukan Tanggal': e.submitted_at ? new Date(e.submitted_at).toLocaleDateString() : '',
      'Status': e.status.toUpperCase(),
      'Diverifikasi Tanggal': e.verified_at ? new Date(e.verified_at).toLocaleDateString() : '-'
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Semua Reimburse');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=semua-reimburse.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};
// Fitur 12: Mengembalikan data seluruh perjalanan dinas dalam format JSON
const getAllTravelsJSON = async (req, res, next) => {
  try {
    // Tambahkan baris ini untuk memanggil modelnya secara lokal
    const OfficialTravel = require('../models/OfficialTravel'); 
    
    const travels = await OfficialTravel.findAll();
    res.json(travels);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  dashboard,
  listTravels,
  travelDetail,
  approveTravel,
  rejectTravel,
  listExpenses,
  approveExpense,
  rejectExpense,
  listReports,
  exportAllTravels,
  exportAllExpenses,
  getAllTravelsJSON
};
