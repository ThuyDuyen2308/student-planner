const authService = require('../services/authService');

function handleError(res, error) {
  console.error(error);
  const statusCode = error.statusCode || 500;
  const message = error.statusCode ? error.message : 'Internal server error.';
  res.status(statusCode).json({ message });
}

async function register(req, res) {
  const { username, password, fullname, email } = req.body;

  if (!username?.trim() || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters.' });
  }

  try {
    const result = await authService.register({
      username: username.trim(),
      password,
      fullname,
      email,
    });
    res.status(201).json(result);
  } catch (error) {
    handleError(res, error);
  }
}

async function login(req, res) {
  const { username, password } = req.body;

  if (!username?.trim() || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  try {
    const result = await authService.login({
      username: username.trim(),
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
