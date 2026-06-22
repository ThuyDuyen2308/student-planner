const authService = require('../services/authService');

function handleError(res, error) {
  console.error(error);
  const statusCode = error.statusCode || 500;
  const message = error.statusCode ? error.message : 'Internal server error.';
  res.status(statusCode).json({ message });
}

async function register(req, res) {
  const { email, password, fullname } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    const result = await authService.register({
      email: email.trim(),
      password,
      fullname,
    });
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  if (!email?.trim() || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  try {
    const result = await authService.login({
      email: email.trim(),
      password,
    });
    res.json(result);
  } catch (error) {
    handleError(res, error);
  }
}

async function logout(_req, res) {
  res.json({ message: 'Logged out successfully.' });
}

async function getMe(req, res) {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json({ user });
  } catch (error) {
    handleError(res, error);
  }
}

module.exports = {
  register,
  login,
  logout,
  getMe,
};
