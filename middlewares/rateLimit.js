const requestBuckets = new Map();

const createRateLimiter = ({ windowMs, max, keyGenerator, message }) => {
  return (req, res, next) => {
    const now = Date.now();
    const key = keyGenerator(req);
    const bucket = requestBuckets.get(key);

    if (!bucket || now > bucket.resetAt) {
      requestBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    if (bucket.count >= max) {
      return res.status(429).render("password", {
        title: "Change Password",
        user: req.session.username,
        error: message || "Too many requests. Please try again later.",
        success: null,
      });
    }

    bucket.count += 1;
    requestBuckets.set(key, bucket);
    next();
  };
};

module.exports = {
  createRateLimiter,
};
