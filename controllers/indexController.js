const bcrypt = require("bcryptjs");
const db = require("../lib/db");

/**
 * Halaman awal
 */
const index = (req, res) => {
    if (req.session.userId) {
        return res.redirect("/home");
    }

    res.redirect("/login");
};

/**
 * Halaman Home
 */
const home = async (req, res, next) => {

    try {

        const [[survey]] = await db.query(
            "SELECT COUNT(*) total FROM surveys"
        );

        const [[question]] = await db.query(
            "SELECT COUNT(*) total FROM survey_questions"
        );

      const [[option]] = await db.query(
    "SELECT COUNT(*) total FROM survey_question_options"
);

        const [[assignment]] = await db.query(
            "SELECT COUNT(*) total FROM survey_question_assignments"
        );

        res.render("home", {
            title: "Dashboard",
            user: req.session.name,

            totalSurvey: survey.total,
            totalQuestion: question.total,
            totalOption: option.total,
            totalAssignment: assignment.total

        });

    } catch (err) {

        next(err);

    }

};
/**
 * Halaman Login
 */
const loginPage = (req, res) => {

    if (req.session.userId) {
        return res.redirect("/home");
    }

    res.render("login", {
        title: "Login",
        error: null,
    });

};

/**
 * Proses Login
 */
const login = async (req, res, next) => {

    const {
        email,
        password
    } = req.body;

    try {

        const [rows] = await db.query(
            "SELECT * FROM users WHERE email=?",
            [email]
        );

        if (rows.length === 0) {

            return res.render("login", {
                title: "Login",
                error: "Email atau password salah"
            });

        }

        const user = rows[0];

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {

            return res.render("login", {
                title: "Login",
                error: "Email atau password salah"
            });

        }

        req.session.userId = user.id;
        req.session.name = user.name;
        req.session.email = user.email;

        res.redirect("/home");

    }

    catch (err) {

        next(err);

    }

};

/**
 * Logout
 */
const logout = (req, res, next) => {

    req.session.destroy((err) => {

        if (err) {

            return next(err);

        }

        res.redirect("/login");

    });

};

module.exports = {

    index,

    home,

    loginPage,

    login,

    logout

};