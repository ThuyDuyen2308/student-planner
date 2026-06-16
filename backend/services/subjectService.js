const subjectModel = require('../models/subjectModel');

async function listSubjects(search = '') {
  return subjectModel.findAll(search);
}

async function getSubjectById(id) {
  const subject = await subjectModel.findById(id);
  if (!subject) {
    const error = new Error('Subject not found.');
    error.statusCode = 404;
    throw error;
  }
  return subject;
}

module.exports = {
  listSubjects,
  getSubjectById,
};
