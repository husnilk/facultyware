const db = require('../lib/db');

exports.loginForm = (req, res) => {
    if (req.session.userId) {
        return res.redirect('/item');
    }
    res.render('login');
};

exports.loginSubmit = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        
        const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (rows.length > 0) {
            const user = rows[0];

            if (password === user.password) {
                req.session.userId = user.id;
                req.session.userName = user.name;
                return res.redirect('/item');
            }
        }

        return res.render('login', { error: 'Email atau Password Salah!' });
    } catch (err) {
        next(err);
    }
};

exports.logout = (req, res) => {
    req.session.destroy(() => {
        res.redirect('/login');
    });
};