const API_URL = 'http://localhost:5000/api';

document.addEventListener('DOMContentLoaded', async () => {
  const loginScreen = document.getElementById('login-screen');
  const syncScreen = document.getElementById('sync-screen');
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const btnLogin = document.getElementById('btnLogin');
  const btnSync = document.getElementById('btnSync');
  const btnLogout = document.getElementById('btnLogout');
  const msgBox = document.getElementById('msgBox');
  const userEmailLabel = document.getElementById('userEmail');

  function showMessage(msg, type) {
    msgBox.textContent = msg;
    msgBox.className = `message ${type}`;
    setTimeout(() => { msgBox.className = 'message'; }, 5000);
  }

  // Khôi phục trạng thái đăng nhập
  chrome.storage.local.get(['token', 'email'], (result) => {
    if (result.token) {
      showSyncScreen(result.email);
    }
  });

  function showSyncScreen(email) {
    loginScreen.classList.remove('active');
    syncScreen.classList.add('active');
    userEmailLabel.textContent = email;
  }

  // Đăng nhập
  btnLogin.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) return showMessage('Vui lòng nhập đủ thông tin', 'error');

    btnLogin.disabled = true;
    btnLogin.textContent = 'Đang đăng nhập...';

    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.message || 'Lỗi đăng nhập');
      
      chrome.storage.local.set({ token: data.token, email: data.user.email }, () => {
        showSyncScreen(data.user.email);
        showMessage('Kết nối thành công!', 'success');
      });
    } catch (err) {
      showMessage(err.message, 'error');
    } finally {
      btnLogin.disabled = false;
      btnLogin.textContent = 'Đăng nhập kết nối';
    }
  });

  // Đăng xuất
  btnLogout.addEventListener('click', () => {
    chrome.storage.local.remove(['token', 'email'], () => {
      syncScreen.classList.remove('active');
      loginScreen.classList.add('active');
      emailInput.value = '';
      passwordInput.value = '';
    });
  });

  // Bắt đầu đồng bộ
  btnSync.addEventListener('click', async () => {
    btnSync.disabled = true;
    btnSync.textContent = 'Đang kiểm tra trang web...';

    // Lấy thông tin tab hiện tại
    let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab.url.includes('sinhvien.dau.edu.vn')) {
      showMessage('Vui lòng mở trang sinhvien.dau.edu.vn để cào dữ liệu!', 'error');
      btnSync.disabled = false;
      btnSync.textContent = 'Bắt đầu Cào Dữ Liệu';
      return;
    }

    // Tiêm script cào dữ liệu vào trang DAU
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    }, () => {
      // Nhận kết quả từ content.js
      chrome.tabs.sendMessage(tab.id, { action: 'PARSE_DAU_DATA' }, async (response) => {
        if (chrome.runtime.lastError) {
          showMessage('Không thể kết nối với trang web. Hãy F5 lại trang DAU.', 'error');
          btnSync.disabled = false;
          btnSync.textContent = 'Bắt đầu Cào Dữ Liệu';
          return;
        }

        if (response && response.success) {
          btnSync.textContent = 'Đang gửi dữ liệu về Server...';
          await sendDataToServer(response.data);
        } else {
          showMessage('Không tìm thấy dữ liệu hợp lệ trên trang.', 'error');
          btnSync.disabled = false;
          btnSync.textContent = 'Bắt đầu Cào Dữ Liệu';
        }
      });
    });
  });

  async function sendDataToServer(payload) {
    chrome.storage.local.get(['token'], async (result) => {
      try {
        const res = await fetch(`${API_URL}/sync/extension`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${result.token}`
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Lỗi khi gửi dữ liệu');
        
        showMessage('Đồng bộ thành công! Hãy xem trên Web.', 'success');
      } catch (err) {
        showMessage(err.message, 'error');
      } finally {
        btnSync.disabled = false;
        btnSync.textContent = 'Bắt đầu Cào Dữ Liệu';
      }
    });
  }
});
