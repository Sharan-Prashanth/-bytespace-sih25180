// ALTCHA controller removed. CAPTCHA functionality was intentionally removed.
// Export minimal stubs that return 404 so any leftover imports won't cause runtime exceptions.

export const getChallenge = (req, res) => {
  return res.status(404).json({ success: false, message: 'CAPTCHA endpoints removed' });
};

export const verifyToken = (req, res) => {
  return res.status(404).json({ success: false, message: 'CAPTCHA endpoints removed' });
};
