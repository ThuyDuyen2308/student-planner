const DB_NAME = process.env.DB_NAME || 'student_planner';

/**
 * Generates local template career roadmap based on user inputs
 */
function getLocalRoadmap(desired_career, major, skills, language_proficiency, gpa, subjectsStr) {
  const career = (desired_career || '').toLowerCase();
  
  let careerTitle = "Chuyên viên Công nghệ thông tin";
  let analysis = "";
  let roadmap = "";
  let suggestedSkills = [];
  let suggestedCerts = [];
  let internshipPlan = "";

  if (career.includes('front') || career.includes('giao diện')) {
    careerTitle = "Frontend Developer";
    analysis = `Ngành học **${major || 'Công nghệ thông tin'}** của bạn rất phù hợp để phát triển thành **Frontend Developer**. GPA hiện tại là **${gpa || 'N/A'}** cho thấy bạn có nền tảng học thuật ổn định.
Các kỹ năng hiện tại: *${skills || 'Chưa cập nhật'}*.
Để trở thành Frontend Developer chuyên nghiệp, khoảng cách lớn nhất của bạn là kiến thức về các Framework hiện đại (React, Vue, Angular) và kỹ năng thiết kế giao diện UI/UX tối ưu.`;
    roadmap = `
#### Giai đoạn 1: Nền tảng HTML, CSS & Javascript chuyên sâu (Tháng 1-3)
- **Mục tiêu:** Nắm vững cấu trúc web và tư duy lập trình giao diện.
- **Chi tiết:** Học sâu về CSS Grid, Flexbox, Responsive Design, và ES6+ Javascript (DOM, Async/Await, Fetch API).
- **Dự án:** Xây dựng 2-3 giao diện clone (như Spotify, Netflix) sử dụng HTML/CSS/JS thuần.

#### Giai đoạn 2: Framework React & Quản lý State (Tháng 4-6)
- **Mục tiêu:** Xây dựng Single Page Application (SPA) phức tạp.
- **Chi tiết:** Học React, React Hooks, Redux Toolkit hoặc Context API. Tích hợp Axios gọi API.
- **Dự án:** Xây dựng ứng dụng quản lý công việc (Student Planner) hoặc ứng dụng bán hàng.

#### Giai đoạn 3: Công cụ nâng cao & Tối ưu hiệu năng (Tháng 7-9)
- **Mục tiêu:** Chuẩn bị kỹ năng làm việc trong dự án thực tế.
- **Chi tiết:** Học TypeScript, Git/GitHub, các UI thư viện (Tailwind CSS, Material UI) và tối ưu Lighthouse score.
- **Dự án:** Chuyển đổi dự án ở Giai đoạn 2 sang TypeScript và tối ưu SEO.

#### Giai đoạn 4: Chuẩn bị CV & Thực tập (Tháng 10-12)
- **Mục tiêu:** Tìm kiếm cơ hội thực tập Frontend Developer.
- **Chi tiết:** Viết CV lập trình, tạo trang Portfolio cá nhân host trên GitHub Pages, luyện thuật toán cơ bản.`;
    suggestedSkills = ["ReactJS", "TypeScript", "Tailwind CSS", "Git & Version Control", "RESTful API"];
    suggestedCerts = ["Responsive Web Design (freeCodeCamp)", "Meta Front-End Developer Professional Certificate (Coursera)", "IELTS 6.0+"];
    internshipPlan = `
- **Chuẩn bị Portfolio:** Đưa ít nhất 3 dự án tốt nhất lên GitHub kèm mô tả chi tiết (README).
- **Vị trí ứng tuyển:** Thực tập sinh Frontend (Frontend Intern), Cộng tác viên phát triển Web.
- **Các bước ứng tuyển:** Tiếp cận các công ty Outsource, Startup công nghệ vừa và nhỏ để tích lũy kinh nghiệm thực tế nhanh nhất.`;
  } else if (career.includes('back') || career.includes('hệ thống') || career.includes('database')) {
    careerTitle = "Backend Developer";
    analysis = `Định hướng **Backend Developer** cực kỳ phù hợp với nền tảng tư duy logic của ngành **${major || 'Công nghệ thông tin'}**. GPA hiện tại: **${gpa || 'N/A'}**.
Kỹ năng hiện tại: *${skills || 'Chưa cập nhật'}*.
Để đi theo Backend, bạn cần bổ sung tư duy thiết kế cơ sở dữ liệu quan hệ/phi quan hệ, viết API chuẩn RESTful, và hiểu biết về bảo mật hệ thống.`;
    roadmap = `
#### Giai đoạn 1: Ngôn ngữ Backend & Tư duy hướng đối tượng (Tháng 1-3)
- **Mục tiêu:** Làm chủ một ngôn ngữ backend (Node.js/Express, Java Spring Boot, hoặc Python Django).
- **Chi tiết:** Học sâu về lập trình hướng đối tượng (OOP), cấu trúc dữ liệu và giải thuật.
- **Dự án:** Xây dựng ứng dụng CLI và các công cụ tự động hóa cơ bản.

#### Giai đoạn 2: Thiết kế Database & RESTful API (Tháng 4-6)
- **Mục tiêu:** Xây dựng hệ thống lưu trữ dữ liệu và viết API.
- **Chi tiết:** Học SQL (MySQL/PostgreSQL), NoSQL (MongoDB), thiết kế chuẩn hóa database, viết API RESTful bảo mật với JWT.
- **Dự án:** Xây dựng hệ thống Backend cho một trang E-commerce hoặc Blog cá nhân.

#### Giai đoạn 3: Caching, Docker & Kiểm thử (Tháng 7-9)
- **Mục tiêu:** Nâng cao hiệu năng và chuẩn hóa quy trình triển khai.
- **Chi tiết:** Học Redis Caching, Docker containerization, viết Unit Tests (Jest, JUnit) và kiến thức cơ bản về Git.
- **Dự án:** Dockerize dự án E-commerce, tích hợp Redis để cache kết quả truy vấn nặng.

#### Giai đoạn 4: Hệ thống phân tán & Thực tập (Tháng 10-12)
- **Mục tiêu:** Ứng tuyển vị trí Backend Intern.
- **Chi tiết:** Học cơ bản về Cloud (AWS/Google Cloud), CI/CD, chuẩn bị CV tập trung vào thiết kế hệ thống và database.`;
    suggestedSkills = ["Node.js / Express", "MySQL & SQL Query", "RESTful API / JWT", "Docker", "Git & GitHub"];
    suggestedCerts = ["AWS Certified Cloud Practitioner", "Oracle Certified Associate (Java)", "TOEIC 650+"];
    internshipPlan = `
- **Chuẩn bị Portfolio:** Đăng tải các source code backend lên GitHub kèm sơ đồ thiết kế cơ sở dữ liệu (Database Schema).
- **Vị trí ứng tuyển:** Backend Intern, Java/Node.js Intern.
- **Các bước ứng tuyển:** Tìm kiếm các doanh nghiệp Product hoặc Outsource đang tuyển dụng TTS, chuẩn bị tốt kỹ năng phỏng vấn về SQL và OOP.`;
  } else if (career.includes('full') || career.includes('tổng thể') || career.includes('toàn diện')) {
    careerTitle = "Full Stack Developer";
    analysis = `Trở thành **Full Stack Developer** là mục tiêu đầy thử thách nhưng cực kỳ triển vọng cho ngành học **${major || 'Công nghệ thông tin'}**. GPA hiện tại: **${gpa || 'N/A'}**.
Kỹ năng hiện tại: *${skills || 'Chưa cập nhật'}*.
Lộ trình này yêu cầu bạn cân bằng cả kỹ năng giao diện (Frontend) lẫn xử lý logic hệ thống và cơ sở dữ liệu (Backend).`;
    roadmap = `
#### Giai đoạn 1: Nền tảng Frontend vững chắc (Tháng 1-3)
- **Mục tiêu:** Thiết kế giao diện web hoàn chỉnh.
- **Chi tiết:** Học HTML5, CSS3 (Tailwind CSS) và JavaScript cơ bản đến nâng cao.
- **Dự án:** Tạo trang web cá nhân giới thiệu bản thân (Portfolio) có responsive đầy đủ.

#### Giai đoạn 2: Lập trình Node.js Backend & Database (Tháng 4-6)
- **Mục tiêu:** Viết các server-side logic và quản lý database.
- **Chi tiết:** Học Node.js, Express.js và cơ sở dữ liệu quan hệ MySQL hoặc PostgreSQL.
- **Dự án:** Xây dựng hệ thống quản lý sinh viên có chức năng đăng nhập, phân quyền.

#### Giai đoạn 3: Tích hợp Frontend React & API (Tháng 7-9)
- **Mục tiêu:** Kết nối giao diện ReactJS với Backend API vừa xây dựng.
- **Chi tiết:** Học ReactJS, quản lý State, kết nối Axios. Học thêm Git/GitHub để quản lý source code.
- **Dự án:** Kết hợp dự án Giai đoạn 1 và 2 thành một ứng dụng Fullstack hoàn chỉnh (MERN stack hoặc Node-React).

#### Giai đoạn 4: Deploy & Thực tập (Tháng 10-12)
- **Mục tiêu:** Triển khai sản phẩm lên Internet và tìm việc thực tập.
- **Chi tiết:** Học cách deploy frontend lên Vercel/Netlify, backend lên Render/VPS, chuẩn bị hồ sơ ứng tuyển.`;
    suggestedSkills = ["ReactJS", "Node.js / Express", "MySQL / MongoDB", "RESTful API / JWT", "Git / GitHub"];
    suggestedCerts = ["Meta Full-Stack Developer Professional Certificate (Coursera)", "AWS Certified Cloud Practitioner", "IELTS 6.0+"];
    internshipPlan = `
- **Chuẩn bị Portfolio:** Host trực tiếp sản phẩm Fullstack của bạn lên mạng để nhà tuyển dụng dễ dàng dùng thử.
- **Vị trí ứng tuyển:** Full Stack Intern, Software Engineer Intern.
- **Các bước ứng tuyển:** Ưu tiên các startup công nghệ năng động nơi bạn có thể tham gia vào cả Frontend và Backend, giúp tích lũy kinh nghiệm nhanh chóng.`;
  } else if (career.includes('data') || career.includes('dữ liệu') || career.includes('phân tích')) {
    careerTitle = "Data Analyst / Data Scientist";
    analysis = `Định hướng **Phân tích dữ liệu (Data Analyst)** đang rất khát nhân lực và phù hợp với sinh viên chuyên ngành **${major || 'Công nghệ thông tin'}** thích làm việc với con số và thống kê. GPA: **${gpa || 'N/A'}**.
Kỹ năng hiện tại: *${skills || 'Chưa cập nhật'}*.
Để đi theo hướng này, bạn cần trang bị kỹ năng viết truy vấn SQL nâng cao, sử dụng các công cụ trực quan hóa (Power BI, Tableau) và lập trình Python phân tích dữ liệu.`;
    roadmap = `
#### Giai đoạn 1: SQL nâng cao & Xử lý dữ liệu (Tháng 1-3)
- **Mục tiêu:** Lấy và làm sạch dữ liệu từ database.
- **Chi tiết:** Học SQL nâng cao (Join, Subquery, Window Functions), hiểu về cấu trúc Data Warehouse.
- **Dự án:** Truy vấn và làm sạch bộ dữ liệu công cộng (ví dụ: dữ liệu bán hàng, dịch bệnh) trên Kaggle.

#### Giai đoạn 2: Trực quan hóa dữ liệu (Tableau/Power BI) (Tháng 4-6)
- **Mục tiêu:** Kể chuyện bằng dữ liệu thông qua Dashboard.
- **Chi tiết:** Học Power BI hoặc Tableau, thiết kế Data Model, viết công thức DAX, xây dựng báo cáo trực quan.
- **Dự án:** Xây dựng Dashboard báo cáo doanh thu kinh doanh hoặc tiến độ học tập của trường học.

#### Giai đoạn 3: Lập trình Python Phân tích dữ liệu (Tháng 7-9)
- **Mục tiêu:** Sử dụng code để phân tích thống kê và tự động hóa.
- **Chi tiết:** Học lập trình Python cơ bản, các thư viện Pandas, NumPy để biến đổi dữ liệu, và Matplotlib/Seaborn để vẽ biểu đồ.
- **Dự án:** Viết script Python phân tích hành vi khách hàng từ file log CSV và vẽ biểu đồ xu hướng.

#### Giai đoạn 4: Tư duy phân tích kinh doanh & Thực tập (Tháng 10-12)
- **Mục tiêu:** Thực tập phân tích dữ liệu.
- **Chi tiết:** Học kỹ năng thuyết trình, kỹ năng Business Analysis (BA) cơ bản, chuẩn bị CV dạng portfolio dashboard.`;
    suggestedSkills = ["SQL Query & Database", "Power BI / Tableau", "Python (Pandas, NumPy)", "Data Cleaning", "Data Visualization"];
    suggestedCerts = ["Google Data Analytics Professional Certificate", "Microsoft Certified: Power BI Data Analyst Associate", "IELTS 6.5+"];
    internshipPlan = `
- **Chuẩn bị Portfolio:** Tạo một trang web portfolio cá nhân hoặc bài đăng trên GitHub/NovyPro giới thiệu các dashboard Power BI tương tác.
- **Vị trí ứng tuyển:** Data Analyst Intern, Business Analyst Intern.
- **Các bước ứng tuyển:** Tiếp cận các công ty thương mại điện tử, tập đoàn bán lẻ, ngân hàng hoặc agency quảng cáo nơi có lượng dữ liệu lớn cần phân tích.`;
  } else if (career.includes('test') || career.includes('qa') || career.includes('kiểm thử') || career.includes('quality')) {
    careerTitle = "Software Tester / QA Engineer";
    analysis = `Vị trí **Kiểm thử phần mềm (Tester/QA)** cực kỳ quan trọng trong quy trình phát triển phần mềm, phù hợp với sự cẩn thận và tư duy hệ thống của ngành **${major || 'Công nghệ thông tin'}**. GPA: **${gpa || 'N/A'}**.
Kỹ năng hiện tại: *${skills || 'Chưa cập nhật'}*.
Bạn cần nắm chắc quy trình kiểm thử phần mềm (Manual Test), cách viết test case và định hướng học thêm Automation Test để tăng tính cạnh tranh.`;
    roadmap = `
#### Giai đoạn 1: Kiến thức cơ bản về Kiểm thử (Manual Test) (Tháng 1-3)
- **Mục tiêu:** Nắm vững quy trình kiểm thử và cách tìm lỗi.
- **Chi tiết:** Tìm hiểu vòng đời phần mềm (SDLC, STLC), các mức độ và loại kiểm thử. Viết Test Case, Bug Report bằng Excel/Jira.
- **Dự án:** Viết Test Case và thực hiện kiểm thử giao diện cho một trang web bán hàng hoặc ứng dụng di động.

#### Giai đoạn 2: Cơ sở dữ liệu & Kiểm thử API (Tháng 4-6)
- **Mục tiêu:** Kiểm thử dữ liệu và API hệ thống.
- **Chi tiết:** Học SQL truy vấn cơ bản để đối chiếu dữ liệu trong DB. Sử dụng công cụ Postman để gửi request kiểm thử API.
- **Dự án:** Viết bộ test API cho hệ thống đăng nhập, giỏ hàng sử dụng Postman Collection.

#### Giai đoạn 3: Nền tảng Automation Test cơ bản (Tháng 7-9)
- **Mục tiêu:** Viết script kiểm thử tự động.
- **Chi tiết:** Học lập trình Java hoặc Python cơ bản. Tìm hiểu công cụ Selenium WebDriver hoặc Cypress để tự động hóa kiểm thử giao diện.
- **Dự án:** Viết script tự động điền form đăng ký, đăng nhập và kiểm tra kết quả hiển thị bằng Selenium.

#### Giai đoạn 4: Chuẩn bị chứng chỉ & Thực tập (Tháng 10-12)
- **Mục tiêu:** Ứng tuyển vị trí Tester Intern.
- **Chi tiết:** Ôn thi chứng chỉ ISTQB Foundation, hoàn thiện CV ghi rõ các loại kiểm thử đã thực hành.`;
    suggestedSkills = ["Manual Testing & Test Cases", "SQL Query", "Postman / API Testing", "Selenium / Cypress", "Jira & Bug Tracking"];
    suggestedCerts = ["ISTQB Certified Tester Foundation Level (CTFL)", "Postman API Fundamental Student Badge", "TOEIC 600+"];
    internshipPlan = `
- **Chuẩn bị Portfolio:** Đưa các Test Case Excel, Bug Report mẫu và Selenium script lên GitHub.
- **Vị trí ứng tuyển:** Manual Tester Intern, QA Intern, Automation Tester Trainee.
- **Các bước ứng tuyển:** Đăng ký thi thử ISTQB để lấy kiến thức nền tảng, nộp hồ sơ vào các công ty Outsource lớn (như FPT Software, TMA, NashTech) vốn tuyển dụng Tester liên tục.`;
  } else if (career.includes('design') || career.includes('giao diện') || career.includes('ui') || career.includes('ux') || career.includes('thiết kế')) {
    careerTitle = "UI/UX Designer";
    analysis = `Định hướng **UI/UX Designer** đòi hỏi sự kết hợp giữa tư duy kỹ thuật từ ngành **${major || 'Công nghệ thông tin'}** và gu thẩm mỹ tốt. GPA: **${gpa || 'N/A'}**.
Kỹ năng hiện tại: *${skills || 'Chưa cập nhật'}*.
Để phát triển nghề này, bạn cần sử dụng thành thạo Figma, học sâu về tâm lý học người dùng (UX) và các nguyên lý thiết kế đồ họa (UI).`;
    roadmap = `
#### Giai đoạn 1: Nguyên lý thiết kế & Làm quen Figma (Tháng 1-3)
- **Mục tiêu:** Sử dụng thành thạo công cụ thiết kế.
- **Chi tiết:** Học Figma cơ bản (Auto Layout, Component, Variant). Tìm hiểu về màu sắc, typography, khoảng trắng (white space) trong UI.
- **Dự án:** Thiết kế lại (Redesign) giao diện màn hình Mobile của 1 ứng dụng phổ biến (như Grab, Shopee).

#### Giai đoạn 2: Nghiên cứu trải nghiệm người dùng (UX Research) (Tháng 4-6)
- **Mục tiêu:** Thiết kế dựa trên nghiên cứu người dùng thực tế.
- **Chi tiết:** Tìm hiểu phương pháp nghiên cứu (User Interview, Survey), xây dựng Persona, lập sơ đồ hành trình (User Journey Map), vẽ khung dây (Wireframe).
- **Dự án:** Thực hiện nghiên cứu và thiết kế giải pháp UX cho một vấn đề cụ thể của sinh viên (ví dụ: đăng ký môn học).

#### Giai đoạn 3: Thiết kế UI chi tiết & Prototype tương tác (Tháng 7-9)
- **Mục tiêu:** Tạo giao diện đẹp mắt và có hiệu ứng chuyển động chân thực.
- **Chi tiết:** Thiết kế UI hoàn chỉnh (High-fidelity UI), thiết kế Design System cơ bản, tạo Prototype tương tác (Smart Animate trong Figma).
- **Dự án:** Hoàn thiện bộ thiết kế đầy đủ (gồm nghiên cứu, wireframe, UI, prototype) cho ứng dụng học tập trực tuyến.

#### Giai đoạn 4: Behance Portfolio & Thực tập UI/UX (Tháng 10-12)
- **Mục tiêu:** Ứng tuyển UI/UX Intern.
- **Chi tiết:** Đăng tải các dự án thiết kế (Case Study) lên Behance hoặc Dribbble, chuẩn bị CV thiết kế chuyên nghiệp.`;
    suggestedSkills = ["Figma & Prototyping", "UI Design Principles", "UX Research & Personas", "Wireframing & User Flows", "Design Systems"];
    suggestedCerts = ["Google UX Design Professional Certificate (Coursera)", "Figma Creator Certification", "IELTS 6.0+"];
    internshipPlan = `
- **Chuẩn bị Portfolio:** Đây là yếu tố quan trọng nhất. Phải có ít nhất 2 Case Study chi tiết trên Behance/Dribbble trình bày từ bước nghiên cứu đến giao diện cuối cùng.
- **Vị trí ứng tuyển:** UI/UX Design Intern, Product Design Intern.
- **Các bước ứng tuyển:** Tiếp cận các Product Company hoặc Agency thiết kế, chuẩn bị tinh thần làm test bài tập thực tế khi phỏng vấn.`;
  } else if (career.includes('devops') || career.includes('cloud') || career.includes('vận hành') || career.includes('hạ tầng')) {
    careerTitle = "DevOps / Cloud Engineer";
    analysis = `Định hướng **DevOps / Cloud Engineer** đang cực kỳ thịnh hành và có mức thu nhập cao, rất phù hợp cho sinh viên chuyên ngành **${major || 'Công nghệ thông tin'}** yêu thích hạ tầng, mạng máy tính và tự động hóa. GPA: **${gpa || 'N/A'}**.
Kỹ năng hiện tại: *${skills || 'Chưa cập nhật'}*.
Lộ trình này yêu cầu bạn hiểu sâu về Linux, container (Docker), tự động hóa CI/CD, và quản lý hạ tầng trên các nền tảng điện toán đám mây.`;
    roadmap = `
#### Giai đoạn 1: Hệ điều hành Linux & Lập trình Script (Tháng 1-3)
- **Mục tiêu:** Làm chủ môi trường server.
- **Chi tiết:** Học Linux Administration cơ bản (quản lý file, user, network). Lập trình script với Bash hoặc Python để tự động hóa tác vụ.
- **Dự án:** Viết Bash script tự động backup thư mục dữ liệu và gửi thông báo qua Discord/Telegram khi hoàn thành.

#### Giai đoạn 2: Mạng máy tính & Docker Container (Tháng 4-6)
- **Mục tiêu:** Đóng gói ứng dụng vào container.
- **Chi tiết:** Nắm chắc kiến thức mạng máy tính (DNS, HTTP/S, SSL, Load Balancer). Học cách đóng gói ứng dụng bằng Docker (Dockerfile, Docker Compose).
- **Dự án:** Dockerize một ứng dụng Fullstack (React-Node-MySQL), thiết lập cấu hình network và volumes để lưu trữ dữ liệu.

#### Giai đoạn 3: CI/CD Pipeline & Cloud (AWS) (Tháng 7-9)
- **Mục tiêu:** Tự động hóa quy trình deploy ứng dụng lên đám mây.
- **Chi tiết:** Xây dựng luồng CI/CD với GitHub Actions hoặc GitLab CI. Học dịch vụ đám mây AWS cơ bản (EC2, S3, RDS, VPC).
- **Dự án:** Thiết lập pipeline GitHub Actions tự động kiểm tra code (lint, test) và deploy ứng dụng lên AWS EC2 khi có commit mới.

#### Giai đoạn 4: Infrastructure as Code (IaC) & Thực tập (Tháng 10-12)
- **Mục tiêu:** Ứng tuyển vị trí DevOps Intern.
- **Chi tiết:** Tìm hiểu cơ bản về Terraform hoặc Ansible để quản lý hạ tầng bằng code, chuẩn bị thi chứng chỉ AWS Cloud.`;
    suggestedSkills = ["Linux Administration", "Docker Containers", "CI/CD (GitHub Actions)", "AWS Services (EC2, S3)", "Python / Bash Scripting"];
    suggestedCerts = ["AWS Certified Solutions Architect Associate", "HashiCorp Certified: Terraform Associate", "TOEIC 700+"];
    internshipPlan = `
- **Chuẩn bị Portfolio:** Lưu trữ toàn bộ Dockerfiles, Docker Compose và luồng CI/CD YAML lên GitHub.
- **Vị trí ứng tuyển:** DevOps Intern, Cloud Engineer Intern, System Engineer Intern.
- **Các bước ứng tuyển:** Tập trung vào các công ty công nghệ lớn, công ty fintech hoặc công ty viễn thông có hệ thống máy chủ lớn cần vận hành tự động.`;
  } else {
    careerTitle = "Software Developer";
    analysis = `Định hướng **Software Developer** là sự phát triển tự nhiên và vững chắc đối với sinh viên chuyên ngành **${major || 'Công nghệ thông tin'}**. GPA học tập hiện tại: **${gpa || 'N/A'}**.
Kỹ năng hiện có: *${skills || 'Chưa cập nhật'}*.
Báo cáo này đề xuất lộ trình giúp bạn định hình tốt kỹ năng lập trình cốt lõi, tư duy giải quyết vấn đề và chuẩn bị bước vào thị trường việc làm lập trình viên.`;
    roadmap = `
#### Giai đoạn 1: Tư duy lập trình & Cấu trúc dữ liệu (Tháng 1-3)
- **Mục tiêu:** Nắm vững nền tảng lập trình cơ bản.
- **Chi tiết:** Học chắc một ngôn ngữ lập trình phổ biến (C++, Java, Python hoặc JavaScript), hiểu rõ cấu trúc dữ liệu cơ bản (Array, List, Map) và thuật toán.
- **Dự án:** Giải quyết 50-100 bài tập lập trình trên các nền tảng như LeetCode, HackerRank.

#### Giai đoạn 2: Lập trình Web/Mobile cơ bản & Database (Tháng 4-6)
- **Mục tiêu:** Hiểu cách xây dựng phần mềm có giao diện và database.
- **Chi tiết:** Học thiết kế giao diện HTML/CSS cơ bản và ngôn ngữ cơ sở dữ liệu SQL (MySQL/PostgreSQL).
- **Dự án:** Xây dựng ứng dụng quản lý sách hoặc danh bạ có kết nối cơ sở dữ liệu.

#### Giai đoạn 3: Phát triển ứng dụng hoàn chỉnh & Công cụ (Tháng 7-9)
- **Mục tiêu:** Sử dụng các công cụ quản lý dự án tiêu chuẩn.
- **Chi tiết:** Học sử dụng Git/GitHub để quản lý mã nguồn, tìm hiểu quy trình Scrum/Agile và thiết kế API RESTful.
- **Dự án:** Xây dựng một ứng dụng nhóm nhỏ (ví dụ: web học trực tuyến hoặc ứng dụng chat đơn giản).

#### Giai đoạn 4: Chuẩn bị CV & Thực tập (Tháng 10-12)
- **Mục tiêu:** Ứng tuyển Software Developer Intern.
- **Chi tiết:** Tạo Portfolio giới thiệu dự án, luyện tập kỹ năng phỏng vấn kỹ thuật và thuật toán.`;
    suggestedSkills = ["OOP Programming (Java/JS/C++)", "SQL Database", "Git & GitHub", "RESTful API", "Data Structures & Algorithms"];
    suggestedCerts = ["Oracle Certified Associate (Java)", "Responsive Web Design (freeCodeCamp)", "TOEIC 650+"];
    internshipPlan = `
- **Chuẩn bị Portfolio:** Đưa các dự án học tập lên GitHub có viết file README mô tả sản phẩm và cách cài đặt chạy thử.
- **Vị trí ứng tuyển:** Software Engineer Intern, Developer Intern, Lập trình viên tập sự.
- **Các bước ứng tuyển:** Tham gia các ngày hội việc làm (Job Fair), gửi CV ứng tuyển đến các trung tâm đào tạo hoặc doanh nghiệp phần mềm quy mô vừa.`;
  }

  const markdown = `## 📊 Báo Cáo Tư Vấn Lộ Trình Phát Triển Sự Nghiệp: ${careerTitle}

### 🔍 1. Phân tích định hướng & Khoảng cách kỹ năng (Gap Analysis)
${analysis}

---

### 🗺️ 2. Lộ trình phát triển chi tiết (Roadmap Timeline)
${roadmap}

---

### 💡 3. Kỹ năng & Chứng chỉ học thuật đề xuất
#### Kỹ năng đề xuất rèn luyện:
${suggestedSkills.map(sk => `- **${sk}**: Cần trang bị để phục vụ yêu cầu tuyển dụng.`).join('\n')}

#### Chứng chỉ đề xuất đạt được:
${suggestedCerts.map(ct => `- **${ct}**: Chứng chỉ khuyên học để làm đẹp CV.`).join('\n')}

---

### 💼 4. Kế hoạch chuẩn bị thực tập & Tìm việc (Placement Guide)
${internshipPlan}

*(Lưu ý: Đây là bản phân tích lộ trình dự phòng cục bộ được tối ưu hóa dựa trên ngành học và định hướng nghề nghiệp của bạn. Hãy thiết lập Gemini API Key trong biến môi trường để trải nghiệm tư vấn động cá nhân hóa nâng cao từ AI!)*`;

  return {
    careerTitle,
    markdown,
    suggestedSkills,
    suggestedCerts
  };
}

/**
 * Call Gemini API using modern global fetch
 */
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured in .env');
  }

  // Use Gemini 2.5 Flash
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Empty response from Gemini');
  }
  return text;
}

module.exports = {
  getLocalRoadmap,
  callGemini
};
