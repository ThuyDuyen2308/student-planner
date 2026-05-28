const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_key_student_planner_123!';

module.exports = function (req, res, next) {
  // Get token from header
  const authHeader = req.header('Authorization');

  // Check if no header
  if (!authHeader) {
    return res.status(401).json({ message: 'No authorization token, access denied.' });
  }

  // Expecting format: Bearer <token>
  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Token format is invalid. Use Bearer <token>.' });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains user properties: id, username
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token is invalid or has expired.' });
  }
};
