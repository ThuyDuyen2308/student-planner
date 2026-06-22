const express = require('express');
const authMiddleware = require('../middleware/auth');
const scheduleModel = require('../models/scheduleModel');

const router = express.Router();
router.use(authMiddleware);

function handleError(res, error) {
  console.error('[SchedulesRoute]', error.message);
  const code = error.statusCode || 500;
  res.status(code).json({ message: error.statusCode ? error.message : 'Internal server error.' });
}

// GET /api/schedules
router.get('/', async (req, res) => {
  try {
    const schedules = await scheduleModel.findAllByUser(req.user.id);
    res.json(schedules);
  } catch (e) { handleError(res, e); }
});

// POST /api/schedules
router.post('/', async (req, res) => {
  try {
    const { subject_id, day_of_week, start_time, end_time, room } = req.body;
    if (!subject_id || !day_of_week || !start_time || !end_time || !room?.trim())
      return res.status(400).json({ message: 'Thiếu dữ liệu bắt buộc (môn học, ngày, giờ, phòng).' });
    const created = await scheduleModel.create({
      user_id: req.user.id, subject_id, day_of_week, start_time, end_time, room: room.trim()
    });
    res.status(201).json(created);
  } catch (e) { handleError(res, e); }
});

// PUT /api/schedules/:id
router.put('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'ID không hợp lệ.' });
    const { subject_id, day_of_week, start_time, end_time, room } = req.body;
    if (!subject_id || !day_of_week || !start_time || !end_time || !room?.trim())
      return res.status(400).json({ message: 'Thiếu dữ liệu bắt buộc.' });
    const updated = await scheduleModel.update(id, req.user.id, {
      subject_id, day_of_week, start_time, end_time, room: room.trim()
    });
    if (!updated) return res.status(404).json({ message: 'Không tìm thấy lịch học.' });
    res.json(updated);
  } catch (e) { handleError(res, e); }
});

// DELETE /api/schedules/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ message: 'ID không hợp lệ.' });
    await scheduleModel.remove(id, req.user.id);
    res.json({ message: 'Đã xóa lịch học.' });
  } catch (e) { handleError(res, e); }
});

module.exports = router;
