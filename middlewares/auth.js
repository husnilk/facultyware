// Middleware to check if user is authenticated
function isAuthenticated(req, res, next) {
  if (process.env.NODE_ENV !== 'production' && process.env.DEV_NO_AUTH === '1') {
    return next();
  }
  
  if (req.session.userId) {
    return next();
  }
  res.redirect("/login?expired=1");
}

module.exports = {
  isAuthenticated,
};
