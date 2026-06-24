const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');
const PDFDocument = require('pdfkit');
const db = require('../lib/db');
const OfficialTravel = require('../models/OfficialTravel');
const TravelItinerary = require('../models/TravelItinerary');
const TravelDocument = require('../models/TravelDocument');
const TravelMember = require('../models/TravelMember');
const TravelExpense = require('../models/TravelExpense');
const TravelCostComponent = require('../models/TravelCostComponent');

// Ensure upload directories exist
const uploadDocDir = path.join(__dirname, '../public/uploads/documents');
const uploadRcptDir = path.join(__dirname, '../public/uploads/receipts');
if (!fs.existsSync(uploadDocDir)) fs.mkdirSync(uploadDocDir, { recursive: true });
if (!fs.existsSync(uploadRcptDir)) fs.mkdirSync(uploadRcptDir, { recursive: true });

const dashboard = async (req, res, next) => {
  try {
    const stats = await OfficialTravel.getStatsPegawai(req.session.userId);
    const expenseStats = await TravelExpense.getStatsPegawai(req.session.userId);
    
    // Get recent travel requests (limit 5)
    const travels = await OfficialTravel.findBySubmittedBy(req.session.userId);
    const recentTravels = travels.slice(0, 5);

    res.render('pegawai/dashboard', {
      title: 'Dashboard Pegawai',
      stats,
      expenseStats,
      recentTravels
    });
  } catch (err) {
    next(err);
  }
};
const listTravels = async (req, res, next) => {
  try {
    const { search = '', status = '' } = req.query;
    const travels = await OfficialTravel.findBySubmittedBy(
      req.session.userId,
      search.trim(),
      status.trim()
    );
    res.render('pegawai/travels', {
      title: 'Daftar Perjalanan Dinas',
      travels,
      query: { search, status }
    });
  } catch (err) {
    next(err);
  }
};

const travelForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    let travel = null;
    if (id) {
      travel = await OfficialTravel.findById(id);
      if (!travel || travel.submitted_by_id !== req.session.userId) {
        req.session.error = 'Perjalanan dinas tidak ditemukan atau Anda tidak memiliki akses.';
        return res.redirect('/pegawai/travels');
      }
      if (travel.status !== 'draft' && travel.status !== 'pending') {
        req.session.warning = 'Perjalanan dinas tidak dapat diedit karena status bukan Draft atau Pending.';
        return res.redirect('/pegawai/travels');
      }
    }

    res.render('pegawai/travel-form', {
      title: travel ? 'Edit Perjalanan Dinas' : 'Tambah Perjalanan Dinas',
      travel
    });
  } catch (err) {
    next(err);
  }
};

const saveTravel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { purpose, destination, start_date, end_date } = req.body;

    const file = req.file;
    let invitation_file = null;
    if (file) {
      invitation_file = `/uploads/documents/${file.filename}`;
    }

    if (id) {
      // Edit
      const travel = await OfficialTravel.findById(id);
      if (!travel || travel.submitted_by_id !== req.session.userId) {
        req.session.error = 'Perjalanan dinas tidak ditemukan.';
        return res.redirect('/pegawai/travels');
      }
      if (travel.status !== 'draft' && travel.status !== 'pending') {
        req.session.error = 'Perjalanan dinas tidak dapat diedit karena status bukan Draft atau Pending.';
        return res.redirect('/pegawai/travels');
      }

      await OfficialTravel.update(id, {
        purpose,
        destination,
        start_date,
        end_date,
        invitation_file
      });

      req.session.success = 'Perjalanan dinas berhasil diperbarui.';
      res.redirect(`/pegawai/travels/detail/${id}`);
    } else {
      // Create
      // Auto-generate request_number
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const request_number = `SPD/${dateStr}/${randomNum}`;

      const newId = await OfficialTravel.create({
        request_number,
        purpose,
        destination,
        start_date,
        end_date,
        invitation_file,
        submitted_by: req.session.employeeId || req.session.userId,
        submitted_by_id: req.session.userId
      });

      req.session.success = 'Perjalanan dinas berhasil ditambahkan sebagai Draft.';
      res.redirect(`/pegawai/travels/detail/${newId}`);
    }
  } catch (err) {
    next(err);
  }
};

const travelDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const travel = await OfficialTravel.findById(id);

    if (!travel || travel.submitted_by_id !== req.session.userId) {
      req.session.error = 'Perjalanan dinas tidak ditemukan atau Anda tidak memiliki akses.';
      return res.redirect('/pegawai/travels');
    }

    const itineraries = await TravelItinerary.findByTravelId(id);
    const documents = await TravelDocument.findByTravelId(id);
    const members = await TravelMember.findByTravelId(id);
    const expenses = await TravelExpense.findByTravelId(id);
    const costComponents = await TravelCostComponent.findAll();
    const availableEmployees = await TravelMember.getAvailableEmployees();

    res.render('pegawai/travel-detail', {
      title: `Detail Perjalanan: ${travel.request_number}`,
      travel,
      itineraries,
      documents,
      members,
      expenses,
      costComponents,
      availableEmployees
    });
  } catch (err) {
    next(err);
  }
};

const deleteTravel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const travel = await OfficialTravel.findById(id);

    if (!travel || travel.submitted_by_id !== req.session.userId) {
      req.session.error = 'Perjalanan dinas tidak ditemukan.';
      return res.redirect('/pegawai/travels');
    }

    if (travel.status !== 'draft' && travel.status !== 'pending') {
      req.session.error = 'Perjalanan dinas tidak dapat dihapus karena status bukan Draft atau Pending.';
      return res.redirect('/pegawai/travels');
    }

    await OfficialTravel.delete(id);
    req.session.success = 'Perjalanan dinas berhasil dihapus.';
    res.redirect('/pegawai/travels');
  } catch (err) {
    next(err);
  }
};

const submitTravel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const travel = await OfficialTravel.findById(id);

    if (!travel || travel.submitted_by_id !== req.session.userId) {
      req.session.error = 'Perjalanan dinas tidak ditemukan.';
      return res.redirect('/pegawai/travels');
    }

    if (travel.status !== 'draft') {
      req.session.warning = 'Perjalanan dinas sudah diajukan sebelumnya.';
      return res.redirect(`/pegawai/travels/detail/${id}`);
    }

    await OfficialTravel.updateStatus(id, 'pending');
    req.session.success = 'Perjalanan dinas berhasil diajukan untuk approval.';
    res.redirect(`/pegawai/travels/detail/${id}`);
  } catch (err) {
    next(err);
  }
};

// Document methods
const uploadDocument = async (req, res, next) => {
  try {
    const { official_travel_id, title } = req.body;
    const file = req.file;

    if (!file) {
      req.session.error = 'File tidak boleh kosong.';
      return res.redirect(`/pegawai/travels/detail/${official_travel_id}`);
    }

    await TravelDocument.create({
      official_travel_id,
      title,
      file_path: `/uploads/documents/${file.filename}`,
      file_type: file.mimetype
    });

    req.session.success = 'Dokumen perjalanan berhasil diunggah.';
    res.redirect(`/pegawai/travels/detail/${official_travel_id}`);
  } catch (err) {
    next(err);
  }
};

const deleteDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doc = await TravelDocument.findById(id);
    if (!doc) {
      req.session.error = 'Dokumen tidak ditemukan.';
      return res.redirect('/pegawai/travels');
    }

    const travel = await OfficialTravel.findById(doc.official_travel_id);
    if (!travel || travel.submitted_by_id !== req.session.userId) {
      req.session.error = 'Anda tidak memiliki akses.';
      return res.redirect('/pegawai/travels');
    }

    // Optional: Delete physical file
    const physicalPath = path.join(__dirname, '../public', doc.file_path);
    if (fs.existsSync(physicalPath)) {
      try { fs.unlinkSync(physicalPath); } catch (e) {}
    }

    await TravelDocument.delete(id);
    req.session.success = 'Dokumen perjalanan berhasil dihapus.';
    res.redirect(`/pegawai/travels/detail/${doc.official_travel_id}`);
  } catch (err) {
    next(err);
  }
};

// Itinerary methods
const saveItinerary = async (req, res, next) => {
  try {
    const { official_travel_id, date, location, activity, description } = req.body;
    await TravelItinerary.create({
      official_travel_id,
      date,
      location,
      activity,
      description
    });
    req.session.success = 'Jadwal perjalanan berhasil ditambahkan.';
    res.redirect(`/pegawai/travels/detail/${official_travel_id}`);
  } catch (err) {
    next(err);
  }
};

const deleteItinerary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const itinerary = await TravelItinerary.findById(id);
    if (!itinerary) {
      req.session.error = 'Jadwal tidak ditemukan.';
      return res.redirect('/pegawai/travels');
    }

    await TravelItinerary.delete(id);
    req.session.success = 'Jadwal perjalanan berhasil dihapus.';
    res.redirect(`/pegawai/travels/detail/${itinerary.official_travel_id}`);
  } catch (err) {
    next(err);
  }
};

// Member methods
const saveMember = async (req, res, next) => {
  try {
    const { official_travel_id, employee_id, role, report_date, summary } = req.body;
    
    const file = req.file;
    let attachment = null;
    if (file) {
      attachment = `/uploads/documents/${file.filename}`;
    }

    await TravelMember.create({
      official_travel_id,
      employee_id,
      role,
      report_date,
      summary,
      attachment
    });

    req.session.success = 'Anggota perjalanan berhasil ditambahkan.';
    res.redirect(`/pegawai/travels/detail/${official_travel_id}`);
  } catch (err) {
    next(err);
  }
};

const deleteMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const member = await TravelMember.findById(id);
    if (!member) {
      req.session.error = 'Anggota tidak ditemukan.';
      return res.redirect('/pegawai/travels');
    }

    await TravelMember.delete(id);
    req.session.success = 'Anggota perjalanan berhasil dihapus.';
    res.redirect(`/pegawai/travels/detail/${member.official_travel_id}`);
  } catch (err) {
    next(err);
  }
};

// Outcome / Report
const saveOutcome = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { travel_outcome, outcome_followup } = req.body;

    const travel = await OfficialTravel.findById(id);
    if (!travel || travel.submitted_by_id !== req.session.userId) {
      req.session.error = 'Perjalanan dinas tidak ditemukan.';
      return res.redirect('/pegawai/travels');
    }

    if (travel.status !== 'approved' && travel.status !== 'completed') {
      req.session.error = 'Laporan hanya bisa diisi jika perjalanan sudah disetujui atau selesai.';
      return res.redirect(`/pegawai/travels/detail/${id}`);
    }

    await OfficialTravel.updateOutcome(id, travel_outcome, outcome_followup);
    req.session.success = 'Laporan hasil perjalanan dinas disimpan. Status perjalanan diubah menjadi Completed.';
    res.redirect(`/pegawai/travels/detail/${id}`);
  } catch (err) {
    next(err);
  }
};

// Expenses CRUD
const listExpenses = async (req, res, next) => {
  try {
    const expenses = await TravelExpense.findBySubmittedBy(req.session.employeeId || req.session.userId);
    res.render('pegawai/expenses', {
      title: 'Daftar Reimburse',
      expenses
    });
  } catch (err) {
    next(err);
  }
};

const expenseForm = async (req, res, next) => {
  try {
    const { id } = req.params;
    let expense = null;
    if (id) {
      expense = await TravelExpense.findById(id);
      if (!expense || expense.employee_id !== (req.session.employeeId || req.session.userId)) {
        req.session.error = 'Data reimburse tidak ditemukan.';
        return res.redirect('/pegawai/expenses');
      }
      if (expense.status !== 'submitted') {
        req.session.error = 'Reimburse tidak dapat diedit karena sudah diproses oleh Pimpinan.';
        return res.redirect('/pegawai/expenses');
      }
    }

    const travels = await OfficialTravel.findBySubmittedBy(req.session.userId);
    const approvedTravels = travels.filter(t => t.status === 'approved' || t.status === 'completed');
    const costComponents = await TravelCostComponent.findAll();

    res.render('pegawai/expense-form', {
      title: expense ? 'Edit Pengajuan Reimburse' : 'Tambah Pengajuan Reimburse',
      expense,
      travels: approvedTravels,
      costComponents
    });
  } catch (err) {
    next(err);
  }
};

const saveExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { official_travel_id, travel_cost_component_id, amount, description } = req.body;
    const file = req.file;

    let receipt_file = null;
    if (file) {
      receipt_file = `/uploads/receipts/${file.filename}`;
    }

    if (id) {
      const expense = await TravelExpense.findById(id);
      if (!expense || expense.employee_id !== (req.session.employeeId || req.session.userId)) {
        req.session.error = 'Data reimburse tidak ditemukan.';
        return res.redirect('/pegawai/expenses');
      }
      if (expense.status !== 'submitted') {
        req.session.error = 'Reimburse tidak dapat diedit karena sudah diproses.';
        return res.redirect('/pegawai/expenses');
      }

      await TravelExpense.update(id, {
        travel_cost_component_id,
        amount,
        description,
        receipt_file
      });

      req.session.success = 'Data reimburse berhasil diperbarui.';
    } else {
      await TravelExpense.create({
        official_travel_id,
        employee_id: req.session.employeeId || req.session.userId,
        travel_cost_component_id,
        amount,
        description,
        receipt_file
      });

      req.session.success = 'Pengajuan reimburse berhasil dikirim.';
    }

    res.redirect('/pegawai/expenses');
  } catch (err) {
    next(err);
  }
};

const deleteExpense = async (req, res, next) => {
  try {
    const { id } = req.params;
    const expense = await TravelExpense.findById(id);
    if (!expense || expense.employee_id !== (req.session.employeeId || req.session.userId)) {
      req.session.error = 'Data reimburse tidak ditemukan.';
      return res.redirect('/pegawai/expenses');
    }
    if (expense.status !== 'submitted') {
      req.session.error = 'Reimburse tidak dapat dihapus karena sudah diproses.';
      return res.redirect('/pegawai/expenses');
    }

    // Optional physical deletion
    if (expense.receipt_file) {
      const physicalPath = path.join(__dirname, '../public', expense.receipt_file);
      if (fs.existsSync(physicalPath)) {
        try { fs.unlinkSync(physicalPath); } catch (e) {}
      }
    }

    await TravelExpense.delete(id);
    req.session.success = 'Data reimburse berhasil dihapus.';
    res.redirect('/pegawai/expenses');
  } catch (err) {
    next(err);
  }
};

// Export Travels list to Excel
const exportTravels = async (req, res, next) => {
  try {
    const travels = await OfficialTravel.findBySubmittedBy(req.session.userId);
    const data = travels.map(t => ({
      'Nomor Permohonan': t.request_number,
      'Keperluan / Tujuan': t.purpose,
      'Tujuan Destinasi': t.destination,
      'Tanggal Mulai': t.start_date,
      'Tanggal Selesai': t.end_date,
      'Status': t.status.toUpperCase(),
      'Diajukan Tanggal': t.submitted_at ? new Date(t.submitted_at).toLocaleDateString() : '',
      'Disetujui Oleh': t.approved_by || '-',
      'Disetujui Tanggal': t.approved_at ? new Date(t.approved_at).toLocaleDateString() : '-'
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Perjalanan Dinas');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=perjalanan-dinas-pegawai.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

// Import Travels from Excel
const importTravels = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      req.session.error = 'File Excel tidak ditemukan.';
      return res.redirect('/pegawai/travels');
    }

    const workbook = xlsx.readFile(file.path);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    let count = 0;
    for (const row of rows) {
      // Parse dates safely
      let start_date = row['Tanggal Mulai'] || row['Start Date'];
      let end_date = row['Tanggal Selesai'] || row['End Date'];
      const purpose = row['Keperluan / Tujuan'] || row['Purpose'] || 'Impor Perjalanan';
      const destination = row['Tujuan Destinasi'] || row['Destination'] || 'Impor';

      if (!start_date || !end_date) continue;

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomNum = Math.floor(1000 + Math.random() * 9000);
      const request_number = `SPD/${dateStr}/${randomNum}`;

      await OfficialTravel.create({
        request_number,
        purpose,
        destination,
        start_date: new Date(start_date).toISOString().slice(0, 10),
        end_date: new Date(end_date).toISOString().slice(0, 10),
        invitation_file: null,
        status: 'draft',
        travel_outcome: null,
        outcome_followup: null,
        submitted_by: req.session.employeeId || req.session.userId,
        submitted_by_id: req.session.userId
      });
      count++;
    }

    // Delete temp file
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    req.session.success = `Berhasil mengimpor ${count} data perjalanan dinas dari Excel.`;
    res.redirect('/pegawai/travels');
  } catch (err) {
    next(err);
  }
};

// Export Reports list to Excel
const exportReports = async (req, res, next) => {
  try {
    const travels = await OfficialTravel.findBySubmittedBy(req.session.userId);
    const completedTravels = travels.filter(t => t.status === 'completed' || t.travel_outcome);
    const data = completedTravels.map(t => ({
      'Nomor Permohonan': t.request_number,
      'Keperluan / Tujuan': t.purpose,
      'Tujuan Destinasi': t.destination,
      'Hasil Perjalanan': t.travel_outcome || '',
      'Rencana Tindak Lanjut': t.outcome_followup || ''
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Laporan Perjalanan');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=laporan-perjalanan-pegawai.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

// Import Reports from Excel
const importReports = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      req.session.error = 'File Excel tidak ditemukan.';
      return res.redirect('/pegawai/travels');
    }

    const workbook = xlsx.readFile(file.path);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    let count = 0;
    for (const row of rows) {
      const requestNumber = row['Nomor Permohonan'] || row['Request Number'];
      const travel_outcome = row['Hasil Perjalanan'] || row['Outcome'];
      const outcome_followup = row['Rencana Tindak Lanjut'] || row['Followup'] || '';

      if (!requestNumber || !travel_outcome) continue;

      const travelList = await OfficialTravel.findBySubmittedBy(req.session.userId);
      const matchedTravel = travelList.find(
        t => t.request_number === requestNumber.trim() && (t.status === 'approved' || t.status === 'completed')
      );

      if (!matchedTravel) continue;

      await OfficialTravel.updateOutcome(matchedTravel.id, travel_outcome, outcome_followup);
      count++;
    }

    // Delete temp file
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    req.session.success = `Berhasil mengimpor ${count} laporan perjalanan dari Excel.`;
    res.redirect('/pegawai/travels');
  } catch (err) {
    next(err);
  }
};

// Export Expenses to Excel
const exportExpenses = async (req, res, next) => {
  try {
    const expenses = await TravelExpense.findBySubmittedBy(req.session.employeeId || req.session.userId);
    const data = expenses.map(e => ({
      'Nomor Permohonan': e.request_number,
      'Komponen Biaya': e.component_name,
      'Jumlah': e.amount,
      'Keterangan': e.description || '-',
      'Diajukan Tanggal': e.submitted_at ? new Date(e.submitted_at).toLocaleDateString() : '',
      'Status': e.status.toUpperCase()
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Reimburse');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=reimburse-pegawai.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

// Import Expenses from Excel
const importExpenses = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) {
      req.session.error = 'File Excel tidak ditemukan.';
      return res.redirect('/pegawai/expenses');
    }

    const workbook = xlsx.readFile(file.path);
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    const rows = xlsx.utils.sheet_to_json(worksheet);

    const costComponents = await TravelCostComponent.findAll();

    let count = 0;
    for (const row of rows) {
      const requestNumber = row['Nomor Permohonan'] || row['Request Number'];
      const componentInput = row['Komponen Biaya'] || row['Cost Component'];
      const amount = row['Jumlah'] || row['Amount'];
      const description = row['Keterangan'] || row['Description'] || '';

      if (!requestNumber || !componentInput || !amount) continue;

      // 1. Look up Travel by request number and user ID
      const [travelRows] = await db.query(
        'SELECT id FROM official_travel WHERE request_number = ? AND submitted_by_id = ?',
        [requestNumber.trim(), req.session.userId]
      );
      if (travelRows.length === 0) continue;

      const official_travel_id = travelRows[0].id;

      // 2. Find matching cost component
      const componentStr = componentInput.toString().trim().toLowerCase();
      let matchedComponent = costComponents.find(
        c => c.name.toLowerCase() === componentStr || c.code.toLowerCase() === componentStr
      );

      if (!matchedComponent) {
        matchedComponent = costComponents.find(
          c => c.name.toLowerCase().includes(componentStr) || c.code.toLowerCase().includes(componentStr)
        );
      }

      const travel_cost_component_id = matchedComponent ? matchedComponent.id : (costComponents[0] ? costComponents[0].id : 1);

      // 3. Create Travel Expense
      await TravelExpense.create({
        official_travel_id,
        employee_id: req.session.employeeId || req.session.userId,
        travel_cost_component_id,
        amount: parseFloat(amount),
        description: description === '-' ? null : description,
        receipt_file: null
      });

      count++;
    }

    // Delete temp file
    if (fs.existsSync(file.path)) fs.unlinkSync(file.path);

    req.session.success = `Berhasil mengimpor ${count} klaim reimburse dari Excel.`;
    res.redirect('/pegawai/expenses');
  } catch (err) {
    next(err);
  }
};

// PDF Surat Tugas Printing
const printTravelPDF = async (req, res, next) => {
  try {
    const { id } = req.params;
    const travel = await OfficialTravel.findById(id);

    if (!travel || travel.submitted_by_id !== req.session.userId) {
      req.session.error = 'Perjalanan dinas tidak ditemukan.';
      return res.redirect('/pegawai/travels');
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Disposition', `attachment; filename=Surat-Tugas-${travel.request_number.replace(/\//g, '-')}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    doc.pipe(res);

    // Write PDF Content
    doc.fontSize(20).text('SURAT TUGAS PERJALANAN DINAS', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(12).text(`Nomor Dokumen: ${travel.request_number}`, { align: 'center' });
    doc.moveDown(1.5);

    const startX = 50;
    let currentY = 150;

    doc.fontSize(12).text('Yang bertanda tangan di bawah ini menerangkan bahwa:', startX, currentY);
    doc.moveDown(1);

    const labels = [
      { key: 'Nama Pegawai', val: travel.submitter_name || req.session.name },
      { key: 'Keperluan Tugas', val: travel.purpose },
      { key: 'Destinasi Tujuan', val: travel.destination },
      { key: 'Tanggal Keberangkatan', val: new Date(travel.start_date).toLocaleDateString('id-ID') },
      { key: 'Tanggal Kepulangan', val: new Date(travel.end_date).toLocaleDateString('id-ID') },
      { key: 'Status Permohonan', val: travel.status.toUpperCase() }
    ];

    labels.forEach(item => {
      doc.font('Helvetica-Bold').text(`${item.key}:`, startX, doc.y);
      doc.font('Helvetica').text(item.val, startX + 160, doc.y - 12);
      doc.moveDown(0.8);
    });

    doc.moveDown(2);
    doc.text('Demikian surat tugas ini diterbitkan agar dapat dilaksanakan dengan penuh tanggung jawab.', startX, doc.y);
    doc.moveDown(3);

    // Signatures
    const dateToday = new Date().toLocaleDateString('id-ID');
    doc.text(`Jakarta, ${dateToday}`, 350, doc.y);
    doc.moveDown(0.5);
    doc.text('Mengetahui,', 350, doc.y);
    doc.text('Pimpinan Fakultas', 350, doc.y);
    doc.moveDown(2.5);
    doc.font('Helvetica-Bold').text(travel.approved_by || 'Administrasi Fakultas', 350, doc.y);

    doc.end();
  } catch (err) {
    next(err);
  }
};

module.exports = {
  dashboard,
  listTravels,
  travelForm,
  saveTravel,
  travelDetail,
  deleteTravel,
  submitTravel,
  uploadDocument,
  deleteDocument,
  saveItinerary,
  deleteItinerary,
  saveMember,
  deleteMember,
  saveOutcome,
  listExpenses,
  expenseForm,
  saveExpense,
  deleteExpense,
  exportTravels,
  importTravels,
  exportReports,
  importReports,
  exportExpenses,
  importExpenses,
  printTravelPDF
};
