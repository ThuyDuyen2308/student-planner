import { BarChart3, PieChart, GraduationCap, Award } from 'lucide-react';

export default function StatisticsWidget({ subjects, assignments }) {
  // 1. Calculations for subjects & credits
  const totalCredits = subjects.reduce((sum, sub) => sum + sub.credit, 0);
  const completedSubjects = subjects.filter(sub => sub.status === 'completed' && sub.score !== null);
  const completedCredits = completedSubjects.reduce((sum, sub) => sum + sub.credit, 0);
  const studyingSubjects = subjects.filter(sub => sub.status === 'studying');

  const creditPercent = totalCredits > 0 ? (completedCredits / totalCredits) * 100 : 0;

  // 2. Calculations for assignments
  const totalAssignments = assignments.length;
  const completedAssignments = assignments.filter(a => a.status === 'completed').length;
  const pendingAssignments = totalAssignments - completedAssignments;
  const assignmentPercent = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 100 : 0;

  // Donut chart parameters for assignments
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (assignmentPercent / 100) * circumference;

  // 3. Subject scores breakdown (Bar Chart)
  // Let's take the first 8 completed subjects to fit the chart nicely
  const chartSubjects = completedSubjects.slice(0, 8);
  const maxScore = 10;
  const barChartHeight = 120;
  const barChartWidth = 320;
  const paddingX = 30;
  const paddingY = 20;

  const getBarColor = (score) => {
    if (score >= 8.5) return 'url(#purple-gradient)'; // Excellent
    if (score >= 6.5) return 'url(#emerald-gradient)'; // Good
    if (score >= 5.0) return 'url(#cyan-gradient)'; // Average
    return 'url(#red-gradient)'; // Fail
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Overview Statistics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
        
        {/* Credits completion glass card */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
          <div className="gpa-ring-wrapper" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--secondary)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GraduationCap size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Tín chỉ tích lũy</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{completedCredits} / {totalCredits}</span>
          </div>
        </div>

        {/* Assignments completed glass card */}
        <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem' }}>
          <div className="gpa-ring-wrapper" style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Award size={20} />
          </div>
          <div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>Bài tập hoàn thành</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{completedAssignments} / {totalAssignments}</span>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        
        {/* SVG Bar Chart for Subject Scores */}
        <div className="glass-card" style={{ padding: '1.25rem' }}>
          <h4 className="gradient-text" style={{ fontSize: '1.05rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={18} color="var(--primary)" />
            Phân Tích Điểm Số Môn Học
          </h4>
          
          {completedSubjects.length === 0 ? (
            <div className="empty-state" style={{ height: '140px' }}>
              <BarChart3 size={28} />
              <p style={{ fontSize: '0.8rem' }}>Chưa có môn học nào hoàn thành để vẽ biểu đồ.</p>
            </div>
          ) : (
            <div style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}>
              <svg width={barChartWidth} height={barChartHeight} style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="purple-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#c084fc" stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id="emerald-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#34d399" stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id="cyan-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#22d3ee" stopOpacity="1" />
                  </linearGradient>
                  <linearGradient id="red-gradient" x1="0%" y1="100%" x2="0%" y2="0%">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#fb7185" stopOpacity="1" />
                  </linearGradient>
                </defs>

                {/* Y Axis gridlines (Score 0, 5, 10) */}
                <line x1={paddingX} y1={paddingY} x2={barChartWidth} y2={paddingY} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                <text x={paddingX - 10} y={paddingY + 4} fontSize="9" fill="var(--text-muted)" textAnchor="end">10</text>
                
                <line x1={paddingX} y1={paddingY + (barChartHeight - 2 * paddingY) / 2} x2={barChartWidth} y2={paddingY + (barChartHeight - 2 * paddingY) / 2} stroke="var(--border-color)" strokeWidth="1" strokeDasharray="4 4" />
                <text x={paddingX - 10} y={paddingY + (barChartHeight - 2 * paddingY) / 2 + 4} fontSize="9" fill="var(--text-muted)" textAnchor="end">5</text>
                
                <line x1={paddingX} y1={barChartHeight - paddingY} x2={barChartWidth} y2={barChartHeight - paddingY} stroke="var(--text-muted)" strokeWidth="1" />
                <text x={paddingX - 10} y={barChartHeight - paddingY + 4} fontSize="9" fill="var(--text-muted)" textAnchor="end">0</text>

                {/* Bars */}
                {chartSubjects.map((sub, idx) => {
                  const barCount = chartSubjects.length;
                  const availableWidth = barChartWidth - paddingX - 10;
                  const barWidth = Math.max(10, Math.min(24, (availableWidth / barCount) - 10));
                  const spacing = (availableWidth / barCount);
                  const x = paddingX + idx * spacing + (spacing - barWidth) / 2;
                  
                  const score = parseFloat(sub.score);
                  const graphHeight = barChartHeight - 2 * paddingY;
                  const barHeight = (score / maxScore) * graphHeight;
                  const y = barChartHeight - paddingY - barHeight;

                  return (
                    <g key={sub.id} className="chart-bar-group">
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        fill={getBarColor(score)}
                        rx="4"
                      />
                      {/* Hover score label */}
                      <text
                        x={x + barWidth / 2}
                        y={y - 4}
                        fontSize="9"
                        fontWeight="bold"
                        fill="var(--text-color)"
                        textAnchor="middle"
                        className="chart-hover-label"
                      >
                        {score.toFixed(1)}
                      </text>
                      {/* X label (Abbreviated name) */}
                      <text
                        x={x + barWidth / 2}
                        y={barChartHeight - paddingY + 12}
                        fontSize="8"
                        fill="var(--text-muted)"
                        textAnchor="middle"
                        style={{ maxWidth: barWidth }}
                      >
                        {sub.name.length > 5 ? sub.name.substring(0, 4) + '..' : sub.name}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
          {completedSubjects.length > 8 && (
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '6px' }}>
              * Đang hiển thị điểm số của 8 môn học gần nhất.
            </p>
          )}
        </div>

        {/* SVG Donut Chart for Assignments & Credits Progress */}
        <div className="glass-card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h4 className="gradient-text" style={{ fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PieChart size={18} color="var(--secondary)" />
            Tiến Độ Bài Tập & Deadline
          </h4>

          {totalAssignments === 0 ? (
            <div className="empty-state" style={{ height: '120px' }}>
              <PieChart size={28} />
              <p style={{ fontSize: '0.8rem' }}>Chưa có bài tập nào để thống kê tiến độ.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              {/* Circular donut chart */}
              <div style={{ position: 'relative', width: '70px', height: '70px', flexShrink: 0 }}>
                <svg width="70" height="70" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
                  <circle
                    cx="30"
                    cy="30"
                    r={radius}
                    fill="none"
                    stroke="var(--border-color)"
                    strokeWidth="5"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r={radius}
                    fill="none"
                    stroke="var(--success)"
                    strokeWidth="5.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                  />
                </svg>
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>{Math.round(assignmentPercent)}%</span>
                </div>
              </div>

              {/* Data labels */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, fontSize: '0.8rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Hoàn thành:</span>
                  <strong style={{ color: 'var(--success)' }}>{completedAssignments} bài</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Chưa làm:</span>
                  <strong style={{ color: 'var(--text-color)' }}>{pendingAssignments} bài</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Tổng số bài tập:</span>
                  <strong>{totalAssignments} bài</strong>
                </div>
              </div>
            </div>
          )}

          {/* Credits Completion progress bar */}
          <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '0.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
              <span style={{ color: 'var(--text-muted)' }}>Tiến trình hoàn thành tín chỉ:</span>
              <strong>{Math.round(creditPercent)}%</strong>
            </div>
            <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '10px', overflow: 'hidden' }}>
              <div 
                style={{ 
                  height: '100%', 
                  width: `${creditPercent}%`, 
                  background: 'linear-gradient(90deg, var(--secondary), var(--primary))', 
                  borderRadius: '10px', 
                  transition: 'width 0.5s ease-out' 
                }} 
              />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
