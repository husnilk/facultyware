const db = require("../../lib/db");

const index = async (req, res, next) => {

    try {

        const [questions] = await db.query(`
            SELECT
                id,
                question_text,
                type,
                is_active,
                created_at,
                updated_at
            FROM survey_questions
            ORDER BY id DESC
        `);

        res.status(200).json(questions);

    } catch (err) {
        next(err);
    }

};

module.exports = {
    index
};