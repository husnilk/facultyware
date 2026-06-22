exports.checkRole = (allowedRole) => {
    return (req, res, next) => {
        // Pastikan user sudah login dan punya session
        if (!req.session || !req.session.user) {
            return res.redirect('/login');
        }

        // Cek apakah role user saat ini cocok dengan role yang diizinkan untuk mengakses rute
        if (req.session.user.role === allowedRole) {
            return next(); // Izinkan masuk
        }

        // Jika role tidak cocok, tolak aksesnya
        res.status(403).send('Akses Ditolak: Anda tidak memiliki izin ke halaman ini.');
    };
};