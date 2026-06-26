const authMiddleware = (req, res, next) => {
  console.log("SESSION:", req.session);
  console.log("userId:", req.session.userId);
  if (!req.session.userId) {
    return res.redirect('/login');
  }
  next();
};

const isAuthenticated = authMiddleware;

module.exports = { authMiddleware, isAuthenticated };