

// Helper to convert 10-point score to 4-point scale
const getGradePoint4 = (score) => {
  const s = parseFloat(score);
  if (s >= 9.0) return 4.0;
  if (s >= 8.5) return 3.7;
  if (s >= 8.0) return 3.5;
  if (s >= 7.0) return 3.0;
  if (s >= 6.5) return 2.5;
  if (s >= 6.0) return 2.0;
  if (s >= 5.0) return 1.5;
  if (s >= 4.0) return 1.0;
  return 0.0;
};

// Helper to get Letter Grade
const getLetterGrade = (score) => {
  const s = parseFloat(score);
  if (s >= 9.0) return 'A+';
  if (s >= 8.5) return 'A';
  if (s >= 8.0) return 'B+';
  if (s >= 7.0) return 'B';
  if (s >= 6.5) return 'C+';
  if (s >= 6.0) return 'C';
  if (s >= 5.0) return 'D+';
  if (s >= 4.0) return 'D';
  return 'F';
};

export default function GPAWidget({ subjects }) {
  const totalCredits = subjects.reduce((sum, sub) => sum + sub.credit, 0);
  
  // 1. GPA system 10 (Weighted average score)
  const weightedScoreSum10 = subjects.reduce((sum, sub) => sum + (parseFloat(sub.score) * sub.credit), 0);
  const gpa10 = totalCredits > 0 ? (weightedScoreSum10 / totalCredits) : 0;

  // 2. GPA system 4 (Weighted average grade point out of 4.0)
  const weightedScoreSum4 = subjects.reduce((sum, sub) => sum + (getGradePoint4(sub.score) * sub.credit), 0);
  const gpa4 = totalCredits > 0 ? (weightedScoreSum4 / totalCredits) : 0;
  
  // Classification based on GPA 4.0
  let classification = 'Chưa có môn';
  let classClass = 'score-fail';
  if (totalCredits > 0) {
    if (gpa4 >= 3.6) {
      classification = 'Xuất sắc 🏆';
      classClass = 'score-excellent';
    } else if (gpa4 >= 3.2) {
      classification = 'Giỏi 🌟';
      classClass = 'score-excellent';
    } else if (gpa4 >= 2.5) {
      classification = 'Khá 👍';
      classClass = 'score-good';
    } else if (gpa4 >= 2.0) {
      classification = 'Trung bình 📚';
      classClass = 'score-average';
    } else {
      classification = 'Yếu/Kém ⚠️';
      classClass = 'score-fail';
    }
  }

  // SVG Progress Ring calculations (using GPA 4.0 for progress circle)
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progressPercent = Math.min(Math.max(gpa4 / 4.0, 0), 1);
  const strokeDashoffset = circumference - progressPercent * circumference;

  return (
    <div className="glass-card gpa-card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', width: '100%' }}>
        <div className="gpa-ring-wrapper">
          <svg className="gpa-ring-svg" viewBox="0 0 90 90">
            <defs>
              <linearGradient id="gpa-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--secondary)" />
                <stop offset="100%" stopColor="var(--primary)" />
              </linearGradient>
            </defs>
            <circle
              className="gpa-ring-bg"
              cx="45"
              cy="45"
              r={radius}
            />
            <circle
              className="gpa-ring-progress"
              cx="45"
              cy="45"
              r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>
          <span className="gpa-ring-value" style={{ fontSize: '1.3rem' }}>{gpa4.toFixed(2)}</span>
        </div>

        <div className="gpa-stats" style={{ flex: 1 }}>
          <span className="gpa-title">Điểm trung bình học tập</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', margin: '4px 0' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: 800 }}>Hệ 4: {gpa4.toFixed(2)}</span>
            <span className={`subject-score-badge ${classClass}`} style={{ padding: '2px 8px', fontSize: '0.75rem' }}>
              {classification}
            </span>
          </div>
          <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Hệ 10: {gpa10.toFixed(2)} / 10
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', fontSize: '0.85rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>
          Môn học: <strong>{subjects.length}</strong>
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          Tín chỉ: <strong>{totalCredits}</strong>
        </span>
        <span style={{ color: 'var(--text-muted)' }}>
          Quy đổi: <strong>{totalCredits > 0 ? getLetterGrade(gpa10) : '-'}</strong>
        </span>
      </div>
    </div>
  );
}
