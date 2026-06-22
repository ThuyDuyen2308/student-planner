const puppeteer = require('puppeteer');

async function syncStudentData(studentId, password) {
  try {
    // Giả lập thời gian cào dữ liệu từ trang web DAU mất khoảng 3 giây
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Dữ liệu mẫu (Mock Data) chuẩn theo Cấu trúc Cơ sở dữ liệu
    const mockSubjects = [
      { subject_code: 'DAU101', subject_name: 'Cơ sở dữ liệu', credits: 3, lecturer: 'Nguyễn Văn A', midterm_score: 8.5, final_score: 9.0, total_score: 8.8, grade_letter: 'A' },
      { subject_code: 'DAU102', subject_name: 'Lập trình Web', credits: 4, lecturer: 'Trần Thị B', midterm_score: 7.0, final_score: 8.5, total_score: 7.8, grade_letter: 'B' },
      { subject_code: 'DAU103', subject_name: 'Cấu trúc dữ liệu', credits: 3, lecturer: 'Lê Văn C', midterm_score: 6.5, final_score: 7.0, total_score: 6.8, grade_letter: 'C' }
    ];

    const mockSchedules = [
      { subject_name: 'Cơ sở dữ liệu', lecturer: 'Nguyễn Văn A', day_of_week: 'Thứ 2', start_time: '07:00:00', end_time: '09:15:00', room: 'A203' },
      { subject_name: 'Lập trình Web', lecturer: 'Trần Thị B', day_of_week: 'Thứ 4', start_time: '09:30:00', end_time: '11:45:00', room: 'B105' },
      { subject_name: 'Cấu trúc dữ liệu', lecturer: 'Lê Văn C', day_of_week: 'Thứ 6', start_time: '13:00:00', end_time: '15:15:00', room: 'C302' },
      { subject_name: 'Tiếng Anh chuyên ngành', lecturer: 'Phạm Thị D', day_of_week: new Date().toLocaleDateString('vi-VN', { weekday: 'long' }), start_time: '15:30:00', end_time: '17:45:00', room: 'D101' } // Giả lập có môn học vào hôm nay
    ];

    const mockExams = [
      { subject_name: 'Cơ sở dữ liệu', exam_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], exam_time: '07:30:00', room: 'C102' }, // Thi sau 5 ngày
      { subject_name: 'Lập trình Web', exam_date: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], exam_time: '13:30:00', room: 'C105' } // Thi sau 10 ngày
    ];

    return {
      subjects: mockSubjects,
      schedules: mockSchedules,
      exams: mockExams
    };

  } catch (error) {
    throw new Error('Lỗi đồng bộ dữ liệu: ' + error.message);
  }
}

module.exports = {
  syncStudentData
};
