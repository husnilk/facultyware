// Dashboard dijadikan landing utama: root & /home mengarah ke sana.
const index = (req, res) => {
  res.redirect("/dashboard");
};

const home = (req, res) => {
  res.redirect("/dashboard");
};

module.exports = {
  index,
  home
};
