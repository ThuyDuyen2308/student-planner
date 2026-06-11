/**
 * Middleware kiểm tra quyền Quản trị viên (Admin)
 * --------------------------------------------------
 * Thay đổi: Tạo mới file này để bảo vệ các endpoint chỉ dành cho Admin.
 * Cách hoạt động:
 *   - Kiểm tra `req.user` (được gắn bởi authMiddleware trước đó).
 *   - Nếu `role === 'admin'` thì cho phép đi tiếp (next()).
 *   - Ngược lại, trả về 403 Forbidden.
 * Sử dụng: Gắn vào sau authMiddleware trên các route /api/admin/*
 */
module.exports = function (req, res, next) {
  // Kiểm tra người dùng đã đăng nhập và có vai trò là admin
  if (req.user && req.user.role === 'admin') {
    next(); // Cho phép tiếp tục xử lý request
  } else {
    // Từ chối truy cập nếu không phải admin
    res.status(403).json({ message: 'Truy cập bị từ chối. Yêu cầu quyền Quản trị viên.' });
  }
};
