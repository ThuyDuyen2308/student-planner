# Hướng Dẫn Theo Dõi Trực Tiếp Cơ Sở Dữ Liệu (MySQL Database Guide)

Để giúp bạn theo dõi và kiểm tra trực tiếp các thay đổi dữ liệu trong cơ sở dữ liệu `student_planner` (danh sách tài khoản, môn học, lịch học trùng hay không), bạn có thể sử dụng các cách đơn giản sau đây:

---

## Cách 1: Sử Dụng phpMyAdmin (Khuyên Dùng - Trực Quan Nhất)

Vì bạn đang chạy MySQL thông qua **XAMPP**, công cụ quản lý giao diện web `phpMyAdmin` đã được tích hợp sẵn.

1. **Bước 1**: Mở trình duyệt web của bạn (Chrome, Edge, Firefox...).
2. **Bước 2**: Truy cập vào đường dẫn: **[http://localhost/phpmyadmin](http://localhost/phpmyadmin)**.
3. **Bước 3**: Tại thanh menu bên trái, tìm và nhấp chọn cơ sở dữ liệu có tên là **`student_planner`**.
4. **Bước 4**: Tại đây bạn sẽ thấy 3 bảng:
   * `users`: Lưu các tài khoản đã đăng ký (mật khẩu đã được mã hóa).
   * `subjects`: Lưu các môn học kèm tín chỉ và điểm số GPA.
   * `schedules`: Lưu lịch học (thời gian, thứ, phòng học).
5. **Bước 5**: Nhấp chọn bảng bất kỳ và bấm vào tab **"Browse" (Duyệt)** ở trên cùng để xem danh sách dòng dữ liệu đang chạy trực tiếp. Khi bạn thao tác trên app (đăng ký môn, thêm lịch...), dữ liệu ở đây sẽ tự động cập nhật ngay khi tải lại trang!

---

## Cách 2: Xem Trực Tiếp Ngay Trong VS Code (Cực Kỳ Tiện Lợi)

Nếu bạn không muốn rời màn hình code VS Code, bạn có thể xem trực tiếp database bằng một extension cực kỳ mạnh mẽ:

1. **Bước 1**: Nhấp vào biểu tượng **Extensions (Ctrl+Shift+X)** ở thanh bên trái VS Code.
2. **Bước 2**: Tìm kiếm extension tên là: **`Database Client`** (hoặc **`MySQL`** của *Weijan Chen*).
3. **Bước 3**: Nhấp **Install** để cài đặt.
4. **Bước 4**: Sau khi cài xong, bạn sẽ thấy một biểu tượng cơ sở dữ liệu (hình ổ đĩa tròn) ở thanh hoạt động bên trái.
5. **Bước 5**: Bấm nút **Create Connection** (hoặc nút dấu `+`) và điền thông số như sau:
   * **Database Type**: `MySQL`
   * **Host**: `localhost` (hoặc `127.0.0.1`)
   * **Port**: `3306`
   * **User**: `root`
   * **Password**: *để trống* (hoặc `0000` tùy theo cấu hình của bạn)
   * **Database**: `student_planner`
6. **Bước 6**: Bấm **Connect**. Giờ đây bạn có thể mở rộng các bảng, nhấp đúp vào bảng để xem, chỉnh sửa hoặc chạy các câu lệnh SQL trực quan ngay trên VS Code!

---

## Cách 3: Truy Cập Bằng Command Line (Dòng Lệnh)

Nếu bạn ưa thích dòng lệnh nhanh chóng:

1. Mở PowerShell hoặc Command Prompt trên máy tính.
2. Gõ lệnh kết nối MySQL (Đảm bảo đường dẫn MySQL đã được thêm vào PATH hoặc chạy từ thư mục bin của XAMPP):
   ```bash
   mysql -u root -p
   ```
   *(Nhấn Enter nếu không có mật khẩu)*
3. Chuyển sang sử dụng cơ sở dữ liệu của dự án:
   ```sql
   USE student_planner;
   ```
4. Chạy câu lệnh truy vấn để xem trực tiếp:
   * Xem tài khoản người dùng: `SELECT * FROM users;`
   * Xem các môn học: `SELECT * FROM subjects;`
   * Xem lịch học: `SELECT * FROM schedules;`
