import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Compass, 
  Sparkles, 
  Award, 
  Target, 
  BookOpen, 
  ChevronRight, 
  CheckCircle2, 
  Loader2, 
  TrendingUp, 
  Layers, 
  Briefcase, 
  CheckSquare,
  FileText
} from 'lucide-react';

export default function CareerRoadmapSection({ user, onRoadmapGenerated, addToast, API_URL, token }) {
  const [major, setMajor] = useState(user?.major || '');
  const [desiredCareer, setDesiredCareer] = useState(user?.desired_career || '');
  const [languageProficiency, setLanguageProficiency] = useState(user?.language_proficiency || '');
  const [skillsStr, setSkillsStr] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('gap'); // 'gap', 'timeline', 'skills', 'placement'

  // Suggested skills & certs to render action buttons
  const [suggestedSkills, setSuggestedSkills] = useState([]);
  const [suggestedCerts, setSuggestedCerts] = useState([]);

  // Client-side mapping helper for fallbacks
  const getSuggestions = (careerName) => {
    const career = (careerName || '').toLowerCase();
    if (career.includes('front') || career.includes('giao diện')) {
      return {
        skills: ["ReactJS", "TypeScript", "Tailwind CSS", "Git & Version Control", "RESTful API"],
        certs: ["Responsive Web Design (freeCodeCamp)", "Meta Front-End Developer Professional Certificate (Coursera)", "IELTS 6.0+"]
      };
    }
    if (career.includes('back') || career.includes('hệ thống') || career.includes('database')) {
      return {
        skills: ["Node.js / Express", "MySQL & SQL Query", "RESTful API / JWT", "Docker", "Git & GitHub"],
        certs: ["AWS Certified Cloud Practitioner", "Oracle Certified Associate (Java)", "TOEIC 650+"]
      };
    }
    if (career.includes('full') || career.includes('tổng thể') || career.includes('toàn diện')) {
      return {
        skills: ["ReactJS", "Node.js / Express", "MySQL / MongoDB", "RESTful API / JWT", "Git / GitHub"],
        certs: ["Meta Full-Stack Developer Professional Certificate (Coursera)", "AWS Certified Cloud Practitioner", "IELTS 6.0+"]
      };
    }
    if (career.includes('data') || career.includes('dữ liệu') || career.includes('phân tích')) {
      return {
        skills: ["SQL Query & Database", "Power BI / Tableau", "Python (Pandas, NumPy)", "Data Cleaning", "Data Visualization"],
        certs: ["Google Data Analytics Professional Certificate", "Microsoft Certified: Power BI Data Analyst Associate", "IELTS 6.5+"]
      };
    }
    if (career.includes('test') || career.includes('qa') || career.includes('kiểm thử') || career.includes('quality')) {
      return {
        skills: ["Manual Testing & Test Cases", "SQL Query", "Postman / API Testing", "Selenium / Cypress", "Jira & Bug Tracking"],
        certs: ["ISTQB Certified Tester Foundation Level (CTFL)", "Postman API Fundamental Student Badge", "TOEIC 600+"]
      };
    }
    if (career.includes('design') || career.includes('giao diện') || career.includes('ui') || career.includes('ux') || career.includes('thiết kế')) {
      return {
        skills: ["Figma & Prototyping", "UI Design Principles", "UX Research & Personas", "Wireframing & User Flows", "Design Systems"],
        certs: ["Google UX Design Professional Certificate (Coursera)", "Figma Creator Certification", "IELTS 6.0+"]
      };
    }
    if (career.includes('devops') || career.includes('cloud') || career.includes('vận hành') || career.includes('hạ tầng')) {
      return {
        skills: ["Linux Administration", "Docker Containers", "CI/CD (GitHub Actions)", "AWS Services (EC2, S3)", "Python / Bash Scripting"],
        certs: ["AWS Certified Solutions Architect Associate", "HashiCorp Certified: Terraform Associate", "TOEIC 700+"]
      };
    }
    return {
      skills: ["OOP Programming (Java/JS/C++)", "SQL Database", "Git & GitHub", "RESTful API", "Data Structures & Algorithms"],
      certs: ["Oracle Certified Associate (Java)", "Responsive Web Design (freeCodeCamp)", "TOEIC 650+"]
    };
  };

  // Set default form values and load suggestions from user profile on mount
  useEffect(() => {
    if (user) {
      setMajor(user.major || '');
      setDesiredCareer(user.desired_career || '');
      setLanguageProficiency(user.language_proficiency || '');
      
      if (user.desired_career) {
        const suggestions = getSuggestions(user.desired_career);
        setSuggestedSkills(suggestions.skills);
        setSuggestedCerts(suggestions.certs);
      }
    }
  }, [user]);

  const handleGenerateRoadmap = async (e) => {
    e.preventDefault();
    if (!major.trim() || !desiredCareer.trim()) {
      addToast('Vui lòng nhập ngành học và công việc mơ ước.', 'error');
      return;
    }

    setLoading(true);
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };

    try {
      const res = await axios.post(`${API_URL}/api/career/roadmap`, {
        major: major.trim(),
        desired_career: desiredCareer.trim(),
        language_proficiency: languageProficiency.trim(),
        skills: skillsStr.trim()
      }, config);

      addToast('Đã khởi tạo lộ trình sự nghiệp AI thành công!', 'success');
      
      const suggestions = getSuggestions(desiredCareer);
      setSuggestedSkills(res.data.suggestedSkills?.length ? res.data.suggestedSkills : suggestions.skills);
      setSuggestedCerts(res.data.suggestedCerts?.length ? res.data.suggestedCerts : suggestions.certs);
      
      if (onRoadmapGenerated) {
        onRoadmapGenerated();
      }
    } catch (error) {
      console.error('Error generating roadmap:', error);
      addToast('Lỗi khi thiết lập lộ trình AI.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkillToGoals = async (skillName) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    try {
      await axios.post(`${API_URL}/api/skills`, {
        name: skillName,
        proficiency: 1
      }, config);
      
      await axios.post(`${API_URL}/api/goals`, {
        title: `Làm chủ kỹ năng: ${skillName}`,
        progress: 10,
        status: 'in_progress'
      }, config);

      addToast(`Đã thêm "${skillName}" vào danh sách Kỹ năng & Mục tiêu học tập!`, 'success');
      if (onRoadmapGenerated) onRoadmapGenerated();
    } catch (error) {
      console.error('Add skill error:', error);
      addToast('Kỹ năng này đã được thêm từ trước.', 'info');
    }
  };

  const handleAddCertToCertificates = async (certName) => {
    const config = {
      headers: { Authorization: `Bearer ${token}` }
    };
    try {
      await axios.post(`${API_URL}/api/certificates`, {
        name: certName,
        status: 'studying'
      }, config);

      addToast(`Đã thêm "${certName}" vào Kế hoạch chứng chỉ của bạn!`, 'success');
      if (onRoadmapGenerated) onRoadmapGenerated();
    } catch (error) {
      console.error('Add cert error:', error);
      addToast('Chứng chỉ này đã được thêm từ trước.', 'info');
    }
  };

  // Structured parsers for Hướng mới features
  const parseMarkdownSections = (md) => {
    if (!md) return null;

    const sections = {
      gapAnalysis: '',
      timeline: '',
      skillsCerts: '',
      placement: ''
    };

    const gapRegex = /###\s*🔍\s*1\.\s*Phân tích định hướng[^]*?(?=###\s*🗺️\s*2\.\s*Lộ trình|$)/i;
    const timelineRegex = /###\s*🗺️\s*2\.\s*Lộ trình[^]*?(?=###\s*💡\s*3\.\s*Kỹ năng|$)/i;
    const skillsRegex = /###\s*💡\s*3\.\s*Kỹ năng[^]*?(?=###\s*💼\s*4\.\s*Kế hoạch|$)/i;
    const placementRegex = /###\s*💼\s*4\.\s*Kế hoạch[^]*?$/i;

    const gapMatch = md.match(gapRegex);
    const timelineMatch = md.match(timelineRegex);
    const skillsMatch = md.match(skillsRegex);
    const placementMatch = md.match(placementRegex);

    if (gapMatch) sections.gapAnalysis = gapMatch[0].replace(/###\s*🔍\s*1\.\s*Phân tích định hướng[^\n]*/i, '').trim();
    if (timelineMatch) sections.timeline = timelineMatch[0].replace(/###\s*🗺️\s*2\.\s*Lộ trình[^\n]*/i, '').trim();
    if (skillsMatch) sections.skillsCerts = skillsMatch[0].replace(/###\s*💡\s*3\.\s*Kỹ năng[^\n]*/i, '').trim();
    if (placementMatch) sections.placement = placementMatch[0].replace(/###\s*💼\s*4\.\s*Kế hoạch[^\n]*/i, '').trim();

    if (!sections.gapAnalysis && !sections.timeline) {
      const parts = md.split('---');
      if (parts.length >= 4) {
        sections.gapAnalysis = parts[0].trim();
        sections.timeline = parts[1].trim();
        sections.skillsCerts = parts[2].trim();
        sections.placement = parts[3].trim();
      } else {
        sections.gapAnalysis = md;
      }
    }

    return sections;
  };

  const parseTimelinePhases = (timelineText) => {
    if (!timelineText) return [];
    
    const phaseRegex = /####\s*Giai đoạn\s*(\d+):\s*([^\n]+)/gi;
    const phases = [];
    let match;
    const indices = [];

    while ((match = phaseRegex.exec(timelineText)) !== null) {
      indices.push({
        num: match[1],
        title: match[2].trim(),
        index: match.index,
        headerLength: match[0].length
      });
    }

    for (let i = 0; i < indices.length; i++) {
      const start = indices[i].index + indices[i].headerLength;
      const end = (i + 1 < indices.length) ? indices[i+1].index : timelineText.length;
      const content = timelineText.substring(start, end).trim();

      let objective = '';
      let details = [];
      let projects = '';

      const lines = content.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('- **Mục tiêu:**') || trimmed.startsWith('* **Mục tiêu:**')) {
          objective = trimmed.replace(/^[-*]\s*\*\*Mục tiêu:\*\*\s*/i, '');
        } else if (trimmed.startsWith('- **Chi tiết:**') || trimmed.startsWith('* **Chi tiết:**')) {
          const detailStr = trimmed.replace(/^[-*]\s*\*\*Chi tiết:\*\*\s*/i, '');
          details = detailStr.split(',').map(s => s.trim());
        } else if (trimmed.startsWith('- **Dự án:**') || trimmed.startsWith('* **Dự án:**')) {
          projects = trimmed.replace(/^[-*]\s*\*\*Dự án:\*\*\s*/i, '');
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          details.push(trimmed.substring(2));
        }
      });

      phases.push({
        num: indices[i].num,
        title: indices[i].title,
        objective,
        details: details.filter(Boolean),
        projects
      });
    }

    return phases.length > 0 ? phases : null;
  };

  const renderMarkdownText = (mdText) => {
    if (!mdText) return null;
    const lines = mdText.split('\n');
    return lines.map((line, idx) => {
      if (line.startsWith('- ') || line.startsWith('* ')) {
        const boldRegex = /\*\*(.*?)\*\*/g;
        let elements = [];
        let lastIndex = 0;
        let match;
        const content = line.substring(2);

        while ((match = boldRegex.exec(content)) !== null) {
          if (match.index > lastIndex) {
            elements.push(content.substring(lastIndex, match.index));
          }
          elements.push(<strong key={match.index} style={{ color: 'white' }}>{match[1]}</strong>);
          lastIndex = boldRegex.lastIndex;
        }
        if (lastIndex < content.length) {
          elements.push(content.substring(lastIndex));
        }

        return (
          <li key={idx} style={{ marginBottom: '8px', color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
            {elements.length > 0 ? elements : content}
          </li>
        );
      }
      
      const boldRegex = /\*\*(.*?)\*\*/g;
      let elements = [];
      let lastIndex = 0;
      let match;

      while ((match = boldRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          elements.push(line.substring(lastIndex, match.index));
        }
        elements.push(<strong key={match.index} style={{ color: 'white' }}>{match[1]}</strong>);
        lastIndex = boldRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        elements.push(line.substring(lastIndex));
      }

      return (
        <p key={idx} style={{ marginBottom: '12px', color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.6' }}>
          {elements.length > 0 ? elements : line}
        </p>
      );
    });
  };

  const parsedSections = parseMarkdownSections(user?.career_roadmap);
  const phases = parsedSections ? parseTimelinePhases(parsedSections.timeline) : null;

  return (
    <div className="roadmap-container">
      <div className="section-header" style={{ marginBottom: '1.5rem' }}>
        <div className="section-title-wrapper">
          <div className="section-icon">
            <Compass size={24} color="var(--primary)" />
          </div>
          <div>
            <h2 className="section-title" style={{ margin: 0 }}>Cố Vấn Lộ Trình Sự Nghiệp (Hướng Mới)</h2>
            <p className="section-subtitle">Phân tích học lực, gap-analysis và timeline 4 giai đoạn bằng AI</p>
          </div>
        </div>
      </div>

      <div className="roadmap-grid-layout">
        
        {/* Left Settings Panel */}
        <div className="roadmap-setup-card card glass">
          <div className="card-header" style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.1)', paddingBottom: '12px', marginBottom: '16px' }}>
            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', margin: 0 }}>
              <Sparkles size={18} color="var(--accent)" />
              Hồ sơ mục tiêu sự nghiệp
            </h3>
          </div>

          <form onSubmit={handleGenerateRoadmap} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Ngành học hiện tại <span style={{ color: 'var(--accent)' }}>*</span></label>
              <input 
                type="text" 
                className="form-control"
                placeholder="VD: Kỹ thuật phần mềm, Marketing..."
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Công việc mơ ước <span style={{ color: 'var(--accent)' }}>*</span></label>
              <input 
                type="text" 
                className="form-control"
                placeholder="VD: Frontend Developer, Data Analyst..."
                value={desiredCareer}
                onChange={(e) => setDesiredCareer(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Trình độ ngoại ngữ hiện tại</label>
              <input 
                type="text" 
                className="form-control"
                placeholder="VD: TOEIC 600, IELTS 6.5, Chưa có..."
                value={languageProficiency}
                onChange={(e) => setLanguageProficiency(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Kỹ năng đang có (cách nhau bằng dấu phẩy)</label>
              <textarea 
                className="form-control"
                rows="3"
                placeholder="VD: HTML, CSS, Javascript, kỹ năng giao tiếp nhóm..."
                value={skillsStr}
                onChange={(e) => setSkillsStr(e.target.value)}
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  <span>AI Đang Thiết Lập Lộ Trình...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Phân Tích & Tạo Lộ Trình</span>
                </>
              )}
            </button>
          </form>

          {/* Quick additions panel */}
          {(suggestedSkills.length > 0 || suggestedCerts.length > 0) && (
            <div className="suggested-actions-panel" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '12px', color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <TrendingUp size={14} /> Thêm nhanh vào kế hoạch của bạn:
              </h4>
              
              {suggestedSkills.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                    KỸ NĂNG & MỤC TIÊU HỌC TẬP:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {suggestedSkills.slice(0, 4).map((sk, index) => (
                      <button 
                        key={index}
                        onClick={() => handleAddSkillToGoals(sk)}
                        className="quick-action-badge-btn"
                      >
                        <Target size={12} color="var(--primary)" />
                        <span>{sk}</span>
                        <ChevronRight size={12} style={{ marginLeft: 'auto' }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {suggestedCerts.length > 0 && (
                <div>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                    CHỨNG CHỈ NGHỀ NGHIỆP:
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {suggestedCerts.slice(0, 3).map((ct, index) => (
                      <button 
                        key={index}
                        onClick={() => handleAddCertToCertificates(ct)}
                        className="quick-action-badge-btn"
                      >
                        <Award size={12} color="var(--accent)" />
                        <span>{ct}</span>
                        <ChevronRight size={12} style={{ marginLeft: 'auto' }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Dashboard Roadmap Viewer */}
        <div className="roadmap-display-card card glass" style={{ display: 'flex', flexDirection: 'column' }}>
          
          {loading ? (
            <div className="roadmap-loading-state">
              <div className="glowing-spinner">
                <Sparkles size={36} color="var(--primary)" className="pulse" />
              </div>
              <h3>AI đang xử lý học bạ & mục tiêu sự nghiệp...</h3>
              <p>Hệ thống đang đối chiếu các môn học tích lũy của bạn, tính toán GPA và liên kết với các khung kỹ năng chuẩn tuyển dụng của doanh nghiệp.</p>
              
              <div className="loading-steps-list">
                <div className="loading-step active">
                  <CheckCircle2 size={16} /> Quét toàn bộ học bạ tích lũy
                </div>
                <div className="loading-step active">
                  <CheckCircle2 size={16} /> Tính toán GPA & so sánh Gap Analysis
                </div>
                <div className="loading-step">
                  <Loader2 size={16} className="spin" /> Phân mảnh lộ trình 4 giai đoạn chi tiết
                </div>
              </div>
            </div>
          ) : user?.career_roadmap ? (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              
              {/* Summary Metrics Badges */}
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '20px', paddingBottom: '16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <div className="feature-highlight-mini" style={{ background: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
                  <BookOpen size={14} color="var(--primary)" />
                  <span style={{ fontSize: '0.82rem' }}>Ngành: <strong>{user.major}</strong></span>
                </div>
                <div className="feature-highlight-mini" style={{ background: 'rgba(6, 182, 212, 0.1)', borderColor: 'rgba(6, 182, 212, 0.2)' }}>
                  <Compass size={14} color="var(--secondary)" />
                  <span style={{ fontSize: '0.82rem' }}>Định hướng: <strong>{user.desired_career}</strong></span>
                </div>
                {user.language_proficiency && (
                  <div className="feature-highlight-mini" style={{ background: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.2)' }}>
                    <Award size={14} color="var(--accent)" />
                    <span style={{ fontSize: '0.82rem' }}>Ngoại ngữ: <strong>{user.language_proficiency}</strong></span>
                  </div>
                )}
              </div>

              {/* Dynamic Tabs Navigation Bar */}
              <div className="schedule-view-selector" style={{ marginBottom: '20px', width: '100%' }}>
                <button 
                  className={`schedule-view-btn ${activeTab === 'gap' ? 'active' : ''}`}
                  onClick={() => setActiveTab('gap')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}
                >
                  <Layers size={14} />
                  <span>Gap Analysis</span>
                </button>
                <button 
                  className={`schedule-view-btn ${activeTab === 'timeline' ? 'active' : ''}`}
                  onClick={() => setActiveTab('timeline')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}
                >
                  <Compass size={14} />
                  <span>Lộ trình chi tiết</span>
                </button>
                <button 
                  className={`schedule-view-btn ${activeTab === 'skills' ? 'active' : ''}`}
                  onClick={() => setActiveTab('skills')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}
                >
                  <Target size={14} />
                  <span>Kỹ năng & Chứng chỉ</span>
                </button>
                <button 
                  className={`schedule-view-btn ${activeTab === 'placement' ? 'active' : ''}`}
                  onClick={() => setActiveTab('placement')}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1, justifyContent: 'center' }}
                >
                  <Briefcase size={14} />
                  <span>Hướng dẫn thực tập</span>
                </button>
              </div>

              {/* Tab Content Display */}
              <div className="roadmap-tab-content animate-fade-in" style={{ flex: 1, overflowY: 'auto' }}>
                
                {/* 1. GAP ANALYSIS TAB */}
                {activeTab === 'gap' && (
                  <div className="gap-analysis-panel">
                    <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '20px' }}>
                      <h4 style={{ color: 'white', marginBottom: '12px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileText size={16} color="var(--primary)" />
                        Đánh giá khoảng cách năng lực chuyên môn
                      </h4>
                      {renderMarkdownText(parsedSections.gapAnalysis)}
                    </div>
                  </div>
                )}

                {/* 2. TIMELINE 4 STAGES TAB */}
                {activeTab === 'timeline' && (
                  <div className="timeline-phases-tree">
                    {phases ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', position: 'relative', paddingLeft: '20px' }}>
                        {/* Connecting Line */}
                        <div style={{ position: 'absolute', left: '7px', top: '24px', bottom: '24px', width: '2px', background: 'linear-gradient(to bottom, var(--primary), var(--accent), var(--secondary))' }}></div>
                        
                        {phases.map((phase, idx) => (
                          <div key={idx} style={{ position: 'relative' }}>
                            {/* Bullet indicator */}
                            <div style={{ position: 'absolute', left: '-20px', top: '4px', width: '16px', height: '16px', borderRadius: '50%', background: 'var(--bg-main)', border: `3px solid ${idx % 2 === 0 ? 'var(--primary)' : 'var(--accent)'}`, display: 'flex', alignItems: 'center', justifyItems: 'center', zIndex: 10 }}></div>
                            
                            <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                              <span style={{ fontSize: '0.72rem', textTransform: 'uppercase', color: idx % 2 === 0 ? 'var(--primary)' : 'var(--accent)', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                                Giai Đoạn {phase.num}
                              </span>
                              <h4 style={{ color: 'white', marginBottom: '12px', fontSize: '1.05rem' }}>{phase.title}</h4>
                              
                              {phase.objective && (
                                <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '10px 14px', borderRadius: '8px', borderLeft: '3px solid var(--secondary)', fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                                  🎯 <strong>Mục tiêu:</strong> {phase.objective}
                                </div>
                              )}

                              {phase.details?.length > 0 && (
                                <div style={{ marginBottom: '12px' }}>
                                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>KIẾN THỨC CẦN NẮM VỮNG:</span>
                                  <ul style={{ margin: 0, paddingLeft: '16px' }}>
                                    {phase.details.map((d, dIdx) => (
                                      <li key={dIdx} style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>{d}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {phase.projects && (
                                <div style={{ background: 'rgba(99, 102, 241, 0.05)', padding: '10px 14px', borderRadius: '8px', border: '1px dashed rgba(99, 102, 241, 0.3)', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                                  🚀 <strong>Dự án Portfolio:</strong> {phase.projects}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="legacy-renderer">
                        {renderMarkdownText(parsedSections.timeline)}
                      </div>
                    )}
                  </div>
                )}

                {/* 3. SUGGESTED SKILLS & CERTS TAB */}
                {activeTab === 'skills' && (
                  <div className="skills-certs-panel">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                        <h4 style={{ color: 'white', marginBottom: '16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Target size={16} color="var(--primary)" />
                          Kỹ năng cần tập trung
                        </h4>
                        
                        {suggestedSkills.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {suggestedSkills.map((sk, index) => (
                              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                <span style={{ fontSize: '0.88rem', fontWeight: 500 }}>{sk}</span>
                                <button 
                                  onClick={() => handleAddSkillToGoals(sk)}
                                  className="btn btn-secondary" 
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto' }}
                                >
                                  + Thêm
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Chưa có kỹ năng đề xuất nào.</p>
                        )}
                      </div>

                      <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                        <h4 style={{ color: 'white', marginBottom: '16px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Award size={16} color="var(--accent)" />
                          Chứng chỉ học thuật
                        </h4>

                        {suggestedCerts.length > 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {suggestedCerts.map((ct, index) => (
                              <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255, 255, 255, 0.02)', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                <span style={{ fontSize: '0.88rem', fontWeight: 500, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '160px' }}>{ct}</span>
                                <button 
                                  onClick={() => handleAddCertToCertificates(ct)}
                                  className="btn btn-secondary" 
                                  style={{ padding: '4px 8px', fontSize: '0.75rem', width: 'auto' }}
                                >
                                  + Thêm
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Chưa có chứng chỉ đề xuất nào.</p>
                        )}
                      </div>
                    </div>

                    <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px' }}>
                      <h4 style={{ color: 'white', marginBottom: '12px', fontSize: '1rem' }}>Mô tả chi tiết từ chuyên gia AI</h4>
                      {renderMarkdownText(parsedSections.skillsCerts)}
                    </div>
                  </div>
                )}

                {/* 4. PLACEMENT & INTERNSHIP TAB */}
                {activeTab === 'placement' && (
                  <div className="placement-guide-panel">
                    <div style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-color)', borderRadius: '12px', marginBottom: '20px' }}>
                      <h4 style={{ color: 'white', marginBottom: '12px', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Briefcase size={16} color="var(--secondary)" />
                        Kế hoạch tuyển dụng & Săn việc thực tập
                      </h4>
                      {renderMarkdownText(parsedSections.placement)}
                    </div>
                  </div>
                )}

              </div>
            </div>
          ) : (
            <div className="roadmap-empty-state" style={{ margin: 'auto' }}>
              <div className="empty-icon-wrapper">
                <Compass size={48} color="rgba(255, 255, 255, 0.2)" />
              </div>
              <h3>Khởi Tạo Lộ Trình Sự Nghiệp AI</h3>
              <p>Điền thông tin mục tiêu nghề nghiệp ở cột bên trái. AI Career Advisor sẽ phân tích kết quả học tập thực tế của bạn để thiết kế timeline, định hình kỹ năng, và đề xuất lộ trình hành động chi tiết.</p>
              
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '16px' }}>
                <div className="feature-highlight-mini">
                  <Sparkles size={16} color="var(--primary)" />
                  <span>Phân tích Gap Analysis</span>
                </div>
                <div className="feature-highlight-mini">
                  <BookOpen size={16} color="var(--primary)" />
                  <span>4 Giai đoạn Timeline</span>
                </div>
                <div className="feature-highlight-mini">
                  <Award size={16} color="var(--primary)" />
                  <span>Đề xuất Kỹ năng & Chứng chỉ</span>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
