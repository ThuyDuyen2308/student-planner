const aiService = require('../services/aiService');
const aiModel = require('../models/aiModel');
const documentModel = require('../models/documentModel');

async function summarize(req, res) {
  try {
    const { documentId, type } = req.body;
    const document = await documentModel.findById(documentId);
    
    if (!document || document.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Tài liệu không tồn tại.' });
    }

    const text = await aiService.extractTextFromFile(document.filepath, document.filetype);
    const summary = await aiService.summarizeText(text, type);
    
    await aiModel.saveSummary(req.user.id, documentId, type, summary);
    res.json({ message: 'Tóm tắt thành công!', summary });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Lỗi khi tóm tắt.' });
  }
}

async function generateQuiz(req, res) {
  try {
    const { documentId } = req.body;
    const document = await documentModel.findById(documentId);
    
    if (!document || document.user_id !== req.user.id) {
      return res.status(404).json({ message: 'Tài liệu không tồn tại.' });
    }

    const text = await aiService.extractTextFromFile(document.filepath, document.filetype);
    const quizJSON = await aiService.generateQuiz(text);
    
    await aiModel.saveQuiz(req.user.id, documentId, quizJSON);
    res.json({ message: 'Sinh câu hỏi thành công!', data: quizJSON });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Lỗi khi sinh câu hỏi.' });
  }
}

async function chat(req, res) {
  try {
    const { sessionId, message } = req.body;
    if (!sessionId || !message) return res.status(400).json({ message: 'Thiếu thông tin.' });

    // Lấy lịch sử chat
    const history = await aiModel.getChatHistory(req.user.id, sessionId);
    
    // Gọi AI
    const replyText = await aiService.chatWithAI(history, message);

    // Lưu lại
    await aiModel.saveChatMessage(req.user.id, sessionId, 'user', message);
    await aiModel.saveChatMessage(req.user.id, sessionId, 'ai', replyText);

    res.json({ reply: replyText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Lỗi khi chat.' });
  }
}

async function getChatHistory(req, res) {
  try {
    const { sessionId } = req.params;
    const history = await aiModel.getChatHistory(req.user.id, sessionId);
    res.json({ history });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy lịch sử chat.' });
  }
}

async function planStudy(req, res) {
  try {
    const { subjectName, examDate, proficiencyLevel, hoursPerDay } = req.body;
    
    const planJSON = await aiService.generateStudyPlan({ subjectName, examDate, proficiencyLevel, hoursPerDay });
    
    await aiModel.saveStudyPlan(req.user.id, subjectName, examDate, proficiencyLevel, hoursPerDay, planJSON);
    res.json({ message: 'Lập kế hoạch thành công!', plan: planJSON });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message || 'Lỗi khi lập kế hoạch.' });
  }
}

async function getStudyPlans(req, res) {
  try {
    const plans = await aiModel.getStudyPlans(req.user.id);
    res.json({ plans });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy danh sách kế hoạch.' });
  }
}

module.exports = {
  summarize,
  generateQuiz,
  chat,
  getChatHistory,
  planStudy,
  getStudyPlans
};
