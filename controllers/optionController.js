const db = require("../lib/db");

const index = async (req, res, next) => {

    try {

        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;

        const limit = 5;
        const offset = (page - 1) * limit;

        const [countRows] = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM survey_question_options
            JOIN survey_questions
                ON survey_question_options.survey_question_id = survey_questions.id
            WHERE survey_questions.question_text LIKE ?
               OR survey_question_options.option_text LIKE ?
            `,
            [
                `%${search}%`,
                `%${search}%`
            ]
        );

        const totalData = countRows[0].total;
        const totalPage = Math.ceil(totalData / limit);

        const [options] = await db.query(
            `
            SELECT
                survey_question_options.*,
                survey_questions.question_text
            FROM survey_question_options
            JOIN survey_questions
                ON survey_question_options.survey_question_id = survey_questions.id
            WHERE survey_questions.question_text LIKE ?
               OR survey_question_options.option_text LIKE ?
            ORDER BY survey_question_options.id DESC
            LIMIT ?
            OFFSET ?
            `,
            [
                `%${search}%`,
                `%${search}%`,
                limit,
                offset
            ]
        );

        res.render("option/index", {
            title: "Opsi Jawaban",
            options,
            search,
            page,
            totalPage
        });

    } catch (err) {
        next(err);
    }

};

const createForm = async (req, res, next) => {

    try {

        const [questions] = await db.query(
            "SELECT * FROM survey_questions ORDER BY id ASC"
        );

        res.render("option/create", {
            title: "Tambah Opsi Jawaban",
            questions,
            error: null
        });

    } catch (err) {
        next(err);
    }

};

const store = async (req, res, next) => {

    const {
        survey_question_id,
        option_text,
        weight
    } = req.body;

    if (!survey_question_id || !option_text || !weight) {

        const [questions] = await db.query(
            "SELECT * FROM survey_questions ORDER BY id ASC"
        );

        return res.render("option/create", {
            title: "Tambah Opsi Jawaban",
            questions,
            error: "Semua field wajib diisi."
        });

    }

    try {

        await db.query(
            `INSERT INTO survey_question_options
            (
                survey_question_id,
                option_text,
                weight,
                created_at,
                updated_at
            )
            VALUES
            (?,?,?,NOW(),NOW())`,
            [
                survey_question_id,
                option_text,
                weight
            ]
        );

        res.redirect("/option");

    } catch (err) {
        next(err);
    }

};

const editForm = async (req, res, next) => {

    try {

        const [rows] = await db.query(
            "SELECT * FROM survey_question_options WHERE id=?",
            [req.params.id]
        );

        const [questions] = await db.query(
            "SELECT * FROM survey_questions"
        );

        res.render("option/edit", {
            title: "Edit Opsi",
            option: rows[0],
            questions,
            error: null
        });

    } catch (err) {
        next(err);
    }

};

const update = async (req, res, next) => {

    const {
        survey_question_id,
        option_text,
        weight
    } = req.body;

    if (!survey_question_id || !option_text || !weight) {

        const [rows] = await db.query(
            "SELECT * FROM survey_question_options WHERE id=?",
            [req.params.id]
        );

        const [questions] = await db.query(
            "SELECT * FROM survey_questions"
        );

        return res.render("option/edit", {
            title: "Edit Opsi",
            option: rows[0],
            questions,
            error: "Semua field wajib diisi."
        });

    }

    try {

        await db.query(
            `UPDATE survey_question_options
            SET
                survey_question_id=?,
                option_text=?,
                weight=?,
                updated_at=NOW()
            WHERE id=?`,
            [
                survey_question_id,
                option_text,
                weight,
                req.params.id
            ]
        );

        res.redirect("/option");

    } catch (err) {
        next(err);
    }

};

const destroy = async (req, res, next) => {

    try {

        await db.query(
            "DELETE FROM survey_question_options WHERE id=?",
            [req.params.id]
        );

        res.redirect("/option");

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
    destroy
};