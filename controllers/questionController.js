const db = require("../lib/db");

const index = async (req, res, next) => {
    try {
        const search = req.query.search || "";
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const offset = (page - 1) * limit;

        const [countResult] = await db.query(
            `
            SELECT COUNT(*) AS total
            FROM survey_questions
            WHERE question_text LIKE ?
            `,
            [`%${search}%`]
        );

        const totalData = countResult[0].total;
        const totalPage = Math.ceil(totalData / limit);

        const [questions] = await db.query(
            `
            SELECT *
            FROM survey_questions
            WHERE question_text LIKE ?
            ORDER BY id DESC
            LIMIT ?
            OFFSET ?
            `,
            [
                `%${search}%`,
                limit,
                offset
            ]
        );

        res.render("question/index", {
            title: "Question",
            user: req.session.name,
            questions,
            search,
            page,
            totalPage
        });

    } catch (err) {
        next(err);
    }
};

// =====================================
// LIST QUESTION BY SURVEY
// =====================================

const bySurvey = async (req, res, next) => {
    try {

        const surveyId = req.params.id;

        const [surveyRows] = await db.query(
            "SELECT * FROM surveys WHERE id=?",
            [surveyId]
        );

        // ✅ FIX IMPORTANT (WAJIB)
        if (!surveyRows || surveyRows.length === 0) {
            return res.redirect("/survey");
        }

        const [questions] = await db.query(
            `
            SELECT
                survey_questions.*,
                survey_question_assignments.id AS assignment_id,
                survey_question_assignments.\`order\`
            FROM survey_question_assignments
            JOIN survey_questions
                ON survey_question_assignments.survey_question_id = survey_questions.id
            WHERE survey_question_assignments.survey_id=?
            ORDER BY survey_question_assignments.\`order\`
            `,
            [surveyId]
        );

        res.render("question/bySurvey", {
            title: "Question List",
            user: req.session.name,
            survey: surveyRows[0],
            questions: questions || []
        });

    } catch (err) {
        next(err);
    }
};

// =====================================
// CREATE
// =====================================

const createForm = (req, res) => {

    res.render("question/create", {
        title: "Create Question",
        user: req.session.name,
        error: null,
        surveyId: req.params.surveyId
    });

};

const store = async (req, res, next) => {

    const { question_text, type } = req.body;
    const surveyId = req.params.surveyId;

    if (!question_text || question_text.trim() === "") {

        return res.render("question/create", {
            title: "Create Question",
            user: req.session.name,
            error: "Question is required.",
            surveyId
        });

    }

    try {

        const [result] = await db.query(
            `
            INSERT INTO survey_questions
            (
                question_text,
                type,
                is_active,
                created_at,
                updated_at
            )
            VALUES
            (?, ?, 1, NOW(), NOW())
            `,
            [
                question_text,
                type
            ]
        );

        const questionId = result.insertId;

        const [rows] = await db.query(
            `
            SELECT COALESCE(MAX(\`order\`),0)+1 AS nextOrder
            FROM survey_question_assignments
            WHERE survey_id=?
            `,
            [surveyId]
        );

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
                surveyId,
                questionId,
                rows[0].nextOrder
            ]
        );

        res.redirect("/question/survey/" + surveyId);

    } catch (err) {
        next(err);
    }

};

// =====================================
// EDIT
// =====================================

const editForm = async (req, res, next) => {

    try {

        const [rows] = await db.query(
            "SELECT * FROM survey_questions WHERE id=?",
            [req.params.id]
        );

        res.render("question/edit", {
            title: "Edit Question",
            user: req.session.name,
            question: rows[0],
            error: null
        });

    } catch (err) {
        next(err);
    }

};

const update = async (req, res, next) => {

    const { question_text, type } = req.body;

    try {

        if (!question_text || question_text.trim() === "") {

            const [rows] = await db.query(
                "SELECT * FROM survey_questions WHERE id=?",
                [req.params.id]
            );

            return res.render("question/edit", {
                title: "Edit Question",
                user: req.session.name,
                question: rows[0],
                error: "Question is required."
            });

        }

        await db.query(
            `
            UPDATE survey_questions
            SET
                question_text=?,
                type=?,
                updated_at=NOW()
            WHERE id=?
            `,
            [
                question_text,
                type,
                req.params.id
            ]
        );

        res.redirect("/question");

    } catch (err) {
        next(err);
    }

};

// =====================================
// DELETE
// =====================================

const destroy = async (req, res, next) => {

    try {

        const id = req.params.id;

        await db.query(
            "DELETE FROM survey_question_assignments WHERE survey_question_id=?",
            [id]
        );

        await db.query(
            "DELETE FROM survey_questions WHERE id=?",
            [id]
        );

        res.redirect("/question");

    } catch (err) {
        next(err);
    }

};

module.exports = {
    index,
    bySurvey,
    createForm,
    store,
    editForm,
    update,
    destroy
};