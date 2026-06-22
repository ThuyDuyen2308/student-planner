const deadlineModel = require('../models/deadlineModel');

async function createDeadline(req, res) {
  try {
    const { title, subject_name, description, due_date, priority } = req.body;
    
    if (!title || !due_date) {
      return res.status(400).json({ message: 'Title and due date are required.' });
    }

    const deadline = await deadlineModel.create({
      user_id: req.user.id,
      title,
      subject_name,
      description,
      due_date,
      priority
    });

    res.status(201).json({ message: 'Deadline created successfully.', deadline });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create deadline.' });
  }
}

async function getDeadlines(req, res) {
  try {
    const deadlines = await deadlineModel.findByUserId(req.user.id);
    res.json({ deadlines });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to retrieve deadlines.' });
  }
}

async function updateDeadline(req, res) {
  try {
    const { id } = req.params;
    const { title, subject_name, description, due_date, priority, status } = req.body;

    const updated = await deadlineModel.update(id, req.user.id, {
      title, subject_name, description, due_date, priority, status
    });

    if (!updated) {
      return res.status(404).json({ message: 'Deadline not found or permission denied.' });
    }

    res.json({ message: 'Deadline updated successfully.', deadline: updated });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update deadline.' });
  }
}

async function deleteDeadline(req, res) {
  try {
    const { id } = req.params;
    const deleted = await deadlineModel.remove(id, req.user.id);

    if (!deleted) {
      return res.status(404).json({ message: 'Deadline not found or permission denied.' });
    }

    res.json({ message: 'Deadline deleted successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete deadline.' });
  }
}

module.exports = {
  createDeadline,
  getDeadlines,
  updateDeadline,
  deleteDeadline
};
