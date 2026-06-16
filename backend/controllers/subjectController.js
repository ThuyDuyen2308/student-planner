const subjectService = require('../services/subjectService');

function handleError(res, error) {
  console.error(error);
  const statusCode = error.statusCode || 500;
  const message = error.statusCode ? error.message : 'Internal server error.';
  res.status(statusCode).json({ message });
}

async function getSubjects(req, res) {
  try {
    const search = req.query.search || req.query.q || '';
    const subjects = await subjectService.listSubjects(search);
    res.json({ subjects, count: subjects.length });
  } catch (error) {
    handleError(res, error);
  }
}

async function getSubjectById(req, res) {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'Invalid subject ID.' });
  }

  try {
    const subject = await subjectService.getSubjectById(id);
    res.json({ subject });
  } catch (error) {
    handleError(res, error);
  }
}

module.exports = {
  getSubjects,
  getSubjectById,
};
