// ============================================================
// CONTROLLER: ADMIN RESPONDEN (Dikelola oleh Aqila)
// Berisi semua fitur manajemen survey dan responden dari sisi admin
// ============================================================
const db = require('../lib/db');

// FITUR 1: Dashboard Survey (Admin)
// Menampilkan semua survey, status aktif/nonaktif, dan jumlah responden
const dashboard = async (req, res, next) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    // Ambil pesan error dari query string kalau ada
    // Kenapa: PDF redirect ke sini dengan pesan error kalau belum ada responden
    const errorMsg = req.query.error || null;

    const [surveys] = await db.query(`
      SELECT s.id, s.title, s.description, s.is_active, s.created_at,
        COUNT(DISTINCT sr.id) as total_responses
      FROM surveys s
      LEFT JOIN survey_invitations si ON si.survey_id = s.id
      LEFT JOIN survey_responses sr ON sr.survey_invitation_id = si.id
      WHERE s.title LIKE ? OR s.description LIKE ?
      GROUP BY s.id, s.title, s.description, s.is_active, s.created_at
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `, [`%${search}%`, `%${search}%`, limit, offset]);

    const [[{ total }]] = await db.query(`
      SELECT COUNT(*) as total FROM surveys
      WHERE title LIKE ? OR description LIKE ?
    `, [`%${search}%`, `%${search}%`]);

    const totalPages = Math.ceil(total / limit);

    res.render('home', {
      title: 'Dashboard Survey',
      user: req.session.userName,
      role: req.session.userRole,
      body: `
        <div class="flex flex-col gap-6">
          <div>
            <h1 class="text-2xl font-bold tracking-tight">Dashboard Survey</h1>
            <p class="text-muted-foreground">Ringkasan semua survey dan jumlah responden</p>
          </div>

          ${errorMsg ? `
            <div class="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20">
              ⚠️ ${errorMsg}
            </div>
          ` : ''}

          <form method="GET" action="/admin/responden" class="flex gap-2">
            <input
              type="text"
              name="search"
              value="${search}"
              placeholder="Cari survey..."
              class="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none flex-1 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <button type="submit" class="btn">Cari</button>
            ${search ? '<a href="/admin/responden" class="btn-outline">Reset</a>' : ''}
          </form>

          <div class="card">
            <section>
              <table class="table w-full">
                <thead>
                  <tr>
                    <th>Judul Survey</th>
                    <th>Status</th>
                    <th>Total Responden</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  ${surveys.length === 0 ? `
                    <tr><td colspan="4" class="text-center text-muted-foreground">Tidak ada survey</td></tr>
                  ` : surveys.map(s => `
                    <tr>
                      <td>${s.title}</td>
                      <td>
                        <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${s.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}">
                          ${s.is_active ? 'Aktif' : 'Tidak Aktif'}
                        </span>
                      </td>
                      <td>${s.total_responses}</td>
                      <td class="flex gap-2">
                        <a href="/admin/responden/${s.id}" class="btn-sm">Responden</a>
                        <a href="/admin/responden/${s.id}/riwayat" class="btn-sm-outline">Riwayat</a>
                        <a href="/admin/responden/${s.id}/pdf" class="btn-sm-outline">PDF</a>
                        <form method="POST" action="/admin/responden/${s.id}/toggle" style="display:inline">
                          <button type="submit" class="btn-sm-outline">
                            ${s.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                          </button>
                        </form>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </section>
          </div>

          ${totalPages > 1 ? `
            <div class="flex items-center justify-center gap-2">
              ${page > 1 ? `<a href="/admin/responden?search=${search}&page=${page - 1}" class="btn-outline">Sebelumnya</a>` : ''}
              <span class="text-sm text-muted-foreground">Halaman ${page} dari ${totalPages}</span>
              ${page < totalPages ? `<a href="/admin/responden?search=${search}&page=${page + 1}" class="btn-outline">Berikutnya</a>` : ''}
            </div>
          ` : ''}
        </div>
      `
    });
  } catch (err) {
    next(err);
  }
};

// FITUR 2: Daftar Responden Per Survey (Admin)
// Menampilkan list responden (nama, email, no HP, waktu submit) untuk survey tertentu
const respondenList = async (req, res, next) => {
  try {
    const surveyId = req.params.id;
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const [surveys] = await db.query('SELECT * FROM surveys WHERE id = ?', [surveyId]);
    if (surveys.length === 0) {
      return res.status(404).render('error', { message: 'Survey tidak ditemukan', error: { status: 404, stack: '' } });
    }

    const survey = surveys[0];

    const [respondents] = await db.query(`
      SELECT si.name, si.email, si.phone, sr.submitted_at
      FROM survey_invitations si
      JOIN survey_responses sr ON sr.survey_invitation_id = si.id
      WHERE si.survey_id = ? AND (si.name LIKE ? OR si.email LIKE ?)
      ORDER BY sr.submitted_at DESC
      LIMIT ? OFFSET ?
    `, [surveyId, `%${search}%`, `%${search}%`, limit, offset]);

    const [[{ total }]] = await db.query(`
      SELECT COUNT(*) as total FROM survey_invitations si
      JOIN survey_responses sr ON sr.survey_invitation_id = si.id
      WHERE si.survey_id = ? AND (si.name LIKE ? OR si.email LIKE ?)
    `, [surveyId, `%${search}%`, `%${search}%`]);

    const totalPages = Math.ceil(total / limit);

    res.render('home', {
      title: `Responden - ${survey.title}`,
      user: req.session.userName,
      role: req.session.userRole,
      body: `
        <div class="flex flex-col gap-6">
          <div>
            <a href="/admin/responden" class="text-sm text-muted-foreground hover:underline">← Kembali</a>
            <h1 class="text-2xl font-bold tracking-tight mt-2">${survey.title}</h1>
            <p class="text-muted-foreground">Total ${total} responden</p>
          </div>

          <form method="GET" action="/admin/responden/${surveyId}" class="flex gap-2">
            <input
              type="text"
              name="search"
              value="${search}"
              placeholder="Cari responden..."
              class="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none flex-1 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <button type="submit" class="btn">Cari</button>
            ${search ? `<a href="/admin/responden/${surveyId}" class="btn-outline">Reset</a>` : ''}
          </form>

          <div class="card">
            <section>
              <table class="table w-full">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>No. HP</th>
                    <th>Waktu Pengisian</th>
                  </tr>
                </thead>
                <tbody>
                  ${respondents.length === 0 ? `
                    <tr><td colspan="4" class="text-center text-muted-foreground">Belum ada responden</td></tr>
                  ` : respondents.map(r => `
                    <tr>
                      <td>${r.name}</td>
                      <td>${r.email}</td>
                      <td>${r.phone || '-'}</td>
                      <td>${new Date(r.submitted_at).toLocaleString('id-ID')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </section>
          </div>

          ${totalPages > 1 ? `
            <div class="flex items-center justify-center gap-2">
              ${page > 1 ? `<a href="/admin/responden/${surveyId}?search=${search}&page=${page - 1}" class="btn-outline">Sebelumnya</a>` : ''}
              <span class="text-sm text-muted-foreground">Halaman ${page} dari ${totalPages}</span>
              ${page < totalPages ? `<a href="/admin/responden/${surveyId}?search=${search}&page=${page + 1}" class="btn-outline">Berikutnya</a>` : ''}
            </div>
          ` : ''}
        </div>
      `
    });
  } catch (err) {
    next(err);
  }
};

// FITUR 3: Toggle Aktif/Nonaktif Survey (Admin)
// Mengubah status is_active (0 = nonaktif, 1 = aktif) di tabel surveys
const toggleAktif = async (req, res, next) => {
  try {
    const surveyId = req.params.id;

    const [surveys] = await db.query('SELECT * FROM surveys WHERE id = ?', [surveyId]);
    if (surveys.length === 0) {
      return res.status(404).render('error', { message: 'Survey tidak ditemukan', error: { status: 404, stack: '' } });
    }

    const newStatus = surveys[0].is_active ? 0 : 1;
    await db.query('UPDATE surveys SET is_active = ?, updated_at = NOW() WHERE id = ?', [newStatus, surveyId]);
    res.redirect('/admin/responden');
  } catch (err) {
    next(err);
  }
};

// FITUR 4: Riwayat Pengisian Per Survey (Admin)
// Menampilkan nama, email, jumlah jawaban, dan waktu submit
const riwayat = async (req, res, next) => {
  try {
    const surveyId = req.params.id;
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const [surveys] = await db.query('SELECT * FROM surveys WHERE id = ?', [surveyId]);
    if (surveys.length === 0) {
      return res.status(404).render('error', { message: 'Survey tidak ditemukan', error: { status: 404, stack: '' } });
    }

    const survey = surveys[0];

    const [riwayatList] = await db.query(`
      SELECT si.name, si.email, sr.submitted_at, COUNT(sa.id) as total_jawaban
      FROM survey_responses sr
      JOIN survey_invitations si ON sr.survey_invitation_id = si.id
      LEFT JOIN survey_answers sa ON sa.survey_response_id = sr.id
      WHERE si.survey_id = ? AND (si.name LIKE ? OR si.email LIKE ?)
      GROUP BY sr.id, si.name, si.email, sr.submitted_at
      ORDER BY sr.submitted_at DESC
      LIMIT ? OFFSET ?
    `, [surveyId, `%${search}%`, `%${search}%`, limit, offset]);

    const [[{ total }]] = await db.query(`
      SELECT COUNT(*) as total FROM survey_responses sr
      JOIN survey_invitations si ON sr.survey_invitation_id = si.id
      WHERE si.survey_id = ? AND (si.name LIKE ? OR si.email LIKE ?)
    `, [surveyId, `%${search}%`, `%${search}%`]);

    const totalPages = Math.ceil(total / limit);

    res.render('home', {
      title: `Riwayat - ${survey.title}`,
      user: req.session.userName,
      role: req.session.userRole,
      body: `
        <div class="flex flex-col gap-6">
          <div>
            <a href="/admin/responden" class="text-sm text-muted-foreground hover:underline">← Kembali</a>
            <h1 class="text-2xl font-bold tracking-tight mt-2">Riwayat Pengisian</h1>
            <p class="text-muted-foreground">${survey.title}</p>
          </div>

          <form method="GET" action="/admin/responden/${surveyId}/riwayat" class="flex gap-2">
            <input
              type="text"
              name="search"
              value="${search}"
              placeholder="Cari nama atau email..."
              class="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none flex-1 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <button type="submit" class="btn">Cari</button>
            ${search ? `<a href="/admin/responden/${surveyId}/riwayat" class="btn-outline">Reset</a>` : ''}
          </form>

          <div class="card">
            <section>
              <table class="table w-full">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Total Jawaban</th>
                    <th>Waktu Submit</th>
                  </tr>
                </thead>
                <tbody>
                  ${riwayatList.length === 0 ? `
                    <tr><td colspan="4" class="text-center text-muted-foreground">Belum ada riwayat</td></tr>
                  ` : riwayatList.map(r => `
                    <tr>
                      <td>${r.name}</td>
                      <td>${r.email}</td>
                      <td>${r.total_jawaban}</td>
                      <td>${new Date(r.submitted_at).toLocaleString('id-ID')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </section>
          </div>

          ${totalPages > 1 ? `
            <div class="flex items-center justify-center gap-2">
              ${page > 1 ? `<a href="/admin/responden/${surveyId}/riwayat?search=${search}&page=${page - 1}" class="btn-outline">Sebelumnya</a>` : ''}
              <span class="text-sm text-muted-foreground">Halaman ${page} dari ${totalPages}</span>
              ${page < totalPages ? `<a href="/admin/responden/${surveyId}/riwayat?search=${search}&page=${page + 1}" class="btn-outline">Berikutnya</a>` : ''}
            </div>
          ` : ''}
        </div>
      `
    });
  } catch (err) {
    next(err);
  }
};

// FITUR 5: Export PDF Laporan Ringkasan (Admin)
// Menghasilkan halaman HTML khusus cetak (print-friendly) yang memanggil window.print() browser
// LOKASI WARNA PDF: Ubah nilai CSS color/background di dalam template HTML di bawah (mulai baris 429)
const exportPdf = async (req, res, next) => {
  try {
    const surveyId = req.params.id;

    const [surveys] = await db.query('SELECT * FROM surveys WHERE id = ?', [surveyId]);
    if (surveys.length === 0) {
      return res.status(404).render('error', { message: 'Survey tidak ditemukan', error: { status: 404, stack: '' } });
    }

    const survey = surveys[0];

    const [[{ totalResponden }]] = await db.query(`
      SELECT COUNT(*) as totalResponden FROM survey_responses sr
      JOIN survey_invitations si ON sr.survey_invitation_id = si.id
      WHERE si.survey_id = ?
    `, [surveyId]);

    if (totalResponden === 0) {
      return res.redirect(`/admin/responden?error=Survey "${survey.title}" belum ada responden, laporan tidak dapat dicetak`);
    }

    const [questions] = await db.query(`
      SELECT sq.* FROM survey_questions sq
      JOIN survey_question_assignments sqa ON sq.id = sqa.survey_question_id
      WHERE sqa.survey_id = ?
      ORDER BY sqa.order ASC
    `, [surveyId]);

    for (const q of questions) {
      if (q.type !== 'short_answer') {
        const [options] = await db.query(`
          SELECT soo.option_text, COUNT(sao.id) as jumlah
          FROM survey_question_options soo
          LEFT JOIN survey_answer_options sao ON soo.id = sao.survey_question_option_id
          LEFT JOIN survey_answers sa ON sao.survey_answer_id = sa.id
          LEFT JOIN survey_responses sr ON sa.survey_response_id = sr.id
          LEFT JOIN survey_invitations si ON sr.survey_invitation_id = si.id
          WHERE soo.survey_question_id = ? AND (si.survey_id = ? OR si.survey_id IS NULL)
          GROUP BY soo.id, soo.option_text
        `, [q.id, surveyId]);
        q.options = options;
      } else {
        const [jawaban] = await db.query(`
          SELECT sa.answer_text FROM survey_answers sa
          JOIN survey_responses sr ON sa.survey_response_id = sr.id
          JOIN survey_invitations si ON sr.survey_invitation_id = si.id
          WHERE sa.survey_question_id = ? AND si.survey_id = ?
        `, [q.id, surveyId]);
        q.jawaban_teks = jawaban;
      }
    }

    const PDFDocument = require('pdfkit');
    const doc = new PDFDocument({ margin: 50, size: 'A4' });

    const filename = `laporan_survey_${surveyId}_${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    doc.pipe(res);

    // Header
    doc.fontSize(18).font('Helvetica-Bold').text('Laporan Ringkasan Survey', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(13).font('Helvetica-Bold').text(survey.title, { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#555555')
      .text(survey.description || '', { align: 'center' });
    doc.moveDown(0.5);

    // Meta info
    doc.fontSize(10).fillColor('#333333')
      .text(`Total Responden: ${totalResponden}`)
      .text(`Dicetak: ${new Date().toLocaleString('id-ID')}`);

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor('#cccccc').stroke();
    doc.moveDown(1);

    // Pertanyaan
    questions.forEach((q, index) => {
      // Cek jika perlu halaman baru
      if (doc.y > 680) doc.addPage();

      doc.fontSize(11).font('Helvetica-Bold').fillColor('#111111')
        .text(`${index + 1}. ${q.question_text}`);
      doc.moveDown(0.4);

      if (q.type !== 'short_answer') {
        // Tabel pilihan ganda
        const colWidths = [280, 80, 90];
        const tableX = 50;
        let tableY = doc.y;

        // Header tabel
        doc.rect(tableX, tableY, colWidths[0] + colWidths[1] + colWidths[2], 20)
          .fillColor('#f3f4f6').fill();
        doc.fontSize(9).font('Helvetica-Bold').fillColor('#333333')
          .text('Pilihan', tableX + 5, tableY + 5, { width: colWidths[0] - 5 })
          .text('Jumlah', tableX + colWidths[0] + 5, tableY + 5, { width: colWidths[1] - 5 })
          .text('Persentase', tableX + colWidths[0] + colWidths[1] + 5, tableY + 5, { width: colWidths[2] - 5 });
        tableY += 20;

        q.options.forEach((opt, i) => {
          if (doc.y > 700) { doc.addPage(); tableY = doc.y; }
          const persen = totalResponden > 0 ? Math.round((opt.jumlah / totalResponden) * 100) : 0;
          const rowBg = i % 2 === 0 ? '#ffffff' : '#f9fafb';
          doc.rect(tableX, tableY, colWidths[0] + colWidths[1] + colWidths[2], 18)
            .fillColor(rowBg).fill();
          doc.fontSize(9).font('Helvetica').fillColor('#111111')
            .text(opt.option_text, tableX + 5, tableY + 4, { width: colWidths[0] - 10 })
            .text(String(opt.jumlah), tableX + colWidths[0] + 5, tableY + 4, { width: colWidths[1] - 10 })
            .text(`${persen}%`, tableX + colWidths[0] + colWidths[1] + 5, tableY + 4, { width: colWidths[2] - 10 });
          tableY += 18;
        });

        // Border tabel
        doc.rect(tableX, doc.y - (q.options.length * 18) - 20, colWidths[0] + colWidths[1] + colWidths[2], (q.options.length * 18) + 20)
          .strokeColor('#e5e7eb').stroke();

        doc.y = tableY;

      } else {
        // Jawaban teks bebas
        if (!q.jawaban_teks || q.jawaban_teks.length === 0) {
          doc.fontSize(9).font('Helvetica').fillColor('#888888').text('Belum ada jawaban');
        } else {
          q.jawaban_teks.forEach((j, i) => {
            if (doc.y > 700) doc.addPage();
            doc.fontSize(9).font('Helvetica').fillColor('#374151')
              .text(`${i + 1}. ${j.answer_text}`, { indent: 10 });
          });
        }
      }

      doc.moveDown(1);
    });

    doc.end();
  } catch (err) {
    next(err);
  }
};

// FITUR 6: REST API Rekap Jawaban Per Survey
// Menghasilkan output berupa JSON berisi data survey, total responden, dan persentase pilihan jawaban
const apiRekap = async (req, res, next) => {
  try {
    const surveyId = req.params.id;

    const [surveys] = await db.query(
      'SELECT id, title, description FROM surveys WHERE id = ? AND is_active = 1',
      [surveyId]
    );

    if (surveys.length === 0) {
      return res.status(404).json({ success: false, message: 'Survey tidak ditemukan' });
    }

    const survey = surveys[0];

    const [[{ totalResponden }]] = await db.query(`
      SELECT COUNT(*) as totalResponden FROM survey_responses sr
      JOIN survey_invitations si ON sr.survey_invitation_id = si.id
      WHERE si.survey_id = ?
    `, [surveyId]);

    const [questions] = await db.query(`
      SELECT sq.id, sq.question_text, sq.type
      FROM survey_questions sq
      JOIN survey_question_assignments sqa ON sq.id = sqa.survey_question_id
      WHERE sqa.survey_id = ?
      ORDER BY sqa.order ASC
    `, [surveyId]);

    for (const q of questions) {
      if (q.type !== 'short_answer') {
        const [options] = await db.query(`
          SELECT soo.option_text, COUNT(sao.id) as jumlah
          FROM survey_question_options soo
          LEFT JOIN survey_answer_options sao ON soo.id = sao.survey_question_option_id
          LEFT JOIN survey_answers sa ON sao.survey_answer_id = sa.id
          LEFT JOIN survey_responses sr ON sa.survey_response_id = sr.id
          LEFT JOIN survey_invitations si ON sr.survey_invitation_id = si.id
          WHERE soo.survey_question_id = ? AND (si.survey_id = ? OR si.survey_id IS NULL)
          GROUP BY soo.id, soo.option_text
        `, [q.id, surveyId]);
        q.options = options.map(o => ({
          option_text: o.option_text,
          jumlah: o.jumlah,
          persentase: totalResponden > 0 ? Math.round((o.jumlah / totalResponden) * 100) : 0
        }));
      }
    }

    res.json({
      success: true,
      data: { survey, total_responden: totalResponden, pertanyaan: questions }
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  dashboard,
  respondenList,
  toggleAktif,
  riwayat,
  exportPdf,
  apiRekap
};