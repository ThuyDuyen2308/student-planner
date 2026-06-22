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
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

async function register({ fullname, email, password }) {
  if (!email || !password) {
    const error = new Error('Email and password are required.');
    error.statusCode = 400;
    throw error;
  }

  const existing = await userModel.findByEmail(email);
  if (existing) {
    const error = new Error('Email is already registered.');
    error.statusCode = 400;
    throw error;
  }

  // Auto-generate username from email prefix if not provided (for legacy compatibility)
  const username = email.split('@')[0] + '_' + Date.now().toString().slice(-4);

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await userModel.create({
    username,
    password: hashedPassword,
    fullname: fullname?.trim() || null,
    email: email.trim(),
  });

  const token = generateToken(user);
  return { token, user: sanitizeUser(user) };
}

async function login({ email, password }) {
  if (!email || !password) {
    const error = new Error('Email and password are required.');
    error.statusCode = 400;
    throw error;
  }

  const user = await userModel.findByEmail(email);
  if (!user) {
    const error = new Error('Invalid email or password.');
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
    const error = new Error('Invalid email or password.');
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
