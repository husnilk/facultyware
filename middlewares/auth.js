exports.isAuthenticated = (req, res, next) => {
    // Cek apakah ada objek user di dalam session
    if (req.session && req.session.user) {
        return next(); // Lanjut ke proses controller
    }
    
    // Jika belum login, tendang balik ke halaman login
    res.redirect('/login');
};