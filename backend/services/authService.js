const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const userModel = require('../models/userModel');

function sanitizeUser(user) {
  if (!user) return null;
  const { password, ...safeUser } = user;
  return safeUser;
}

function generateToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

async function register({ username, password, fullname, email }) {
  const existing = await userModel.findByUsername(username);
  if (existing) {
    const error = new Error('Username is already taken.');
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userModel.create({
    username,
    password: hashedPassword,
    fullname: fullname?.trim() || null,
    email: email?.trim() || null,
  });

  const token = generateToken(user);
  return { token, user: sanitizeUser(user) };
}

async function login({ username, password }) {
  const user = await userModel.findByUsername(username);
  if (!user) {
    const error = new Error('Invalid username or password.');
    error.statusCode = 401;
    throw error;
  }

  if (user.is_blocked) {
    const error = new Error('Your account has been blocked. Please contact support.');
    error.statusCode = 403;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid username or password.');
    error.statusCode = 401;
    throw error;
  }

  const token = generateToken(user);
  return { token, user: sanitizeUser(user) };
}

async function getProfile(userId) {
  const user = await userModel.findById(userId);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }
  return sanitizeUser(user);
}

module.exports = {
  register,
  login,
  getProfile,
};
