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
            FROM survey_question_assignments
            JOIN surveys
                ON survey_question_assignments.survey_id = surveys.id
            JOIN survey_questions
                ON survey_question_assignments.survey_question_id = survey_questions.id
            WHERE surveys.title LIKE ?
               OR survey_questions.question_text LIKE ?
            `,
            [
                `%${search}%`,
                `%${search}%`
            ]
        );

        const totalData = countRows[0].total;
        const totalPage = Math.ceil(totalData / limit);

        const [assignments] = await db.query(
            `
            SELECT
                survey_question_assignments.*,
                surveys.title AS survey_title,
                survey_questions.question_text
            FROM survey_question_assignments
            JOIN surveys
                ON survey_question_assignments.survey_id = surveys.id
            JOIN survey_questions
                ON survey_question_assignments.survey_question_id = survey_questions.id
            WHERE surveys.title LIKE ?
               OR survey_questions.question_text LIKE ?
            ORDER BY survey_question_assignments.id DESC
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

        res.render("assignment/index", {
            title: "Assignment",
            assignments,
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

        const [surveys] = await db.query(
            "SELECT * FROM surveys ORDER BY title ASC"
        );

        const [questions] = await db.query(
            "SELECT * FROM survey_questions ORDER BY question_text ASC"
        );

        res.render("assignment/create", {
            title: "Tambah Assignment",
            surveys,
            questions,
            error: null
        });

    } catch (err) {
        next(err);
    }

};

const store = async (req, res, next) => {

    const {
        survey_id,
        survey_question_id,
        order
    } = req.body;

    if (!survey_id || !survey_question_id || !order) {

        const [surveys] = await db.query(
            "SELECT * FROM surveys ORDER BY title ASC"
        );

        const [questions] = await db.query(
            "SELECT * FROM survey_questions ORDER BY question_text ASC"
        );

        return res.render("assignment/create", {
            title: "Tambah Assignment",
            surveys,
            questions,
            error: "Semua field wajib diisi."
        });

    }

    try {

        await db.query(
            `
            INSERT INTO survey_question_assignments
            (
                survey_id,
                survey_question_id,
                \`order\`,
                created_at,
                updated_at
            )
            VALUES
            (?, ?, ?, NOW(), NOW())
            `,
            [
                survey_id,
                survey_question_id,
                order
            ]
        );

        res.redirect("/assignment");

    } catch (err) {
        next(err);
    }

};

const editForm = async (req, res, next) => {

    try {

        const [rows] = await db.query(
            "SELECT * FROM survey_question_assignments WHERE id=?",
            [req.params.id]
        );

        const [surveys] = await db.query(
            "SELECT * FROM surveys ORDER BY title ASC"
        );

        const [questions] = await db.query(
            "SELECT * FROM survey_questions ORDER BY question_text ASC"
        );

        res.render("assignment/edit", {
            title: "Edit Assignment",
            assignment: rows[0],
            surveys,
            questions,
            error: null
        });

    } catch (err) {
        next(err);
    }

};

const update = async (req, res, next) => {

    const {
        survey_id,
        survey_question_id,
        order
    } = req.body;

    if (!survey_id || !survey_question_id || !order) {

        const [rows] = await db.query(
            "SELECT * FROM survey_question_assignments WHERE id=?",
            [req.params.id]
        );

        const [surveys] = await db.query(
            "SELECT * FROM surveys ORDER BY title ASC"
        );

        const [questions] = await db.query(
            "SELECT * FROM survey_questions ORDER BY question_text ASC"
        );

        return res.render("assignment/edit", {
            title: "Edit Assignment",
            assignment: rows[0],
            surveys,
            questions,
            error: "Semua field wajib diisi."
        });

    }

    try {

        await db.query(
            `
            UPDATE survey_question_assignments
            SET
                survey_id=?,
                survey_question_id=?,
                \`order\`=?,
                updated_at=NOW()
            WHERE id=?
            `,
            [
                survey_id,
                survey_question_id,
                order,
                req.params.id
            ]
        );

        res.redirect("/assignment");

    } catch (err) {
        next(err);
    }

};

const destroy = async (req, res, next) => {

    try {

        await db.query(
            "DELETE FROM survey_question_assignments WHERE id=?",
            [req.params.id]
        );

        res.redirect("/assignment");

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