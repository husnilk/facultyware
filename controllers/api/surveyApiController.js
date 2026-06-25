const db = require("../../lib/db");

const index = async (req, res, next) => {

    try {

        const [rows] = await db.query(
            "SELECT * FROM surveys ORDER BY id DESC"
        );

        res.json(rows);

    } catch (err) {
        next(err);
    }

};

module.exports = {
    index
};