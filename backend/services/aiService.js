const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');

const apiKey = process.env.GEMINI_API_KEY;
const isValidKey = apiKey && (apiKey.trim().startsWith('AIzaSy') || apiKey.trim().startsWith('AQ.'));
const genAI = isValidKey ? new GoogleGenerativeAI(apiKey.trim()) : null;

async function extractTextFromFile(filePath, fileType) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    let text = '';

    if (fileType === 'pdf') {
      const data = await pdfParse(dataBuffer);
      text = data.text;
    } else if (fileType === 'docx') {
      const data = await mammoth.extractRawText({ buffer: dataBuffer });
      text = data.value;
    } else if (fileType === 'txt') {
      text = dataBuffer.toString('utf8');
    }

    return text.substring(0, 30000); // Giới hạn số ký tự
  } catch (error) {
    throw new Error('Lỗi khi đọc nội dung file: ' + error.message);
  }
}

async function summarizeText(text, lengthType) {
  if (!genAI) {
    // Chế độ giả lập khi thiếu API Key
    return `[Mock AI Summary] Đây là bản tóm tắt giả lập cho văn bản dài ${text.length} ký tự. Nội dung chính xoay quanh các khái niệm trọng tâm của môn học, giúp học viên ôn tập các định nghĩa cốt lõi, chuẩn bị tốt cho các bài kiểm tra định kỳ và cuối kỳ.`;
  }

  let prompt = '';
  if (lengthType === 'short') {
    prompt = 'Hãy tóm tắt văn bản sau trong khoảng 5-10 dòng:\n\n' + text;
  } else if (lengthType === 'medium') {
    prompt = 'Hãy tóm tắt văn bản sau chi tiết trong khoảng 1 trang:\n\n' + text;
  } else {
    prompt = 'Hãy tóm tắt đầy đủ các ý chính của văn bản sau:\n\n' + text;
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

async function generateQuiz(text) {
  if (!genAI) {
    // Chế độ giả lập khi thiếu API Key
    return {
      mcq: [
        {
          question: "Câu hỏi trắc nghiệm giả lập 1: Đâu là mục tiêu chính của môn học?",
          options: ["A. Nắm vững kiến thức nền tảng", "B. Thi qua môn", "C. Không cần học", "D. Bỏ học"],
          answer: "A. Nắm vững kiến thức nền tảng"
        },
        {
          question: "Câu hỏi trắc nghiệm giả lập 2: Đâu là phương pháp ôn tập hiệu quả?",
          options: ["A. Học dồn đêm cuối", "B. Lên kế hoạch ôn tập chi tiết hàng ngày", "C. Xem phim", "D. Ngủ sớm"],
          answer: "B. Lên kế hoạch ôn tập chi tiết hàng ngày"
        }
      ],
      essay: [
        "Câu hỏi tự luận giả lập 1: Hãy phân tích tầm quan trọng của việc lập kế hoạch học tập.",
        "Câu hỏi tự luận giả lập 2: Nêu các bước cơ bản để chuẩn bị cho một kỳ thi hiệu quả."
      ],
      flashcard: [
        { front: "Phương pháp ôn tập Pomodoro là gì?", back: "Học tập tập trung trong 25 phút, nghỉ ngơi 5 phút." },
        { front: "Mục đích của việc tóm tắt tài liệu?", back: "Giúp ghi nhớ nhanh các ý chính của bài học." }
      ]
    };
  }

  const prompt = `Từ nội dung văn bản sau, hãy sinh ra 3 phần:
1. 10 câu hỏi trắc nghiệm (có 4 đáp án A, B, C, D và ghi rõ đáp án đúng).
2. 5 câu hỏi tự luận.
3. 10 Flashcard (câu hỏi ngắn - đáp án ngắn).

Hãy trả về CHỈ MỘT chuỗi JSON hợp lệ theo định dạng sau, không có markdown code block:
{
  "mcq": [ { "question": "...", "options": ["A. ...", "B. ...", "C. ...", "D. ..."], "answer": "A. ..." } ],
  "essay": [ "câu 1", "câu 2" ],
  "flashcard": [ { "front": "hỏi", "back": "đáp" } ]
}

Văn bản:
${text}`;

  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
  const result = await model.generateContent(prompt);
  const rawText = result.response.text();
  
  const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleanedText);
  } catch (e) {
    console.error("Lỗi parse JSON từ AI:", cleanedText);
    throw new Error('AI trả về định dạng không hợp lệ.');
  }
}

async function chatWithAI(history, userMessage) {
  if (!genAI) {
    // Chế độ giả lập khi thiếu API Key
    const lowerMessage = userMessage.toLowerCase();
    if (lowerMessage.includes('hello') || lowerMessage.includes('chào') || lowerMessage.includes('hi')) {
      return "Xin chào! Tôi là Trợ lý Học tập AI của bạn. Bạn muốn tôi giúp đỡ điều gì hôm nay? (Lưu ý: Hệ thống đang chạy ở chế độ AI Giả lập do chưa có khóa GEMINI_API_KEY thực tế trong file .env).";
    }
    return `[Mock AI Response] Cảm ơn câu hỏi của bạn: "${userMessage}". Với vai trò là Trợ lý Học tập của bạn, tôi khuyên bạn nên tập trung xem lại thời khóa biểu, ôn tập đều đặn các môn học đã đồng bộ, và lập các deadline cụ thể cho từng bài tập lớn nhé!`;
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
  
  const formattedHistory = history.map(msg => ({
    role: msg.role === 'ai' ? 'model' : 'user',
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history: formattedHistory,
  });

  const result = await chat.sendMessage(userMessage);
  return result.response.text();
}

async function generateStudyPlan({ subjectName, examDate, proficiencyLevel, hoursPerDay }) {
  if (!genAI) {
    // Chế độ giả lập khi thiếu API Key
    return [
      { day: 1, date: new Date().toISOString().split('T')[0], activities: [`Xem lại giáo trình môn ${subjectName}`, "Lập danh mục các chương trọng tâm"] },
      { day: 2, date: new Date(Date.now() + 24*60*60*1000).toISOString().split('T')[0], activities: ["Giải đề cương ôn tập chương 1 & 2", "Luyện tập 10 câu trắc nghiệm"] },
      { day: 3, date: new Date(Date.now() + 2*24*60*60*1000).toISOString().split('T')[0], activities: ["Xem lại các lỗi sai thường gặp", `Chuẩn bị tinh thần thi tốt ngày ${examDate}`] }
    ];
  }

  const prompt = `Hãy lập một kế hoạch ôn thi chi tiết cho sinh viên.
- Môn học: ${subjectName}
- Ngày thi: ${examDate}
- Mức độ hiểu bài hiện tại: ${proficiencyLevel} (weak, medium, good)
- Thời gian học: ${hoursPerDay} giờ/ngày

Hãy trả về CHỈ MỘT chuỗi JSON hợp lệ theo định dạng sau (không markdown block):
[
  { "day": 1, "date": "YYYY-MM-DD", "activities": ["Ôn chương 1", "Làm bài tập"] },
  { "day": 2, "date": "YYYY-MM-DD", "activities": ["..."] }
]`;

  const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
  const result = await model.generateContent(prompt);
  const rawText = result.response.text();
  
  const cleanedText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleanedText);
  } catch (e) {
    throw new Error('AI trả về định dạng không hợp lệ.');
  }
}

module.exports = {
  extractTextFromFile,
  summarizeText,
  generateQuiz,
  chatWithAI,
  generateStudyPlan
};
