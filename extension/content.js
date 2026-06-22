// Tiện ích loại bỏ dấu tiếng Việt để so sánh chuỗi chính xác hơn
function removeAccents(str) {
  return str.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/đ/g, 'd')
            .replace(/Đ/g, 'D')
            .toLowerCase()
            .trim();
}

// Phân tích bảng lịch tuần dạng Grid (Thời khóa biểu của DAU)
function parseGridSchedule(table) {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length < 2) return null;

  // Lấy tiêu đề cột (để tìm Thứ)
  const headerRow = rows[0];
  const headerCells = Array.from(headerRow.querySelectorAll('th, td')).map(c => c.innerText.trim());
  
  const schedules = [];
  const subjectsSet = new Set();
  const subjects = [];

  // Quét toàn bộ các ô trong các dòng dữ liệu
  for (let r = 1; r < rows.length; r++) {
    const tds = Array.from(rows[r].querySelectorAll('td'));
    
    tds.forEach((td, colIndex) => {
      const text = td.innerText.trim();
      const normalizedText = removeAccents(text);
      
      // Nhận diện ô chứa lịch học bằng cách chuyển không dấu để tránh lỗi font chữ/tiếng Việt
      if (normalizedText.includes('tiet:') || normalizedText.includes('phong:') || normalizedText.includes('gv:')) {
        
        // Lấy thứ từ tiêu đề cột tương ứng
        const headerText = headerCells[colIndex] || '';
        let day_of_week = 'Chưa xác định';
        const dayMatch = headerText.match(/(Thứ\s*\d|Chủ\s*nhật|Thu\s*\d|Chu\s*nhat)/i);
        if (dayMatch) {
          day_of_week = dayMatch[1].trim().replace(/\s+/g, ' ');
          // Chuẩn hóa chữ hoa chữ thường
          day_of_week = day_of_week.charAt(0).toUpperCase() + day_of_week.slice(1);
        }

        // Tách các thẻ card môn học con bên trong nếu có nhiều môn cùng 1 ô
        let blocks = [];
        const divs = Array.from(td.querySelectorAll('div'));
        const leafDivs = divs.filter(d => {
          const divNorm = removeAccents(d.innerText);
          return (divNorm.includes('tiet:') || divNorm.includes('phong:')) && 
                 !Array.from(d.querySelectorAll('div')).some(child => {
                   const childNorm = removeAccents(child.innerText);
                   return childNorm.includes('tiet:');
                 });
        });

        if (leafDivs.length > 0) {
          blocks = leafDivs;
        } else {
          blocks = [td];
        }

        blocks.forEach(block => {
          const lines = block.innerText.split('\n').map(l => l.trim()).filter(Boolean);
          if (lines.length < 3) return;

          let subject_name = lines[0];
          let subject_code = 'DAU-' + Math.random().toString(36).substr(2, 5).toUpperCase();
          let lecturer = 'Chưa cập nhật';
          let room = 'Trực tuyến';
          let tietText = '';

          lines.forEach(line => {
            const lower = removeAccents(line);
            if (lower.startsWith('tiet:')) {
              tietText = line.replace(/^[Tt]iết\s*:\s*/i, '').trim();
            } else if (lower.startsWith('phong:')) {
              room = line.replace(/^[Pp]hòng\s*:\s*/i, '').trim();
            } else if (lower.startsWith('gv:')) {
              lecturer = line.replace(/^GV\s*:\s*/i, '').trim();
            } else if (line.includes(' - ') && !lower.startsWith('tiet:') && !lower.startsWith('phong:') && !lower.startsWith('gv:')) {
              // Dòng mã môn: "22CT1 - ECO30101" -> lấy ECO30101
              const parts = line.split('-');
              subject_code = parts[parts.length - 1].trim();
            }
          });

          // Quy đổi tiết học thành giờ học cụ thể
          let start_time = '07:00:00';
          let end_time = '09:15:00';
          const tietMatch = tietText.match(/(\d+)\s*-\s*(\d+)/) || tietText.match(/(\d+)/);
          if (tietMatch) {
            const tietDau = parseInt(tietMatch[1], 10);
            const tietCuoi = tietMatch[2] ? parseInt(tietMatch[2], 10) : tietDau;
            if (tietDau <= 5) {
              start_time = `${String(7 + (tietDau - 1)).padStart(2, '0')}:00:00`;
              end_time = `${String(7 + tietCuoi).padStart(2, '0')}:00:00`;
            } else {
              start_time = `${String(13 + (tietDau - 6)).padStart(2, '0')}:00:00`;
              end_time = `${String(13 + (tietCuoi - 5)).padStart(2, '0')}:00:00`;
            }
          }

          schedules.push({
            subject_name,
            lecturer,
            day_of_week,
            start_time,
            end_time,
            room
          });

          // Lưu môn học để đồng bộ bảng điểm
          if (!subjectsSet.has(subject_code)) {
            subjectsSet.add(subject_code);
            subjects.push({
              subject_code,
              subject_name,
              credits: 3, // Mặc định
              lecturer,
              midterm_score: null,
              final_score: null,
              total_score: null,
              grade_letter: ''
            });
          }
        });
      }
    });
  }

  return { schedules, subjects };
}

// Phân tích bảng Điểm số truyền thống
function parseSubjectsTable(table) {
  const rows = Array.from(table.querySelectorAll('tr'));
  if (rows.length < 2) return null;

  let headerRowIndex = -1;
  let headers = [];

  for (let i = 0; i < Math.min(rows.length, 5); i++) {
    const cells = Array.from(rows[i].querySelectorAll('th, td')).map(c => removeAccents(c.innerText));
    if (cells.some(c => c.includes('ma hp') || c.includes('ma hoc phan') || c.includes('ma mon'))) {
      headerRowIndex = i;
      headers = cells;
      break;
    }
  }

  if (headerRowIndex === -1) return null;

  const colIndex = {
    code: headers.findIndex(h => h.includes('ma hp') || h.includes('ma hoc phan') || h.includes('ma mon')),
    name: headers.findIndex(h => h.includes('ten hp') || h.includes('ten hoc phan') || h.includes('ten mon') || h.includes('ten lop hoc phan')),
    credits: headers.findIndex(h => h.includes('tin chi') || h.includes('so tc')),
    lecturer: headers.findIndex(h => h.includes('giang vien') || h.includes('gv') || h.includes('ten gv')),
    midterm: headers.findIndex(h => h.includes('giua ky') || h.includes('qua trinh') || h.includes('diem qt') || h.includes('chuyen can')),
    final: headers.findIndex(h => h.includes('cuoi ky') || h.includes('thi') || h.includes('diem thi')),
    total: headers.findIndex(h => h.includes('tong ket') || h.includes('diem tk') || h.includes('diem he 10') || h.includes('tong diem')),
    gradeLetter: headers.findIndex(h => h.includes('diem chu') || h.includes('thang diem chu') || h.includes('xep loai'))
  };

  if (colIndex.code === -1 || colIndex.name === -1) return null;

  const list = [];
  for (let i = headerRowIndex + 1; i < rows.length; i++) {
    const tds = Array.from(rows[i].querySelectorAll('td'));
    if (tds.length <= Math.max(...Object.values(colIndex))) continue;

    const subject_code = tds[colIndex.code]?.innerText.trim();
    const subject_name = tds[colIndex.name]?.innerText.trim();
    if (!subject_code || !subject_name) continue;

    list.push({
      subject_code,
      subject_name,
      credits: parseInt(tds[colIndex.credits]?.innerText.trim(), 10) || 3,
      lecturer: colIndex.lecturer !== -1 ? tds[colIndex.lecturer]?.innerText.trim() : 'Chưa cập nhật',
      midterm_score: colIndex.midterm !== -1 ? parseFloat(tds[colIndex.midterm]?.innerText.trim().replace(',', '.')) || null : null,
      final_score: colIndex.final !== -1 ? parseFloat(tds[colIndex.final]?.innerText.trim().replace(',', '.')) || null : null,
      total_score: colIndex.total !== -1 ? parseFloat(tds[colIndex.total]?.innerText.trim().replace(',', '.')) || null : null,
      grade_letter: colIndex.gradeLetter !== -1 ? tds[colIndex.gradeLetter]?.innerText.trim() : ''
    });
  }

  return list.length > 0 ? list : null;
}

// Lắng nghe lệnh từ Popup Extension
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'PARSE_DAU_DATA') {
    const tables = Array.from(document.querySelectorAll('table'));
    
    let allSchedules = [];
    let allSubjects = [];
    let allExams = [];

    for (const table of tables) {
      // 1. Thử phân tích theo dạng Grid Lịch tuần trước
      const gridResult = parseGridSchedule(table);
      if (gridResult) {
        allSchedules = [...allSchedules, ...gridResult.schedules];
        allSubjects = [...allSubjects, ...gridResult.subjects];
      }

      // 2. Thử phân tích dạng Bảng điểm truyền thống
      const listSubjects = parseSubjectsTable(table);
      if (listSubjects) {
        allSubjects = [...allSubjects, ...listSubjects];
      }
    }

    if (allSchedules.length === 0 && allSubjects.length === 0) {
      sendResponse({
        success: false,
        message: 'Không tìm thấy dữ liệu học tập hợp lệ trên trang. Hãy chắc chắn bạn đang mở đúng trang xem Lịch học hoặc Bảng điểm.'
      });
    } else {
      sendResponse({
        success: true,
        data: {
          subjects: allSubjects,
          schedules: allSchedules,
          exams: allExams
        }
      });
    }
  }
  return true;
});
