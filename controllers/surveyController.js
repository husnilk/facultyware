// ============================================================
// CONTROLLER: RESPONDENT & ADMIN SURVEY (Dikelola oleh Arifah)
// Berisi semua fitur pengisian survey untuk responden dan rekapitulasi statistik untuk admin
// ============================================================
const db = require('../lib/db');

// FITUR 1: Lihat Daftar Survey (Respondent)
// Menampilkan daftar survey aktif, pencarian survey, status "Sudah Diisi", dan pagination
const index = async (req, res, next) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const [surveys] = await db.query(`
      SELECT s.id, s.title, s.description, s.start_date, s.end_date,
        s.is_active, s.created_by, s.employee_id, s.created_at, s.updated_at,
        CASE WHEN COUNT(sr.id) > 0 THEN 1 ELSE 0 END as sudah_diisi
      FROM surveys s
      LEFT JOIN survey_invitations si
        ON si.survey_id = s.id AND si.email = ?
      LEFT JOIN survey_responses sr
        ON sr.survey_invitation_id = si.id
      WHERE s.is_active = 1
        AND (s.title LIKE ? OR s.description LIKE ?)
      GROUP BY s.id, s.title, s.description, s.start_date, s.end_date,
        s.is_active, s.created_by, s.employee_id, s.created_at, s.updated_at
      LIMIT ? OFFSET ?
    `, [req.session.userEmail, `%${search}%`, `%${search}%`, limit, offset]);

    const [[{ total }]] = await db.query(`
      SELECT COUNT(*) as total FROM surveys
      WHERE is_active = 1 AND (title LIKE ? OR description LIKE ?)
    `, [`%${search}%`, `%${search}%`]);

    const totalPages = Math.ceil(total / limit);
    const successMsg = req.query.success ? 'Survey berhasil diisi! Terima kasih.' : null;

    res.render('home', {
      title: 'Daftar Survey',
      user: req.session.userName,
      role: req.session.userRole,
      body: `
        <div class="flex flex-col gap-6">
          <div>
            <h1 class="text-2xl font-bold tracking-tight">Daftar Survey</h1>
            <p class="text-muted-foreground">Survey yang tersedia untuk diisi</p>
          </div>

          ${successMsg ? `
            <div class="bg-green-100 text-green-700 text-sm p-3 rounded-md border border-green-200">
              ✅ ${successMsg}
            </div>
          ` : ''}

          <form method="GET" action="/survey" class="flex gap-2">
            <input
              type="text"
              name="search"
              value="${search}"
              placeholder="Cari survey..."
              class="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none flex-1 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <button type="submit" class="btn">Cari</button>
            ${search ? '<a href="/survey" class="btn-outline">Reset</a>' : ''}
          </form>

          ${surveys.length === 0 ? `
            <div class="card">
              <section class="text-center text-muted-foreground py-8">
                Tidak ada survey yang tersedia
              </section>
            </div>
          ` : surveys.map(s => `
            <div class="card">
              <header>
                <h2>${s.title}</h2>
                <p>${s.description || ''}</p>
              </header>
              <section class="flex items-center justify-between">
                <div class="text-sm text-muted-foreground">
                  Periode: ${new Date(s.start_date).toLocaleDateString('id-ID')} - ${new Date(s.end_date).toLocaleDateString('id-ID')}
                </div>
                ${s.sudah_diisi ? `
                  <span class="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    Sudah Diisi
                  </span>
                ` : `
                  <a href="/survey/${s.id}" class="btn">Isi Survey</a>
                `}
              </section>
            </div>
          `).join('')}

          ${totalPages > 1 ? `
            <div class="flex items-center justify-center gap-2">
              ${page > 1 ? `<a href="/survey?search=${search}&page=${page - 1}" class="btn-outline">Sebelumnya</a>` : ''}
              <span class="text-sm text-muted-foreground">Halaman ${page} dari ${totalPages}</span>
              ${page < totalPages ? `<a href="/survey?search=${search}&page=${page + 1}" class="btn-outline">Berikutnya</a>` : ''}
            </div>
          ` : ''}
        </div>
      `
    });
  } catch (err) {
    next(err);
  }
};

// FITUR 2 (Bagian A): Form Input PIN Survey (Respondent)
// Menampilkan halaman pengisian PIN untuk masuk ke kuesioner
const pinForm = async (req, res, next) => {
  try {
    const surveyId = req.params.id;

    const [surveys] = await db.query(
      'SELECT * FROM surveys WHERE id = ? AND is_active = 1',
      [surveyId]
    );

    if (surveys.length === 0) {
      return res.status(404).render('error', {
        message: 'Survey tidak ditemukan',
        error: { status: 404, stack: '' }
      });
    }

    const survey = surveys[0];
    const error = req.query.error || null;

    res.render('home', {
      title: `Masukkan PIN - ${survey.title}`,
      user: req.session.userName,
      role: req.session.userRole,
      body: `
        <div class="flex flex-col gap-6 max-w-md mx-auto">
          <div>
            <a href="/survey" class="text-sm text-muted-foreground hover:underline">← Kembali</a>
            <h1 class="text-2xl font-bold tracking-tight mt-2">${survey.title}</h1>
            <p class="text-muted-foreground">${survey.description || ''}</p>
          </div>

          <div class="card">
            <header>
              <h2>Masukkan PIN</h2>
              <p>Masukkan PIN yang sudah Anda terima untuk mengisi survey ini</p>
            </header>
            <section>
              ${error ? `
                <div class="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20 mb-4">
                  ⚠️ ${error}
                </div>
              ` : ''}
              <form method="POST" action="/survey/${surveyId}/pin" class="flex flex-col gap-4" id="pinForm" novalidate>
                <div class="flex flex-col gap-2">
                  <label class="text-sm font-medium" for="pin">PIN</label>
                  <input
                    type="text"
                    id="pin"
                    name="pin"
                    placeholder="Masukkan PIN Anda..."
                    class="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                  />
                  <p id="pinError" class="text-xs text-destructive hidden">PIN tidak boleh kosong</p>
                </div>
                <button type="submit" class="btn w-full">Lanjutkan</button>
              </form>
              <script>
                document.getElementById('pinForm').addEventListener('submit', function(e) {
                  const pin = document.getElementById('pin');
                  const pinError = document.getElementById('pinError');
                  if (!pin.value.trim()) {
                    e.preventDefault();
                    pin.classList.add('border-destructive');
                    pinError.classList.remove('hidden');
                  } else {
                    pin.classList.remove('border-destructive');
                    pinError.classList.add('hidden');
                  }
                });
              </script>
            </section>
          </div>
        </div>
      `
    });
  } catch (err) {
    next(err);
  }
};

// FITUR 2 (Bagian B): Proses Validasi PIN Survey (Respondent)
// Memeriksa kesesuaian PIN dengan survey, email responden, dan status 'is_used' di database
const pinValidate = async (req, res, next) => {
  try {
    const surveyId = req.params.id;
    const { pin } = req.body;

    if (!pin || pin.trim() === '') {
      return res.redirect(`/survey/${surveyId}?error=PIN tidak boleh kosong`);
    }

    const [invitations] = await db.query(`
      SELECT * FROM survey_invitations
      WHERE survey_id = ? AND pin = ? AND email = ? AND is_used = 0
    `, [surveyId, pin.trim(), req.session.userEmail]);

    if (invitations.length === 0) {
      return res.redirect(`/survey/${surveyId}?error=PIN tidak valid atau sudah digunakan`);
    }

    req.session.invitationId = invitations[0].id;
    res.redirect(`/survey/${surveyId}/fill`);
  } catch (err) {
    next(err);
  }
};

// FITUR 2 (Bagian C): Render Form Pertanyaan Survey (Respondent)
// Menampilkan daftar pertanyaan kuesioner (pilihan ganda tunggal, banyak, atau esai)
const fillForm = async (req, res, next) => {
  try {
    const surveyId = req.params.id;

    if (!req.session.invitationId) {
      return res.redirect(`/survey/${surveyId}`);
    }

    const [surveys] = await db.query(
      'SELECT * FROM surveys WHERE id = ? AND is_active = 1',
      [surveyId]
    );

    if (surveys.length === 0) {
      return res.status(404).render('error', {
        message: 'Survey tidak ditemukan',
        error: { status: 404, stack: '' }
      });
    }

    const survey = surveys[0];

    const [questions] = await db.query(`
      SELECT sq.*, sqa.order
      FROM survey_questions sq
      JOIN survey_question_assignments sqa ON sq.id = sqa.survey_question_id
      WHERE sqa.survey_id = ? AND sq.is_active = 1
      ORDER BY sqa.order ASC
    `, [surveyId]);

    for (const q of questions) {
      const [options] = await db.query(
        'SELECT * FROM survey_question_options WHERE survey_question_id = ?',
        [q.id]
      );
      q.options = options;
    }

    const questionsHtml = questions.map((q, index) => `
      <div class="card" data-qid="${q.id}">
        <header>
          <h2>${index + 1}. ${q.question_text}</h2>
          ${q.type === 'multiple_choice' ? '<p>Pilih satu atau lebih jawaban</p>' : ''}
        </header>
        <section>
          ${q.type === 'single_choice' ? `
            <div class="flex flex-col gap-3">
              ${q.options.map(opt => `
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="radio" name="answer_${q.id}" value="${opt.id}" required class="input" />
                  <span class="text-sm">${opt.option_text}</span>
                </label>
              `).join('')}
            </div>
          ` : q.type === 'multiple_choice' ? `
            <div class="flex flex-col gap-3">
              ${q.options.map(opt => `
                <label class="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="answer_${q.id}[]" value="${opt.id}" class="input" />
                  <span class="text-sm">${opt.option_text}</span>
                </label>
              `).join('')}
            </div>
          ` : `
            <textarea
              name="answer_text_${q.id}"
              placeholder="Tulis jawaban Anda di sini..."
              required
              class="w-full min-h-[100px] rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            ></textarea>
          `}
        </section>
      </div>
    `).join('');

    res.render('home', {
      title: survey.title,
      user: req.session.userName,
      role: req.session.userRole,
      body: `
        <div class="flex flex-col gap-6">
          <div>
            <a href="/survey" class="text-sm text-muted-foreground hover:underline">← Kembali</a>
            <h1 class="text-2xl font-bold tracking-tight mt-2">${survey.title}</h1>
            <p class="text-muted-foreground">${survey.description || ''}</p>
          </div>
          <form method="POST" action="/survey/${surveyId}/submit" class="flex flex-col gap-4" id="surveyForm" novalidate>
            ${questionsHtml}
            <p id="surveyFormError" class="text-sm text-destructive hidden">Harap jawab semua pertanyaan sebelum mengirim.</p>
            <div class="flex justify-end">
              <button type="submit" class="btn">Kirim Jawaban</button>
            </div>
          </form>
          <script>
            document.getElementById('surveyForm').addEventListener('submit', function(e) {
              const questions = ${JSON.stringify(questions.map(q => ({ id: q.id, type: q.type })))};
              let hasError = false;

              document.querySelectorAll('.q-error').forEach(el => el.remove());
              document.querySelectorAll('.border-destructive').forEach(el => el.classList.remove('border-destructive'));
              document.getElementById('surveyFormError').classList.add('hidden');

              questions.forEach(function(q) {
                let answered = false;
                if (q.type === 'single_choice') {
                  answered = !!document.querySelector('input[name="answer_' + q.id + '"]:checked');
                } else if (q.type === 'multiple_choice') {
                  answered = !!document.querySelector('input[name="answer_' + q.id + '[]"]:checked');
                } else {
                  const ta = document.querySelector('textarea[name="answer_text_' + q.id + '"]');
                  answered = ta && ta.value.trim() !== '';
                  if (!answered && ta) ta.classList.add('border-destructive');
                }

                if (!answered) {
                  hasError = true;
                  const card = document.querySelector('[data-qid="' + q.id + '"]');
                  if (card) {
                    const err = document.createElement('p');
                    err.className = 'q-error text-xs text-destructive mt-2';
                    err.textContent = 'Pertanyaan ini wajib dijawab';
                    card.querySelector('section').appendChild(err);
                    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }
              });

              if (hasError) {
                e.preventDefault();
                document.getElementById('surveyFormError').classList.remove('hidden');
                document.getElementById('surveyFormError').scrollIntoView({ behavior: 'smooth', block: 'center' });
              }
            });
          </script>
        </div>
      `
    });
  } catch (err) {
    next(err);
  }
};

// FITUR 2 (Bagian D): Proses Submit Jawaban Survey (Respondent)
// Validasi di sisi server (wajib diisi) dan menyimpan data jawaban ke database (tabel survey_responses, survey_answers, survey_answer_options)
const submit = async (req, res, next) => {
  try {
    const surveyId = req.params.id;
    const body = req.body;
    const invitationId = req.session.invitationId;

    if (!invitationId) {
      return res.redirect(`/survey/${surveyId}`);
    }

    const [surveys] = await db.query(
      'SELECT * FROM surveys WHERE id = ? AND is_active = 1',
      [surveyId]
    );

    if (surveys.length === 0) {
      return res.status(404).render('error', {
        message: 'Survey tidak ditemukan',
        error: { status: 404, stack: '' }
      });
    }

    const [questions] = await db.query(`
      SELECT sq.* FROM survey_questions sq
      JOIN survey_question_assignments sqa ON sq.id = sqa.survey_question_id
      WHERE sqa.survey_id = ? AND sq.is_active = 1
    `, [surveyId]);

    const errors = [];
    for (const q of questions) {
      if (q.type === 'single_choice') {
        if (!body[`answer_${q.id}`]) {
          errors.push(`Pertanyaan "${q.question_text}" wajib dijawab`);
        }
      } else if (q.type === 'multiple_choice') {
        const answers = body[`answer_${q.id}[]`];
        if (!answers || (Array.isArray(answers) && answers.length === 0)) {
          errors.push(`Pertanyaan "${q.question_text}" wajib dijawab`);
        }
      } else {
        if (!body[`answer_text_${q.id}`] || body[`answer_text_${q.id}`].trim() === '') {
          errors.push(`Pertanyaan "${q.question_text}" wajib dijawab`);
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).render('home', {
        title: 'Jawaban Tidak Lengkap',
        user: req.session.userName,
        role: req.session.userRole,
        body: `
          <div class="flex flex-col gap-4 max-w-md mx-auto">
            <h1 class="text-2xl font-bold">Jawaban Tidak Lengkap</h1>
            <div class="card">
              <section class="flex flex-col gap-2">
                ${errors.map(e => `<p class="text-destructive text-sm">• ${e}</p>`).join('')}
              </section>
            </div>
            <a href="/survey/${surveyId}/fill" class="btn-outline w-fit">Kembali ke Survey</a>
          </div>
        `
      });
    }

    const [responseResult] = await db.query(`
      INSERT INTO survey_responses (survey_id, survey_invitation_id, submitted_at, created_at, updated_at)
      VALUES (?, ?, NOW(), NOW(), NOW())
    `, [surveyId, invitationId]);

    const responseId = responseResult.insertId;

    for (const q of questions) {
      if (q.type === 'single_choice') {
        const optionId = body[`answer_${q.id}`];
        const [answerResult] = await db.query(`
          INSERT INTO survey_answers (survey_response_id, survey_question_id, answer_text, created_at, updated_at)
          VALUES (?, ?, '', NOW(), NOW())
        `, [responseId, q.id]);
        await db.query(`
          INSERT INTO survey_answer_options (survey_answer_id, survey_question_option_id, created_at, updated_at)
          VALUES (?, ?, NOW(), NOW())
        `, [answerResult.insertId, optionId]);

      } else if (q.type === 'multiple_choice') {
        let optionIds = body[`answer_${q.id}[]`];
        if (!Array.isArray(optionIds)) optionIds = [optionIds];
        const [answerResult] = await db.query(`
          INSERT INTO survey_answers (survey_response_id, survey_question_id, answer_text, created_at, updated_at)
          VALUES (?, ?, '', NOW(), NOW())
        `, [responseId, q.id]);
        for (const optionId of optionIds) {
          await db.query(`
            INSERT INTO survey_answer_options (survey_answer_id, survey_question_option_id, created_at, updated_at)
            VALUES (?, ?, NOW(), NOW())
          `, [answerResult.insertId, optionId]);
        }

      } else {
        await db.query(`
          INSERT INTO survey_answers (survey_response_id, survey_question_id, answer_text, created_at, updated_at)
          VALUES (?, ?, ?, NOW(), NOW())
        `, [responseId, q.id, body[`answer_text_${q.id}`]]);
      }
    }

    await db.query(`
      UPDATE survey_invitations SET is_used = 1, used_at = NOW(), updated_at = NOW()
      WHERE id = ?
    `, [invitationId]);

    delete req.session.invitationId;
    res.redirect('/survey?success=1');
  } catch (err) {
    next(err);
  }
};

// FITUR 3 (Bagian A): List Rekap Jawaban Per Survey (Admin)
// Menampilkan daftar seluruh survey beserta total jumlah responden yang sudah mengisi
const rekap = async (req, res, next) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

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
      title: 'Rekap Jawaban',
      user: req.session.userName,
      role: req.session.userRole,
      body: `
        <div class="flex flex-col gap-6">
          <div>
            <h1 class="text-2xl font-bold tracking-tight">Rekap Jawaban Survey</h1>
            <p class="text-muted-foreground">Lihat detail jawaban per survey</p>
          </div>

          <form method="GET" action="/admin/survey/rekap" class="flex gap-2">
            <input
              type="text"
              name="search"
              value="${search}"
              placeholder="Cari survey..."
              class="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none flex-1 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <button type="submit" class="btn">Cari</button>
            ${search ? '<a href="/admin/survey/rekap" class="btn-outline">Reset</a>' : ''}
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
                      <td>${s.is_active ? 'Aktif' : 'Tidak Aktif'}</td>
                      <td>${s.total_responses}</td>
                      <td class="flex gap-2">
                        <a href="/admin/survey/rekap/${s.id}" class="btn-sm">Detail</a>
                        <a href="/admin/survey/export/${s.id}" class="btn-sm-outline">Export CSV</a>
                      </td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </section>
          </div>

          ${totalPages > 1 ? `
            <div class="flex items-center justify-center gap-2">
              ${page > 1 ? `<a href="/admin/survey/rekap?search=${search}&page=${page - 1}" class="btn-outline">Sebelumnya</a>` : ''}
              <span class="text-sm text-muted-foreground">Halaman ${page} dari ${totalPages}</span>
              ${page < totalPages ? `<a href="/admin/survey/rekap?search=${search}&page=${page + 1}" class="btn-outline">Berikutnya</a>` : ''}
            </div>
          ` : ''}
        </div>
      `
    });
  } catch (err) {
    next(err);
  }
};

// FITUR 3 (Bagian B): Detail Responden Per Survey (Admin)
// Menampilkan detail nama, email, dan waktu submit responden di survey tertentu
const rekapDetail = async (req, res, next) => {
  try {
    const surveyId = req.params.id;
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;
    const errorMsg = req.query.error || null;

    const [surveys] = await db.query('SELECT * FROM surveys WHERE id = ?', [surveyId]);
    if (surveys.length === 0) {
      return res.status(404).render('error', { message: 'Survey tidak ditemukan', error: { status: 404, stack: '' } });
    }

    const survey = surveys[0];

    const [responses] = await db.query(`
      SELECT sr.id, sr.submitted_at, si.name as responden_name, si.email as responden_email
      FROM survey_responses sr
      JOIN survey_invitations si ON sr.survey_invitation_id = si.id
      WHERE si.survey_id = ? AND (si.name LIKE ? OR si.email LIKE ?)
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
      title: `Rekap - ${survey.title}`,
      user: req.session.userName,
      role: req.session.userRole,
      body: `
        <div class="flex flex-col gap-6">
          <div>
            <a href="/admin/survey/rekap" class="text-sm text-muted-foreground hover:underline">← Kembali</a>
            <h1 class="text-2xl font-bold tracking-tight mt-2">${survey.title}</h1>
            <p class="text-muted-foreground">Total ${total} responden</p>
          </div>

          ${errorMsg ? `
            <div class="bg-destructive/15 text-destructive text-sm p-3 rounded-md border border-destructive/20">
              ⚠️ ${errorMsg}
            </div>
          ` : ''}

          <form method="GET" action="/admin/survey/rekap/${surveyId}" class="flex gap-2">
            <input
              type="text"
              name="search"
              value="${search}"
              placeholder="Cari responden..."
              class="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none flex-1 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <button type="submit" class="btn">Cari</button>
            ${search ? `<a href="/admin/survey/rekap/${surveyId}" class="btn-outline">Reset</a>` : ''}
          </form>

          <div class="card">
            <section>
              <table class="table w-full">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Email</th>
                    <th>Waktu Pengisian</th>
                  </tr>
                </thead>
                <tbody>
                  ${responses.length === 0 ? `
                    <tr><td colspan="3" class="text-center text-muted-foreground">Belum ada responden</td></tr>
                  ` : responses.map(r => `
                    <tr>
                      <td>${r.responden_name}</td>
                      <td>${r.responden_email}</td>
                      <td>${new Date(r.submitted_at).toLocaleString('id-ID')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </section>
          </div>

          ${totalPages > 1 ? `
            <div class="flex items-center justify-center gap-2">
              ${page > 1 ? `<a href="/admin/survey/rekap/${surveyId}?search=${search}&page=${page - 1}" class="btn-outline">Sebelumnya</a>` : ''}
              <span class="text-sm text-muted-foreground">Halaman ${page} dari ${totalPages}</span>
              ${page < totalPages ? `<a href="/admin/survey/rekap/${surveyId}?search=${search}&page=${page + 1}" class="btn-outline">Berikutnya</a>` : ''}
            </div>
          ` : ''}
        </div>
      `
    });
  } catch (err) {
    next(err);
  }
};

// FITUR 4 (Bagian A): List Survey Untuk Statistik (Admin)
// Menampilkan daftar survey untuk memilih statistik jawaban
const statistik = async (req, res, next) => {
  try {
    const search = req.query.search || '';
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const [surveys] = await db.query(`
      SELECT s.id, s.title, s.description, COUNT(DISTINCT sr.id) as total_responses
      FROM surveys s
      LEFT JOIN survey_invitations si ON si.survey_id = s.id
      LEFT JOIN survey_responses sr ON sr.survey_invitation_id = si.id
      WHERE s.title LIKE ? OR s.description LIKE ?
      GROUP BY s.id, s.title, s.description
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `, [`%${search}%`, `%${search}%`, limit, offset]);

    const [[{ total }]] = await db.query(`
      SELECT COUNT(*) as total FROM surveys
      WHERE title LIKE ? OR description LIKE ?
    `, [`%${search}%`, `%${search}%`]);

    const totalPages = Math.ceil(total / limit);

    res.render('home', {
      title: 'Statistik Survey',
      user: req.session.userName,
      role: req.session.userRole,
      body: `
        <div class="flex flex-col gap-6">
          <div>
            <h1 class="text-2xl font-bold tracking-tight">Statistik Survey</h1>
            <p class="text-muted-foreground">Pilih survey untuk lihat statistik jawaban</p>
          </div>

          <form method="GET" action="/admin/survey/statistik" class="flex gap-2">
            <input
              type="text"
              name="search"
              value="${search}"
              placeholder="Cari survey..."
              class="h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs outline-none flex-1 focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            />
            <button type="submit" class="btn">Cari</button>
            ${search ? '<a href="/admin/survey/statistik" class="btn-outline">Reset</a>' : ''}
          </form>

          <div class="grid gap-4">
            ${surveys.length === 0 ? `
              <div class="card">
                <section class="text-center text-muted-foreground py-8">
                  Tidak ada survey yang ditemukan
                </section>
              </div>
            ` : surveys.map(s => `
              <div class="card">
                <header>
                  <h2>${s.title}</h2>
                  <p>${s.description || ''}</p>
                </header>
                <section class="flex items-center justify-between">
                  <span class="text-sm text-muted-foreground">${s.total_responses} responden</span>
                  <a href="/admin/survey/statistik/${s.id}" class="btn">Lihat Statistik</a>
                </section>
              </div>
            `).join('')}
          </div>

          ${totalPages > 1 ? `
            <div class="flex items-center justify-center gap-2">
              ${page > 1 ? `<a href="/admin/survey/statistik?search=${search}&page=${page - 1}" class="btn-outline">Sebelumnya</a>` : ''}
              <span class="text-sm text-muted-foreground">Halaman ${page} dari ${totalPages}</span>
              ${page < totalPages ? `<a href="/admin/survey/statistik?search=${search}&page=${page + 1}" class="btn-outline">Berikutnya</a>` : ''}
            </div>
          ` : ''}
        </div>
      `
    });
  } catch (err) {
    next(err);
  }
};

// FITUR 4 (Bagian B): Detail Statistik Jawaban (Admin)
// Menampilkan progress bar persentase jawaban pilihan ganda, dan daftar esai untuk short_answer
const statistikDetail = async (req, res, next) => {
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

    const [questions] = await db.query(`
      SELECT sq.* FROM survey_questions sq
      JOIN survey_question_assignments sqa ON sq.id = sqa.survey_question_id
      WHERE sqa.survey_id = ?
      ORDER BY sqa.order ASC
    `, [surveyId]);

    for (const q of questions) {
      if (q.type !== 'short_answer') {
        const [options] = await db.query(`
          SELECT soo.id, soo.option_text, COUNT(sao.id) as jumlah_dipilih
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
        // Ambil jawaban teks bebas untuk ditampilkan
        const [jawaban] = await db.query(`
          SELECT sa.answer_text FROM survey_answers sa
          JOIN survey_responses sr ON sa.survey_response_id = sr.id
          JOIN survey_invitations si ON sr.survey_invitation_id = si.id
          WHERE sa.survey_question_id = ? AND si.survey_id = ?
        `, [q.id, surveyId]);
        q.jawaban_teks = jawaban;
      }
    }

    const statistikHtml = questions.map((q, index) => `
      <div class="card">
        <header>
          <h2>${index + 1}. ${q.question_text}</h2>
        </header>
        <section>
          ${q.type !== 'short_answer' ? `
            <div class="flex flex-col gap-3">
              ${q.options.map(opt => {
                const persen = totalResponden > 0 ? Math.round((opt.jumlah_dipilih / totalResponden) * 100) : 0;
                return `
                  <div class="flex flex-col gap-1">
                    <div class="flex justify-between text-sm">
                      <span>${opt.option_text}</span>
                      <span>${opt.jumlah_dipilih} (${persen}%)</span>
                    </div>
                    <div class="w-full bg-muted rounded-full h-2">
                      <div class="bg-primary h-2 rounded-full" style="width: ${persen}%"></div>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : q.jawaban_teks.length === 0 ? `
            <p class="text-sm text-muted-foreground">Belum ada jawaban</p>
          ` : `
            <div class="flex flex-col gap-2">
              ${q.jawaban_teks.map(j => `
                <div class="rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                  ${j.answer_text}
                </div>
              `).join('')}
            </div>
          `}
        </section>
      </div>
    `).join('');

    res.render('home', {
      title: `Statistik - ${survey.title}`,
      user: req.session.userName,
      role: req.session.userRole,
      body: `
        <div class="flex flex-col gap-6">
          <div>
            <a href="/admin/survey/statistik" class="text-sm text-muted-foreground hover:underline">← Kembali</a>
            <h1 class="text-2xl font-bold tracking-tight mt-2">${survey.title}</h1>
            <p class="text-muted-foreground">Total ${totalResponden} responden</p>
          </div>
          ${statistikHtml}
        </div>
      `
    });
  } catch (err) {
    next(err);
  }
};

// FITUR 5: Export CSV Data Mentah (Admin)
// Mengunduh seluruh respons mentah ke file format CSV (Excel-friendly BOM UTF-8)
const exportCsv = async (req, res, next) => {
  try {
    const surveyId = req.params.id;

    const [surveys] = await db.query('SELECT * FROM surveys WHERE id = ?', [surveyId]);
    if (surveys.length === 0) {
      return res.status(404).render('error', { message: 'Survey tidak ditemukan', error: { status: 404, stack: '' } });
    }

    const survey = surveys[0];

    // Cek apakah ada responden dulu
    // Kenapa: sesuai poin 2b instruksi dosen — error handling informatif di client
    const [[{ totalResponden }]] = await db.query(`
      SELECT COUNT(*) as totalResponden FROM survey_responses sr
      JOIN survey_invitations si ON sr.survey_invitation_id = si.id
      WHERE si.survey_id = ?
    `, [surveyId]);

    if (totalResponden === 0) {
      return res.redirect(`/admin/survey/rekap/${surveyId}?error=Belum ada responden, data tidak dapat diekspor`);
    }

    const [questions] = await db.query(`
      SELECT sq.* FROM survey_questions sq
      JOIN survey_question_assignments sqa ON sq.id = sqa.survey_question_id
      WHERE sqa.survey_id = ?
      ORDER BY sqa.order ASC
    `, [surveyId]);

    const [responses] = await db.query(`
      SELECT sr.id as response_id, si.name, si.email, sr.submitted_at
      FROM survey_responses sr
      JOIN survey_invitations si ON sr.survey_invitation_id = si.id
      WHERE si.survey_id = ?
      ORDER BY sr.submitted_at DESC
    `, [surveyId]);

    const headers = ['Nama', 'Email', 'Waktu Submit', ...questions.map(q => q.question_text)];
    const rows = [];

    for (const resp of responses) {
      const row = [resp.name, resp.email, new Date(resp.submitted_at).toLocaleString('id-ID')];
      for (const q of questions) {
        if (q.type !== 'short_answer') {
          const [ans] = await db.query(`
            SELECT GROUP_CONCAT(soo.option_text SEPARATOR ', ') as jawaban
            FROM survey_answer_options sao
            JOIN survey_question_options soo ON sao.survey_question_option_id = soo.id
            JOIN survey_answers sa ON sao.survey_answer_id = sa.id
            WHERE sa.survey_response_id = ? AND sa.survey_question_id = ?
          `, [resp.response_id, q.id]);
          row.push(ans[0].jawaban || '-');
        } else {
          const [ans] = await db.query(`
            SELECT answer_text FROM survey_answers
            WHERE survey_response_id = ? AND survey_question_id = ?
          `, [resp.response_id, q.id]);
          row.push(ans.length > 0 ? ans[0].answer_text : '-');
        }
      }
      rows.push(row);
    }

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="survey_${surveyId}_${Date.now()}.csv"`);
    res.send('\uFEFF' + csvContent);
  } catch (err) {
    next(err);
  }
};

// FITUR 6: REST API GET List Survey + Pertanyaan (REST API)
// Mengembalikan data JSON berupa kuesioner aktif lengkap dengan opsi jawabannya
const apiSurveys = async (req, res, next) => {
  try {
    const [surveys] = await db.query(
      'SELECT id, title, description, start_date, end_date FROM surveys WHERE is_active = 1'
    );

    for (const s of surveys) {
      const [questions] = await db.query(`
        SELECT sq.id, sq.question_text, sq.type
        FROM survey_questions sq
        JOIN survey_question_assignments sqa ON sq.id = sqa.survey_question_id
        WHERE sqa.survey_id = ?
        ORDER BY sqa.order ASC
      `, [s.id]);

      for (const q of questions) {
        if (q.type !== 'short_answer') {
          const [options] = await db.query(
            'SELECT id, option_text, weight FROM survey_question_options WHERE survey_question_id = ?',
            [q.id]
          );
          q.options = options;
        }
      }
      s.questions = questions;
    }

    res.json({ success: true, data: surveys, total: surveys.length });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  index,
  pinForm,
  pinValidate,
  fillForm,
  submit,
  rekap,
  rekapDetail,
  statistik,
  statistikDetail,
  exportCsv,
  apiSurveys
};