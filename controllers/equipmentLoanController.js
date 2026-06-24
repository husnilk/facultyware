const db = require('../lib/db');
const PDFDocument = require('pdfkit');

// ==========================================
// 1. FITUR CRUD & DASHBOARD
// ==========================================
// 1. Equipment Loans Dashboard
const index = async (req, res, next) => {
  try {
    const userId = req.session.userId; // this is users.id
    
    const [userRows] = await db.query(`SELECT name, email FROM users WHERE id = ?`, [userId]);
    const currentUser = userRows[0];
    // Fetch loan data for the logged-in user (employee_id matches users.id in this app)
    const [rows] = await db.query(`
      SELECT el.*, a.name AS equipment_name, a.code AS asset_code 
      FROM equipment_loans el
      JOIN equipments eq ON el.equipment_id = eq.id
      JOIN assets a ON eq.asset_id = a.id
      WHERE el.employee_id = ?
      ORDER BY el.created_at DESC
    `, [userId]);

    res.render('equipment-loans/index', { 
      title: 'Peminjaman Peralatan', 
      data: rows, 
      user: currentUser
    
    });
  } catch (err) {
    next(err);
  }
};

// 2A. Show Create Page
const createPage = async (req, res, next) => {
  try {
    // Fetch available equipments for dropdown
    const [equipments] = await db.query(`
      SELECT eq.id, a.name AS equipment_name, a.code AS asset_code 
      FROM equipments eq
      JOIN assets a ON eq.asset_id = a.id
      WHERE a.status = 'available'
    `);
    res.render('equipment-loans/create', { title: 'New Loan Request', equipments });
  } catch (err) {
    next(err);
  }
};

// 2B. Process Create Request
const create = async (req, res, next) => {
  const { equipment_id, start_date, end_date } = req.body;
  const userId = req.session.userId;
  // ── TAMBAHKAN VALIDASI TANGGAL DI SINI ──
  const tglMulai = new Date(start_date);
  const tglSelesai = new Date(end_date);

  if (tglSelesai < tglMulai) {
    return res.status(400).send("Gagal Update: Tanggal Selesai tidak boleh sebelum Tanggal Mulai. Silakan kembali dan perbaiki tanggal.");
  }
  try {
    const [peminjamanAktif] = await db.query(`
      SELECT id FROM equipment_loans 
      WHERE employee_id = ? 
        AND equipment_id = ? 
        AND status IN ('requested', 'approved')
    `, [userId, equipment_id]);

    // Jika ditemukan ada data yang statusnya masih requested/approved
    if (peminjamanAktif.length > 0) {
      return res.status(400).send("Gagal: Anda tidak dapat meminjam alat ini karena Anda masih memiliki pengajuan atau peminjaman aktif untuk alat yang sama yang belum dikembalikan.");
    }

    await db.query(`
      INSERT INTO equipment_loans (equipment_id, employee_id, start_date, end_date, status, approved_by_id) 
      VALUES (?, ?, ?, ?, 'requested', 1)
    `, [equipment_id, userId, start_date, end_date]);
    
    res.redirect('/equipment-loans');
  } catch (err) {
    next(err);
  }
};

// 3A. Show Edit Page
const editPage = async (req, res, next) => {
  const loanId = req.params.id;
  const userId = req.session.userId;

  try {
    // Check if data exists and is still 'requested'
    const [rows] = await db.query('SELECT * FROM equipment_loans WHERE id = ? AND employee_id = ?', [loanId, userId]);
    if (rows.length === 0) return res.status(404).send('Data not found');
    if (rows[0].status !== 'requested') return res.status(403).send('Only requested loans can be edited');

    // Fetch equipments for dropdown
    const [equipments] = await db.query(`
      SELECT eq.id, a.name AS equipment_name, a.code AS asset_code 
      FROM equipments eq
      JOIN assets a ON eq.asset_id = a.id
    `);

    res.render('equipment-loans/edit', { title: 'Edit Loan Request', loan: rows[0], equipments });
  } catch (err) {
    next(err);
  }
};

// 3B. Process Update Request
const update = async (req, res, next) => {
  const loanId = req.params.id;
  const userId = req.session.userId;
  const { equipment_id, start_date, end_date } = req.body;

  const tglMulai = new Date(start_date);
  const tglSelesai = new Date(end_date);

  if (tglSelesai < tglMulai) {
    return res.status(400).send("Gagal Update: Tanggal Selesai tidak boleh sebelum Tanggal Mulai. Silakan kembali dan perbaiki tanggal.");
  }
  try {
    await db.query(`
      UPDATE equipment_loans 
      SET equipment_id = ?, start_date = ?, end_date = ? 
      WHERE id = ? AND employee_id = ? AND status = 'requested'
    `, [equipment_id, start_date, end_date, loanId, userId]);
    
    res.redirect('/equipment-loans');
  } catch (err) {
    next(err);
  }
};

// 4. Process Cancel Request (Update status to rejected)
const cancel = async (req, res, next) => {
  const loanId = req.params.id;
  const userId = req.session.userId;

  try {
    await db.query(
      'UPDATE equipment_loans SET status = "cancelled" WHERE id = ? AND employee_id = ? AND status = "requested"',
      [loanId, userId]
    );
    res.redirect('/equipment-loans');
  } catch (err) {
    next(err);
  }
};

// ==========================================
// 2. FITUR EXPORT PDF (KOP SURAT KAMPUS)
// ==========================================

// Fungsi pembantu untuk menggambar Kop Surat
const drawKopSurat = (doc) => {
    doc.font('Times-Bold').fontSize(14).text('FAKULTAS TEKNOLOGI INFORMASI', { align: 'center' });
    doc.fontSize(14).text('UNIVERSITAS ANDALAS', { align: 'center' });
    
    doc.font('Times-Roman').fontSize(10);
    doc.text('Kampus Universitas Andalas, Limau Manis Padang - 27163', { align: 'center' });
    doc.text('Web: www.ftiunand.com email: fti.unand@gmail.com', { align: 'center' });
    
    doc.moveDown(0.5);
    const currentY = doc.y;
    doc.moveTo(50, currentY).lineTo(545, currentY).lineWidth(2).stroke();
    doc.moveTo(50, currentY + 3).lineTo(545, currentY + 3).lineWidth(1).stroke();
    doc.moveDown(2);
};

const cetak = async (req, res) => {
    const idTransaksi = req.params.id;
    const userId = req.session.userId; 

    try {
        // Kueri disesuaikan dengan tabel equipment_loans & users
        const query = `
            SELECT el.*, u.name AS nama_mahasiswa, a.name AS nama_alat 
            FROM equipment_loans el
            JOIN users u ON el.employee_id = u.id
            JOIN equipments eq ON el.equipment_id = eq.id
            JOIN assets a ON eq.asset_id = a.id
            WHERE el.id = ? AND el.employee_id = ?
        `;
        
        const [rows] = await db.query(query, [idTransaksi, userId]); // Diperbaiki dari pool.execute

        if (rows.length === 0) {
            return res.status(404).send("Data tidak ditemukan atau akses ditolak.");
        }

        const data = rows[0];
        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        doc.info['Title'] = 'Surat Peminjaman Peralatan';   
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Bukti_Pinjam_${idTransaksi}.pdf`);
        doc.pipe(res);

        // Panggil fungsi Kop Surat
        drawKopSurat(doc);

        doc.font('Times-Roman').fontSize(11);
        const tanggalCetak = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
        doc.text(`Padang, ${tanggalCetak}`, 50, doc.y, { align: 'right' });
        
        doc.moveUp(1); 
        const nomorUrut = req.query.no_surat || idTransaksi;
        const tahunSekarang = new Date().getFullYear();
        
        doc.text(`Nomor  : ${nomorUrut}/B/SPmj/FTI-UNAND/${tahunSekarang}`, 50, doc.y);
        doc.text(`Hal    : Surat Peminjaman Peralatan`);

        doc.moveDown(2);
        doc.text('Yth. Petugas / Penanggung Jawab Peralatan');
        doc.text('Di tempat.');

        doc.moveDown(2);
        doc.text(`Berdasarkan pengajuan peminjaman peralatan yang telah divalidasi, dengan ini menerangkan bahwa permohonan atas nama ${data.nama_mahasiswa} telah disetujui. Adapun rincian peminjaman barang adalah sebagai berikut:`, 50, doc.y, { align: 'justify' });

        doc.moveDown(1);

        const startDetailX = 80; // Agak menjorok ke dalam

        const tglMulai = new Date(data.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        const tglSelesai = new Date(data.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        doc.text(`Nama Alat    : ${data.nama_alat}`, startDetailX, doc.y);
        doc.text(`Tanggal        : ${tglMulai} - ${tglSelesai}`, startDetailX, doc.y);

        doc.moveDown(1.5);
        doc.text('Peminjam berkewajiban untuk menjaga kondisi alat dengan baik selama masa penggunaan. Apabila batas waktu peminjaman telah berakhir, mohon untuk segera mengembalikan alat tersebut kepada Penanggung Jawab terkait. Atas perhatian dan kerja sama yang baik, kami ucapkan terima kasih.', 50, doc.y, { align: 'justify' });

        // ── Area Tanda Tangan ──
        doc.moveDown(3);
        const signatureY = doc.y;
        doc.text('Peminjam,', 80, signatureY);
        doc.text('Penanggung Jawab,', 350, signatureY);

        doc.moveDown(4);
        doc.text('( ........................... )', 80);
        doc.text('( ........................... )', 350);

        doc.end();

    } catch (error) {
        console.error("PDF Generation Error:", error);
        res.status(500).send("Terjadi kesalahan internal saat mencetak dokumen PDF.");
    }
};

module.exports = { index, createPage, create, editPage, update, cancel, cetak };