/* =========================================================================
   pages.js — Logic riêng cho các trang: đăng nhập, đăng ký, tin nhắn, admin.
   Được tách ra thành file .js riêng (KHÔNG viết inline trong thẻ <script> giữa
   HTML) vì một số nhà cung cấp hosting/CDN (ví dụ Cloudflare ở chế độ bảo mật
   cao) tự động chặn inline script bằng chính sách CSP, khiến nút bấm không
   phản hồi dù code không hề sai. Để trong file .js riêng sẽ chạy ổn định
   trên mọi loại hosting.
   ========================================================================= */

function showFormMessage(el, text, isError) {
  if (!el) { alert(text); return; }
  el.textContent = text;
  el.style.display = 'block';
  el.style.padding = '10px 14px';
  el.style.borderRadius = '8px';
  el.style.marginBottom = '14px';
  el.style.fontSize = '.9rem';
  if (isError) {
    el.style.background = '#fdeaea';
    el.style.color = '#b42318';
  } else {
    el.style.background = '#e8f6ec';
    el.style.color = '#1a7f3c';
  }
}

document.addEventListener('DOMContentLoaded', function () {
  if (typeof BM === 'undefined') {
    console.error('BM (store.js) chưa được nạp — kiểm tra lại thẻ <script src="js/store.js"> trong file HTML.');
    return;
  }

  // ---------------- Trang đăng nhập ----------------
  var loginForm = document.getElementById('login-form');
  if (loginForm) {
    var loginMsg = document.getElementById('login-msg');
    loginForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var email = document.getElementById('login-email').value.trim();
      var pass = document.getElementById('login-password').value;
      var res = BM.login(email, pass);
      if (!res.ok) { showFormMessage(loginMsg, res.error, true); return; }
      showFormMessage(loginMsg, 'Đăng nhập thành công! Đang chuyển hướng...', false);
      var params = new URLSearchParams(window.location.search);
      var next = params.get('next');
      setTimeout(function () { window.location.href = next || 'index.html'; }, 500);
    });
  }

  // ---------------- Trang đăng ký ----------------
  var signupForm = document.getElementById('signup-form');
  if (signupForm) {
    var signupMsg = document.getElementById('signup-msg');
    var roleCustomer = document.getElementById('role-customer');
    var roleCompanion = document.getElementById('role-companion');
    if (roleCustomer && roleCompanion) {
      roleCustomer.addEventListener('change', function () { if (roleCustomer.checked) roleCompanion.checked = false; syncRoleCards(); });
      roleCompanion.addEventListener('change', function () { if (roleCompanion.checked) roleCustomer.checked = false; syncRoleCards(); });
      syncRoleCards();
    }
    function syncRoleCards() {
      document.querySelectorAll('.role-card').forEach(function (card) {
        var input = card.querySelector('input');
        card.classList.toggle('checked', input.checked);
      });
    }

    signupForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = document.getElementById('signup-name').value.trim();
      var email = document.getElementById('signup-email').value.trim();
      var pass = document.getElementById('signup-password').value;
      var role = (roleCompanion && roleCompanion.checked) ? 'companion' : 'customer';
      if (!name || !email || pass.length < 6) {
        showFormMessage(signupMsg, 'Vui lòng nhập đủ họ tên, email hợp lệ và mật khẩu tối thiểu 6 ký tự.', true);
        return;
      }
      var res = BM.signup(name, email, pass, role);
      if (!res.ok) { showFormMessage(signupMsg, res.error, true); return; }
      sendToGoogleBackend('register', { name: name, email: email, role: role, createdAt: new Date().toISOString() });

      if (role === 'companion') {
        BM.submitCompanionApplication(res.user.id);
        showFormMessage(signupMsg, 'Đăng ký thành công! Đang chuyển sang xác minh danh tính (eKYC)...', false);
        setTimeout(function () { window.location.href = 'ekyc.html?next=' + encodeURIComponent('index.html?applied=1'); }, 600);
      } else {
        showFormMessage(signupMsg, 'Đăng ký thành công! Đang chuyển hướng...', false);
        setTimeout(function () { window.location.href = 'index.html'; }, 500);
      }
    });
  }

  // ---------------- Trang tin nhắn (chat demo kiểu Messenger) ----------------
  var chatApp = document.getElementById('chat-app');
  if (chatApp) initChatPage();

  // ---------------- Trang admin ----------------
  var addCompanionForm = document.getElementById('add-companion-form');
  if (addCompanionForm) initAdminPage();

  // ---------------- Trang giỏ hàng / lịch sử đặt ----------------
  var ordersApp = document.getElementById('orders-app');
  if (ordersApp) initOrdersPage();

  // ---------------- Trang eKYC ----------------
  var ekycApp = document.getElementById('ekyc-app');
  if (ekycApp) initEkycPage();

  // ---------------- Trang hợp đồng theo lượt đặt ----------------
  var contractApp = document.getElementById('contract-app');
  if (contractApp) initContractPage();
});

// =========================================================================
// Gửi dữ liệu về Google (Apps Script Web App) — xem HUONG-DAN.md để lấy URL
// =========================================================================
function sendToGoogleBackend(type, payload) {
  var WEBAPP_URL = 'PASTE_YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE';
  if (WEBAPP_URL.indexOf('PASTE_YOUR') !== -1) return; // chưa cấu hình, bỏ qua im lặng
  fetch(WEBAPP_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(Object.assign({ type: type }, payload)),
  }).catch(function (err) { console.error('Không gửi được dữ liệu về Google:', err); });
}

// =========================================================================
// Trang tin nhắn kiểu Messenger — danh sách hội thoại bên trái + khung chat phải
// =========================================================================
function initChatPage() {
  var user = BM.currentUser();
  if (!user) {
    alert('Vui lòng đăng nhập trước khi nhắn tin.');
    window.location.href = 'dang-nhap.html?next=tin-nhan.html';
    return;
  }
  var params = new URLSearchParams(window.location.search);
  var withName = params.get('with');

  var convList = document.getElementById('conv-list');
  var chatTitle = document.getElementById('chat-title');
  var messagesBox = document.getElementById('chat-messages');
  var chatForm = document.getElementById('chat-form');
  var chatInput = document.getElementById('chat-input');
  var emptyState = document.getElementById('chat-empty');

  function getConversations() {
    var names = BM.getConversationNames ? BM.getConversationNames() : [];
    if (withName && names.indexOf(withName) === -1) names.push(withName);
    return names;
  }

  function selectConversation(name) {
    withName = name;
    var url = new URL(window.location.href);
    url.searchParams.set('with', name);
    window.history.replaceState({}, '', url);
    renderConvList();
    renderMessages();
  }

  function renderConvList() {
    var names = getConversations();
    if (names.length === 0) {
      convList.innerHTML = '<p style="padding:16px;color:#8a93a6;font-size:.85rem;">Chưa có cuộc trò chuyện nào. Vào một hồ sơ và bấm "Nhắn tin trước khi đặt lịch" để bắt đầu.</p>';
      return;
    }
    convList.innerHTML = names.map(function (n) {
      var active = n === withName ? ' active' : '';
      return '<button class="conv-item' + active + '" data-name="' + n + '">' +
        '<span class="conv-avatar">' + n.charAt(0) + '</span><span>' + n + '</span></button>';
    }).join('');
    convList.querySelectorAll('.conv-item').forEach(function (btn) {
      btn.addEventListener('click', function () { selectConversation(btn.getAttribute('data-name')); });
    });
  }

  function renderMessages() {
    if (!withName) {
      chatTitle.textContent = 'Chọn một cuộc trò chuyện';
      messagesBox.innerHTML = '';
      messagesBox.style.display = 'none';
      emptyState.style.display = 'flex';
      chatForm.style.display = 'none';
      return;
    }
    emptyState.style.display = 'none';
    messagesBox.style.display = 'flex';
    chatForm.style.display = 'flex';
    chatTitle.textContent = withName;
    var msgs = BM.getMessages(withName);
    messagesBox.innerHTML = '';
    if (msgs.length === 0) {
      messagesBox.innerHTML = '<p style="color:#8a93a6;text-align:center;margin-top:20px;">Chưa có tin nhắn. Gửi lời chào đầu tiên nhé!</p>';
    }
    msgs.forEach(function (m) {
      var bubble = document.createElement('div');
      bubble.className = 'chat-bubble ' + (m.from === 'me' ? 'me' : 'them');
      bubble.textContent = m.text;
      messagesBox.appendChild(bubble);
    });
    messagesBox.scrollTop = messagesBox.scrollHeight;
  }

  chatForm.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!chatInput.value.trim() || !withName) return;
    BM.addMessage(withName, chatInput.value.trim(), 'me');
    chatInput.value = '';
    renderMessages();
    setTimeout(function () {
      BM.addMessage(withName, 'Cảm ơn bạn đã nhắn tin! Đây là phản hồi demo — nối backend thật (ví dụ Socket.io/Firebase) để nhận trả lời thật từ người đồng hành.', 'them');
      renderMessages();
      renderConvList();
    }, 700);
  });

  renderConvList();
  if (withName) renderMessages(); else renderMessages();
}

// =========================================================================
// Trang admin — thêm/xoá người đồng hành, xem booking
// =========================================================================
function initAdminPage() {
  var form = document.getElementById('add-companion-form');
  var list = document.getElementById('companion-admin-list');
  var bookingList = document.getElementById('booking-admin-list');
  var appList = document.getElementById('companion-application-list');

  function renderApplications() {
    if (!appList) return;
    var apps = BM.getCompanionApplications().filter(function (a) { return a.status === 'pending'; });
    if (apps.length === 0) { appList.innerHTML = '<p style="color:#8a93a6;">Chưa có đơn nào chờ duyệt.</p>'; return; }
    appList.innerHTML = apps.map(function (a) {
      var ekyc = BM.getEkyc(a.userId);
      var ekycStatus = (ekyc && ekyc.verifiedAt) ? '<span class="tag">✓ Đã xác minh eKYC</span>' : '<span class="tag outline">Chưa xác minh eKYC</span>';
      return '<div class="form-card" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:10px;">' +
        '<div><b>' + a.name + '</b> — ' + a.email + '<br>' + ekycStatus + '</div>' +
        '<div style="display:flex;gap:8px;">' +
        '<button class="btn btn-primary btn-sm" data-approve="' + a.id + '">Duyệt</button>' +
        '<button class="btn btn-outline btn-sm" data-reject="' + a.id + '">Từ chối</button>' +
        '</div></div>';
    }).join('');
    appList.querySelectorAll('[data-approve]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        BM.approveCompanionApplication(btn.getAttribute('data-approve'), { age: 18, loc: 'TP. Hồ Chí Minh', price: 500000, rating: 5.0 });
        renderApplications();
        renderCompanions();
        alert('Đã duyệt! Nhớ vào mục "Thêm người đồng hành mới" ở dưới để bổ sung ảnh/giá/khu vực chính xác cho người này.');
      });
    });
    appList.querySelectorAll('[data-reject]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        BM.rejectCompanionApplication(btn.getAttribute('data-reject'));
        renderApplications();
      });
    });
  }

  function renderCompanions() {
    var items = BM.getExtraCompanions();
    if (items.length === 0) { list.innerHTML = '<p style="color:#8a93a6;">Chưa có người nào được thêm.</p>'; return; }
    list.innerHTML = items.map(function (p) {
      return '<div class="form-card" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">' +
        '<div><b>' + p.name + ', ' + p.age + '</b> — ' + p.loc + ' — ' + Number(p.price).toLocaleString('vi-VN') + 'đ/giờ — ★' + p.rating + '</div>' +
        '<button class="btn btn-outline btn-sm" data-del="' + p.id + '">Xoá</button></div>';
    }).join('');
    list.querySelectorAll('[data-del]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        BM.deleteCompanion(btn.getAttribute('data-del'));
        renderCompanions();
      });
    });
  }

  function renderBookings() {
    var items = BM.getBookings();
    if (items.length === 0) { bookingList.innerHTML = '<p style="color:#8a93a6;">Chưa có lượt đặt lịch nào.</p>'; return; }
    bookingList.innerHTML = items.slice().reverse().map(function (b) {
      return '<div class="form-card" style="margin-bottom:10px;">' +
        '<b>' + b.companionName + '</b> — ' + b.service + ' — ' + (b.date || 'chưa chọn ngày') + ' ' + (b.timeRange || '') +
        '<br><span style="color:#8a93a6;font-size:.85rem;">' + b.status + ' · ' + new Date(b.createdAt).toLocaleString('vi-VN') + '</span></div>';
    }).join('');
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    BM.addCompanion({
      name: document.getElementById('c-name').value.trim(),
      age: document.getElementById('c-age').value,
      loc: document.getElementById('c-loc').value,
      price: document.getElementById('c-price').value,
      rating: document.getElementById('c-rating').value || '4.8',
      desc: document.getElementById('c-desc').value.trim(),
    });
    form.reset();
    renderCompanions();
    alert('Đã thêm! Vào lại trang "Người đồng hành" để xem thẻ mới ở cuối danh sách.');
  });

  renderCompanions();
  renderBookings();
  renderApplications();
}

// =========================================================================
// Bảng ký tên (signature pad) dùng chung cho eKYC và hợp đồng đặt lịch
// =========================================================================
function setupSignaturePad(canvasId, clearBtnId) {
  var canvas = document.getElementById(canvasId);
  if (!canvas) return null;
  var ctx = canvas.getContext('2d');
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#172341';
  var drawing = false;
  var hasSigned = false;

  function pos(e) {
    var rect = canvas.getBoundingClientRect();
    var scaleX = canvas.width / rect.width;
    var scaleY = canvas.height / rect.height;
    var clientX = e.touches ? e.touches[0].clientX : e.clientX;
    var clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }
  function start(e) { drawing = true; hasSigned = true; var p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); e.preventDefault(); }
  function move(e) { if (!drawing) return; var p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); e.preventDefault(); }
  function end() { drawing = false; }

  canvas.addEventListener('mousedown', start);
  canvas.addEventListener('mousemove', move);
  window.addEventListener('mouseup', end);
  canvas.addEventListener('touchstart', start, { passive: false });
  canvas.addEventListener('touchmove', move, { passive: false });
  canvas.addEventListener('touchend', end);

  var clearBtn = document.getElementById(clearBtnId);
  if (clearBtn) {
    clearBtn.addEventListener('click', function () {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasSigned = false;
    });
  }

  return {
    isEmpty: function () { return !hasSigned; },
    getDataURL: function () { return canvas.toDataURL('image/png'); },
  };
}

function fileToDataURL(file, callback) {
  var reader = new FileReader();
  reader.onload = function () { callback(reader.result); };
  reader.readAsDataURL(file);
}

// =========================================================================
// Trang eKYC — CCCD trước/sau + quét khuôn mặt qua camera + ký hợp đồng
// =========================================================================
function initEkycPage() {
  var user = BM.currentUser();
  if (!user) {
    alert('Vui lòng đăng nhập trước khi xác minh danh tính.');
    window.location.href = 'dang-nhap.html?next=ekyc.html';
    return;
  }

  var frontInput = document.getElementById('cccd-front');
  var backInput = document.getElementById('cccd-back');
  var frontPreview = document.getElementById('cccd-front-preview');
  var backPreview = document.getElementById('cccd-back-preview');
  var video = document.getElementById('ekyc-video');
  var canvas = document.getElementById('ekyc-canvas');
  var selfiePreview = document.getElementById('selfie-preview');
  var btnOpenCam = document.getElementById('btn-open-cam');
  var btnCapture = document.getElementById('btn-capture');
  var btnRetake = document.getElementById('btn-retake');
  var camError = document.getElementById('cam-error');
  var step3 = document.getElementById('ekyc-step3');
  var btnSubmit = document.getElementById('btn-submit-ekyc');
  var msgEl = document.getElementById('ekyc-msg');
  var agree = document.getElementById('ekyc-agree');
  var fullnameInput = document.getElementById('ekyc-fullname');
  fullnameInput.value = user.name;

  var state = { front: null, back: null, selfie: null, stream: null };
  var sigPad = setupSignaturePad('sign-pad', 'btn-clear-sign');

  function checkReadyForContract() {
    if (state.front && state.back && state.selfie) {
      step3.style.display = 'block';
    }
    checkReadyForSubmit();
  }
  function checkReadyForSubmit() {
    var ready = state.front && state.back && state.selfie && agree.checked && fullnameInput.value.trim() && sigPad && !sigPad.isEmpty();
    btnSubmit.disabled = !ready;
  }

  frontInput.addEventListener('change', function () {
    if (!frontInput.files[0]) return;
    fileToDataURL(frontInput.files[0], function (url) {
      state.front = url;
      frontPreview.src = url; frontPreview.style.display = 'block';
      checkReadyForContract();
    });
  });
  backInput.addEventListener('change', function () {
    if (!backInput.files[0]) return;
    fileToDataURL(backInput.files[0], function (url) {
      state.back = url;
      backPreview.src = url; backPreview.style.display = 'block';
      checkReadyForContract();
    });
  });

  btnOpenCam.addEventListener('click', function () {
    camError.style.display = 'none';
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } }).then(function (stream) {
      state.stream = stream;
      video.srcObject = stream;
      video.style.display = 'block';
      btnOpenCam.style.display = 'none';
      btnCapture.style.display = 'inline-flex';
    }).catch(function (err) {
      camError.textContent = 'Không thể mở camera: ' + err.message + '. Bạn có thể thử trình duyệt/thiết bị khác, hoặc cấp quyền camera trong cài đặt trình duyệt.';
      camError.style.display = 'block';
    });
  });

  btnCapture.addEventListener('click', function () {
    canvas.width = video.videoWidth || 360;
    canvas.height = video.videoHeight || 360;
    canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
    state.selfie = canvas.toDataURL('image/jpeg', 0.85);
    selfiePreview.src = state.selfie;
    selfiePreview.style.display = 'block';
    video.style.display = 'none';
    btnCapture.style.display = 'none';
    btnRetake.style.display = 'inline-flex';
    if (state.stream) state.stream.getTracks().forEach(function (t) { t.stop(); });
    checkReadyForContract();
  });

  btnRetake.addEventListener('click', function () {
    selfiePreview.style.display = 'none';
    btnRetake.style.display = 'none';
    btnOpenCam.style.display = 'inline-flex';
    state.selfie = null;
    checkReadyForSubmit();
  });

  agree.addEventListener('change', checkReadyForSubmit);
  fullnameInput.addEventListener('input', checkReadyForSubmit);
  document.getElementById('sign-pad').addEventListener('mouseup', checkReadyForSubmit);
  document.getElementById('sign-pad').addEventListener('touchend', checkReadyForSubmit);

  btnSubmit.addEventListener('click', function () {
    BM.saveEkycStep(user.id, {
      cccdFront: state.front, cccdBack: state.back, selfie: state.selfie,
      signatureDataUrl: sigPad.getDataURL(), fullName: fullnameInput.value.trim(),
      verifiedAt: Date.now(),
    });
    showFormMessage(msgEl, 'Xác minh eKYC thành công! Đang chuyển hướng...', false);
    sendToGoogleBackend('ekyc_completed', { name: user.name, email: user.email });
    var params = new URLSearchParams(window.location.search);
    var next = params.get('next') || 'index.html';
    setTimeout(function () { window.location.href = next; }, 800);
  });
}

// =========================================================================
// Trang hợp đồng theo lượt đặt lịch — ký xác nhận sau khi "thanh toán"
// =========================================================================
function initContractPage() {
  var user = BM.currentUser();
  var params = new URLSearchParams(window.location.search);
  var bookingId = params.get('bookingId');
  var detailsBox = document.getElementById('contract-details');
  var msgEl = document.getElementById('contract-msg');
  var agree = document.getElementById('contract-agree');
  var btnSign = document.getElementById('btn-sign-contract');
  var sigPad = setupSignaturePad('sign-pad', 'btn-clear-sign');

  if (!user || !bookingId) {
    detailsBox.innerHTML = '<p>Không tìm thấy thông tin đặt lịch. Vui lòng quay lại trang hồ sơ và đặt lịch lại.</p>';
    btnSign.style.display = 'none';
    return;
  }
  var booking = BM.getBookingById(bookingId);
  if (!booking) {
    detailsBox.innerHTML = '<p>Không tìm thấy lượt đặt lịch này.</p>';
    btnSign.style.display = 'none';
    return;
  }

  detailsBox.innerHTML =
    '<p><b>Khách hàng:</b> ' + user.name + ' (' + user.email + ')</p>' +
    '<p><b>Người đồng hành:</b> ' + booking.companionName + '</p>' +
    '<p><b>Dịch vụ:</b> ' + booking.service + '</p>' +
    '<p><b>Ngày hẹn:</b> ' + (booking.date || 'chưa chọn') + (booking.timeRange ? (' · Khung giờ: ' + booking.timeRange) : '') + '</p>';

  btnSign.addEventListener('click', function () {
    if (!agree.checked) { showFormMessage(msgEl, 'Vui lòng đồng ý với nội dung hợp đồng trước khi ký.', true); return; }
    if (!sigPad || sigPad.isEmpty()) { showFormMessage(msgEl, 'Vui lòng ký tên vào ô chữ ký.', true); return; }
    BM.signBookingContract(bookingId, sigPad.getDataURL(), user.name);
    showFormMessage(msgEl, 'Đã ký hợp đồng và xác nhận đặt lịch thành công! Đang chuyển tới trang đơn hàng...', false);
    setTimeout(function () { window.location.href = 'don-hang.html'; }, 900);
  });
}
function initOrdersPage() {
  var user = BM.currentUser();
  var wrap = document.getElementById('orders-app');
  if (!user) {
    wrap.innerHTML = '<p>Vui lòng <a href="dang-nhap.html?next=don-hang.html">đăng nhập</a> để xem lịch sử đặt hàng.</p>';
    return;
  }
  var all = BM.getBookings().filter(function (b) { return b.userId === user.id; });
  if (all.length === 0) {
    wrap.innerHTML = '<p style="color:#8a93a6;">Bạn chưa có lượt đặt lịch nào. <a href="danh-sach.html">Tìm người đồng hành ngay</a>.</p>';
    return;
  }
  wrap.innerHTML = all.slice().reverse().map(function (b) {
    var needsSign = !b.contract;
    return '<div class="form-card" style="margin-bottom:14px;">' +
      '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">' +
      '<b style="font-size:1.05rem;">' + b.companionName + '</b>' +
      '<span class="tag outline">' + b.status + '</span></div>' +
      '<p style="margin-top:8px;color:var(--ink-soft);">Dịch vụ: ' + b.service + '</p>' +
      '<p style="color:var(--ink-soft);">Ngày: ' + (b.date || 'chưa chọn') + (b.timeRange ? (' · Khung giờ: ' + b.timeRange) : '') + '</p>' +
      '<p style="color:#8a93a6;font-size:.85rem;margin-top:6px;">Đặt lúc: ' + new Date(b.createdAt).toLocaleString('vi-VN') + '</p>' +
      (needsSign ? '<a href="hop-dong.html?bookingId=' + b.id + '" class="btn btn-primary btn-sm" style="margin-top:10px;">Ký hợp đồng để xác nhận</a>' : '<p style="color:#1a7f3c;font-size:.85rem;margin-top:6px;">✓ Đã ký hợp đồng lúc ' + new Date(b.contract.signedAt).toLocaleString('vi-VN') + '</p>') +
      '</div>';
  }).join('');
}
