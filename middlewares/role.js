function isPegawai(req, res, next) {
  if (req.session && req.session.role === 'pegawai') {
    return next();
  }
  res.status(403).render("error", {
    message: "Forbidden: Halaman ini hanya untuk Pegawai.",
    error: { status: 403, stack: "" }
  });
}

function isPimpinan(req, res, next) {
  if (req.session && req.session.role === 'pimpinan') {
    return next();
  }
  res.status(403).render("error", {
    message: "Forbidden: Halaman ini hanya untuk Pimpinan.",
    error: { status: 403, stack: "" }
  });
}

module.exports = {
  isPegawai,
  isPimpinan
};
