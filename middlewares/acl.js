/**
 * ACL Middleware untuk membatasi akses endpoint berdasarkan role user.
 * @param {string} requiredRole - Role yang diwajibkan (contoh: 'penanggung_jawab')
 */
const checkPermission = (requiredRole) => {
  return (req, res, next) => {
    if (!req.session.user) {
      return res.status(401).redirect('/login');
    }

    if (req.session.user.role === requiredRole) {
      return next();
    }

    // Jika role tidak sesuai, lemparkan halaman error 403 Forbidden
    res.status(403).render("error", {
      message: "Forbidden: Anda tidak memiliki izin/privilese untuk mengakses fitur ini.",
      error: { status: 403, stack: "" }
    });
  };
};

module.exports = {
  checkPermission
};