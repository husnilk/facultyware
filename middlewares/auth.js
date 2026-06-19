function isAuthenticated(req, res, next) {
    if (req.session.userId) {
        res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
        
        return next();
    }
    res.redirect("/login");
}

module.exports = {
    isAuthenticated,
};