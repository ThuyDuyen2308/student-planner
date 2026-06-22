const syncService = require('../services/syncService');
const syncedDataModel = require('../models/syncedDataModel');

async function triggerSync(req, res) {
  const { studentId = 'demo', password = 'demo' } = req.body || {};

  try {
    // 1. Cào dữ liệu từ cổng thông tin
    const data = await syncService.syncStudentData(studentId, password);

    // 2. Lưu vào Database
    await syncedDataModel.saveSyncedSubjects(req.user.id, data.subjects);
    await syncedDataModel.saveSyncedSchedules(req.user.id, data.schedules);
    await syncedDataModel.saveSyncedExams(req.user.id, data.exams);

    res.json({ message: 'Đồng bộ dữ liệu thành công!', data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Đồng bộ thất bại do lỗi hệ thống.' });
  }
}

async function getDashboardData(req, res) {
  try {
    const data = await syncedDataModel.getDashboardData(req.user.id);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Không thể lấy dữ liệu đồng bộ.' });
  }
}

// Nhận dữ liệu JSON từ Chrome Extension và lưu vào Database
async function receiveExtensionData(req, res) {
  const { subjects, schedules, exams } = req.body;

  if (!subjects || !schedules || !exams) {
    return res.status(400).json({ message: 'Dữ liệu không hợp lệ. Cần có subjects, schedules, và exams.' });
  }

  try {
    await syncedDataModel.saveSyncedSubjects(req.user.id, subjects);
    await syncedDataModel.saveSyncedSchedules(req.user.id, schedules);
    await syncedDataModel.saveSyncedExams(req.user.id, exams);

    console.log(`[Extension Sync] User ${req.user.id} synced: ${subjects.length} subjects, ${schedules.length} schedules, ${exams.length} exams.`);
    res.json({ message: 'Đồng bộ từ Extension thành công!', count: { subjects: subjects.length, schedules: schedules.length, exams: exams.length } });
  } catch (error) {
    console.error('[Extension Sync Error]', error);
    res.status(500).json({ message: 'Lỗi khi lưu dữ liệu từ Extension: ' + error.message });
  }
}

module.exports = {
  triggerSync,
  getDashboardData,
  receiveExtensionData
};
