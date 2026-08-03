// ---- Mobile nav toggle ----
document.addEventListener('DOMContentLoaded', function () {
  var toggle = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      links.classList.toggle('open');
    });
  }

  // ---- Pricing toggle (services page): chuyển đổi thật giữa gói theo giờ / theo ngày ----
  var pricingBtns = document.querySelectorAll('.pricing-toggle button');
  var pkgPanels = document.querySelectorAll('[data-pkg-panel]');
  pricingBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      pricingBtns.forEach(function (b) { b.classList.remove('active'); });
      btn.classList.add('active');
      var target = btn.getAttribute('data-pricing');
      pkgPanels.forEach(function (panel) {
        if (!target) return; // nếu button cũ chưa có data-pricing thì không đổi gì
        panel.hidden = panel.getAttribute('data-pkg-panel') !== target;
      });
    });
  });

  // ---- Contact form: chỉ chặn submit nếu chưa nối Formspree thật ----
  var form = document.querySelector('.contact-form');
  if (form) {
    var action = form.getAttribute('action') || '';
    if (action.indexOf('YOUR_FORM_ID') !== -1) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        alert('Đây là bản demo: form chưa nối Formspree thật.\nHãy đăng ký miễn phí tại formspree.io, tạo form, rồi thay YOUR_FORM_ID trong lien-he.html bằng ID thật của bạn để nhận tin nhắn qua email.');
        form.reset();
      });
    } else if (typeof sendToGoogleBackend === 'function') {
      // Không chặn submit (form vẫn gửi tới Formspree bình thường), chỉ gửi thêm 1 bản vào Google Sheet.
      form.addEventListener('submit', function () {
        sendToGoogleBackend('contact', {
          name: form.querySelector('[name="name"]') ? form.querySelector('[name="name"]').value : '',
          email: form.querySelector('[name="email"]') ? form.querySelector('[name="email"]').value : '',
          phone: form.querySelector('[name="phone"]') ? form.querySelector('[name="phone"]').value : '',
          message: form.querySelector('[name="message"]') ? form.querySelector('[name="message"]').value : '',
        });
      });
    }
  }

  // ---- Newsletter form ở footer: cùng logic như trên ----
  document.querySelectorAll('.footer-news').forEach(function (f) {
    var action = f.getAttribute('action') || '';
    if (action.indexOf('YOUR_FORM_ID') !== -1) {
      f.addEventListener('submit', function (e) {
        e.preventDefault();
        alert('Đây là bản demo: chưa nối Formspree thật cho form đăng ký nhận tin. Xem hướng dẫn trong HUONG-DAN.md.');
        f.reset();
      });
    }
  });

  // ---- Booking price update (companion profile page) ----
  var serviceSelect = document.querySelector('#book-service');
  var priceOut = document.querySelector('#book-price-value');
  if (serviceSelect && priceOut) {
    serviceSelect.addEventListener('change', function () {
      var price = serviceSelect.selectedOptions[0].getAttribute('data-price');
      priceOut.textContent = price;
    });
  }

  updateAuthNav();
  wireLogout();
  if (typeof CONTENT === 'undefined') {
    // Không có content-loader.js trên trang này (trang tĩnh cũ) -> chạy ngay như bình thường.
    wireFilterAndSort();
    wireBooking();
  }
  // Nếu có content-loader.js, chính content-loader sẽ gọi wireFilterAndSort()/wireBooking()
  // SAU KHI dữ liệu JSON tải xong và thẻ/hồ sơ đã được vẽ ra, để tránh gắn sự kiện 2 lần.
  wireMessageLinks();
});

// =========================================================================
// Đăng nhập / Đăng xuất trên thanh nav (chạy trên mọi trang có include store.js)
// =========================================================================
function updateAuthNav() {
  if (typeof BM === 'undefined') return;
  var user = BM.currentUser();
  var guestEls = document.querySelectorAll('[data-auth-guest]');
  var userEls = document.querySelectorAll('[data-auth-user]');
  if (user) {
    guestEls.forEach(function (el) { el.style.display = 'none'; });
    userEls.forEach(function (el) { el.style.display = ''; });
    var logoutBtn = document.querySelector('[data-auth-logout]');
    if (logoutBtn) logoutBtn.textContent = 'Đăng xuất (' + user.name.split(' ')[0] + ')';
  } else {
    guestEls.forEach(function (el) { el.style.display = ''; });
    userEls.forEach(function (el) { el.style.display = 'none'; });
  }
}

function wireLogout() {
  document.querySelectorAll('[data-auth-logout]').forEach(function (el) {
    el.addEventListener('click', function (e) {
      e.preventDefault();
      BM.logout();
      updateAuthNav();
      window.location.href = 'index.html';
    });
  });
}

// =========================================================================
// Lọc & sắp xếp danh sách người đồng hành (danh-sach.html)
// =========================================================================
function wireFilterAndSort() {
  var grid = document.querySelector('#people-grid');
  if (!grid) return;

  var search = document.querySelector('#filter-search');
  var loc = document.querySelector('#filter-loc');
  var activity = document.querySelector('#filter-activity');
  var sort = document.querySelector('#filter-sort');
  var count = document.querySelector('#result-count');
  var cards = Array.prototype.slice.call(grid.querySelectorAll('.person-card'));

  function apply() {
    var q = (search && search.value || '').trim().toLowerCase();
    var locVal = loc && loc.value || '';
    var actVal = activity && activity.value || '';
    var visible = cards.filter(function (card) {
      var name = card.querySelector('h4').textContent.toLowerCase();
      var okSearch = !q || name.indexOf(q) !== -1;
      var okLoc = !locVal || card.getAttribute('data-loc') === locVal;
      var okAct = !actVal || card.getAttribute('data-activity') === actVal;
      return okSearch && okLoc && okAct;
    });

    var sortVal = sort && sort.value || '';
    if (sortVal === 'rating-desc') {
      visible.sort(function (a, b) { return parseFloat(b.getAttribute('data-rating')) - parseFloat(a.getAttribute('data-rating')); });
    } else if (sortVal === 'price-asc') {
      visible.sort(function (a, b) { return parseInt(a.getAttribute('data-price')) - parseInt(b.getAttribute('data-price')); });
    } else if (sortVal === 'price-desc') {
      visible.sort(function (a, b) { return parseInt(b.getAttribute('data-price')) - parseInt(a.getAttribute('data-price')); });
    }

    cards.forEach(function (c) { c.style.display = 'none'; });
    visible.forEach(function (c) { c.style.display = ''; grid.appendChild(c); });
    if (count) count.textContent = visible.length + ' người đồng hành';
  }

  [search, loc, activity, sort].forEach(function (el) {
    if (!el) return;
    el.addEventListener('input', apply);
    el.addEventListener('change', apply);
  });

  // ---- Hiển thị thêm người đồng hành do admin thêm qua admin.html ----
  var extraWrap = document.querySelector('#admin-extra-cards');
  if (extraWrap && typeof BM !== 'undefined') {
    var extras = BM.getExtraCompanions();
    extras.forEach(function (p) {
      var a = document.createElement('a');
      a.href = 'ho-so.html';
      a.className = 'person-card';
      a.innerHTML =
        '<div class="person-photo"><div class="placeholder-photo"><div class="icon">🖼️</div>Ảnh: chưa có</div>' +
        '<span class="verified-tag">Mới thêm (admin)</span></div>' +
        '<div class="person-body"><div class="name-row"><h4>' + p.name + ', ' + p.age + '</h4><span class="stars">★ ' + p.rating + '</span></div>' +
        '<p class="loc">' + p.loc + '</p><p class="price">' + Number(p.price).toLocaleString('vi-VN') + 'đ <span>/giờ</span></p></div>';
      extraWrap.appendChild(a);
    });
  }
}

// =========================================================================
// Đặt lịch: yêu cầu đăng nhập -> yêu cầu eKYC (1 lần) -> mô phỏng thanh toán
// -> chuyển sang trang hợp đồng để ký xác nhận
// =========================================================================
function wireBooking() {
  var bookBtn = document.querySelector('.book-card .btn-primary');
  if (!bookBtn) return;
  bookBtn.addEventListener('click', function (e) {
    e.preventDefault();
    if (typeof BM === 'undefined') return;
    var user = BM.currentUser();
    if (!user) {
      alert('Vui lòng đăng nhập trước khi đặt lịch.');
      window.location.href = 'dang-nhap.html?next=' + encodeURIComponent(window.location.pathname);
      return;
    }
    if (!BM.isEkycVerified(user.id)) {
      alert('Bạn cần xác minh danh tính (eKYC) trước khi đặt lịch lần đầu. Việc này chỉ cần làm 1 lần.');
      window.location.href = 'ekyc.html?next=' + encodeURIComponent(window.location.pathname + window.location.search);
      return;
    }

    var companionName = document.querySelector('.book-card h3').textContent.replace('Đặt lịch với ', '');
    var dateInput = document.querySelector('.book-card input[type="date"]');
    var locationInput = document.querySelector('#book-location');
    var timeFrom = document.querySelector('#book-time-from');
    var timeTo = document.querySelector('#book-time-to');
    var timeRange = (timeFrom && timeTo) ? (timeFrom.value + ' - ' + timeTo.value) : '';
    var serviceSelect = document.querySelector('#book-service');
    var priceText = serviceSelect ? serviceSelect.selectedOptions[0].textContent : document.querySelector('.book-price').textContent;

    var confirmPay = confirm(
      'Xác nhận đặt lịch với ' + companionName + '\n' +
      'Dịch vụ: ' + priceText + '\n' +
      'Ngày: ' + (dateInput ? dateInput.value : 'chưa chọn') + (timeRange ? (' · Khung giờ: ' + timeRange) : '') + '\n\n' +
      '(Đây là bước MÔ PHỎNG thanh toán demo — chưa nối cổng thanh toán thật như Momo/VNPay/ZaloPay.)\n' +
      'Bấm OK để "thanh toán" demo và tiếp tục sang bước ký hợp đồng.'
    );
    if (!confirmPay) return;

    var booking = BM.addBooking({
      userId: user.id,
      companionName: companionName,
      service: priceText,
      date: dateInput ? dateInput.value : '',
      timeRange: timeRange,
      location: locationInput ? locationInput.value.trim() : '',
    });

    if (typeof sendToGoogleBackend === 'function') {
      sendToGoogleBackend('booking', {
        companionName: companionName, service: priceText,
        date: dateInput ? dateInput.value : '', timeRange: timeRange,
        userEmail: user.email, userName: user.name,
      });
    }

    window.location.href = 'hop-dong.html?bookingId=' + encodeURIComponent(booking.id);
  });

  var chatLinks = document.querySelectorAll('.book-card .btn-outline');
  chatLinks.forEach(function (link) {
    if (link.textContent.indexOf('Nhắn tin') === -1) return;
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var companionName = document.querySelector('.book-card h3').textContent.replace('Đặt lịch với ', '');
      window.location.href = 'tin-nhan.html?with=' + encodeURIComponent(companionName);
    });
  });
}

function wireMessageLinks() {
  // dự phòng cho các trang khác có thể thêm link nhắn tin sau này
}
