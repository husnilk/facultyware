const db = require("../lib/db");
const PDFDocument = require("pdfkit");

/* =========================
   LIST SURVEY
========================= */
const index = async (req, res, next) => {
    try {

        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;

        const limit = 5;
        const offset = (page - 1) * limit;

        const [countResult] = await db.query(
            `
            SELECT COUNT(*) total
            FROM surveys
            WHERE title LIKE ?
            `,
            [`%${search}%`]
        );

        const totalData = countResult[0].total;
        const totalPage = Math.ceil(totalData / limit);

        const [surveys] = await db.query(
            `
            SELECT
                surveys.*,
                COUNT(survey_question_assignments.id) AS total_question
            FROM surveys
            LEFT JOIN survey_question_assignments
            ON surveys.id = survey_question_assignments.survey_id
            WHERE surveys.title LIKE ?
            GROUP BY surveys.id
            ORDER BY surveys.created_at DESC
            LIMIT ?
            OFFSET ?
            `,
            [
                `%${search}%`,
                limit,
                offset
            ]
        );

        res.render("survey/index", {
            title: "Survey",
            user: req.session.name,
            surveys,
            search,
            page,
            totalPage
        });

    } catch (err) {
        next(err);
    }
};

/* =========================
   CREATE
========================= */

const createForm = (req, res) => {

    res.render("survey/create", {
        title: "Tambah Survey",
        user: req.session.name
    });

};

/* =========================
   STORE
========================= */

const store = async (req, res, next) => {

    const {
        title,
        description,
        start_date,
        end_date
    } = req.body;

    try {

        await db.query(
            `
            INSERT INTO surveys
            (
                title,
                description,
                start_date,
                end_date,
                created_by,
                employee_id,
                created_at,
                updated_at
            )
            VALUES
            (?, ?, ?, ?, ?, ?, NOW(), NOW())
            `,
            [
                title,
                description,
                start_date,
                end_date,
                req.session.userId,
                req.session.userId
            ]
        );

        res.redirect("/survey");

    } catch (err) {
        next(err);
    }

};

/* =========================
   EDIT
========================= */

const editForm = async (req, res, next) => {

    try {

        const [rows] = await db.query(
            "SELECT * FROM surveys WHERE id=?",
            [req.params.id]
        );

        res.render("survey/edit", {
            title: "Edit Survey",
            user: req.session.name,
            survey: rows[0]
        });

    } catch (err) {
        next(err);
    }

};

/* =========================
   UPDATE
========================= */

const update = async (req, res, next) => {

    const {
        title,
        description,
        start_date,
        end_date
    } = req.body;

    try {

        await db.query(
            `
            UPDATE surveys
            SET
                title=?,
                description=?,
                start_date=?,
                end_date=?,
                updated_at=NOW()
            WHERE id=?
            `,
            [
                title,
                description,
                start_date,
                end_date,
                req.params.id
            ]
        );

        res.redirect("/survey");

    } catch (err) {
        next(err);
    }

};

/* =========================
   DELETE
========================= */

const destroy = async (req, res, next) => {

    try {

        await db.query(
            "DELETE FROM survey_question_assignments WHERE survey_id=?",
            [req.params.id]
        );

        await db.query(
            "DELETE FROM surveys WHERE id=?",
            [req.params.id]
        );

        res.redirect("/survey");

    } catch (err) {
        next(err);
    }

};

/* =========================
   PUBLISH
========================= */

const publish = async (req, res, next) => {

    try {

        await db.query(
            `
            UPDATE surveys
            SET
                is_active = IF(is_active=1,0,1),
                updated_at = NOW()
            WHERE id=?
            `,
            [req.params.id]
        );

        res.redirect("/survey");

    } catch (err) {
        next(err);
    }

};

/* =========================
   EXPORT PDF
========================= */

const exportPDF = async (req, res, next) => {

    try {

        const [surveys] = await db.query(
            `
            SELECT *
            FROM surveys
            ORDER BY created_at DESC
            `
        );

        const doc = new PDFDocument({
            margin: 40,
            size: "A4"
        });

        res.setHeader("Content-Type", "application/pdf");

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=survey.pdf"
        );

        doc.pipe(res);

        doc
            .fontSize(18)
            .text("LAPORAN DATA SURVEY", {
                align: "center"
            });

        doc.moveDown();

        surveys.forEach((survey, index) => {

            doc.fontSize(12);

            doc.text(`${index + 1}. ${survey.title}`);
            doc.text(`Deskripsi : ${survey.description}`);
            doc.text(`Tanggal Mulai : ${new Date(survey.start_date).toLocaleDateString("id-ID")}`);
            doc.text(`Tanggal Selesai : ${new Date(survey.end_date).toLocaleDateString("id-ID")}`);
            doc.text(`Status : ${survey.is_active ? "Aktif" : "Nonaktif"}`);

            doc.moveDown();

        });

        doc.end();

    } catch (err) {
        next(err);
    }

};

module.exports = {
    index,
    createForm,
    store,
    editForm,
    update,
    destroy,
    publish,
    exportPDF
};