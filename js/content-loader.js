/* =========================================================================
   content-loader.js — Đọc nội dung từ các file JSON trong thư mục /content
   (do Decap CMS chỉnh sửa) và hiển thị lên trang, KHÔNG cần sửa code HTML.

   Cách hoạt động:
   - content/companions/manifest.json  → danh sách "slug" của từng người
   - content/companions/<slug>.json    → chi tiết 1 người (tên, giá, ảnh...)
   - content/settings.json             → thông tin chung (liên hệ, chữ trang chủ)

   File này CHỈ đọc dữ liệu tĩnh (không cần server riêng) — miễn là các file
   JSON trên được đưa lên đúng cùng thư mục trên hosting là site tự cập nhật.
   ========================================================================= */

var CONTENT = (function () {
  function fetchJSON(path) {
    return fetch(path + '?v=' + Date.now()).then(function (r) {
      if (!r.ok) throw new Error('Không tải được ' + path);
      return r.json();
    });
  }

  function getManifest() {
    return fetchJSON('content/manifest.json').then(function (data) { return data.slugs || []; });
  }
  function getCompanion(slug) { return fetchJSON('content/companions/' + slug + '.json'); }
  function getAllCompanions() {
    return getManifest().then(function (slugs) {
      return Promise.all(slugs.map(getCompanion));
    });
  }
  function getSettings() { return fetchJSON('content/settings.json').catch(function () { return {}; }); }
  function getPage(name) {
    return fetchJSON('content/pages/' + name + '.json').catch(function (err) {
      console.error('Không tải được content/pages/' + name + '.json:', err.message);
      return null;
    });
  }

  return { getManifest: getManifest, getCompanion: getCompanion, getAllCompanions: getAllCompanions, getSettings: getSettings, getPage: getPage };
})();

function priceFmt(n) { return Number(n).toLocaleString('vi-VN'); }

// =========================================================================
// Thẻ người đồng hành (dùng chung cho trang chủ + danh sách)
// =========================================================================
function companionCardHTML(p) {
  return (
    '<a href="ho-so.html?id=' + p.slug + '" class="person-card" data-loc="' + p.loc + '" data-activity="' + p.activity + '" data-rating="' + p.rating + '">' +
    '<div class="person-photo">' +
    '<img src="' + p.avatar + '" alt="' + p.name + '" onerror="this.parentElement.innerHTML=\'<div class=&quot;placeholder-photo&quot;><div class=&quot;icon&quot;>🖼️</div>Chưa có ảnh</div>' + '\'">' +
    '<span class="verified-tag">✓ Đã xác minh</span></div>' +
    '<div class="person-body"><div class="name-row"><h4>' + p.name + ', ' + p.age + '</h4><span class="stars">★ ' + p.rating + '</span></div>' +
    '<p class="loc">' + p.loc + '</p></div></a>'
  );
}

function buildVideoEmbedHTML(url) {
  if (!url) return '';
  var yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
  if (yt) {
    return '<iframe src="https://www.youtube.com/embed/' + yt[1] + '" style="width:100%;height:100%;border:0;" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>';
  }
  var vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) {
    return '<iframe src="https://player.vimeo.com/video/' + vimeo[1] + '" style="width:100%;height:100%;border:0;" allow="autoplay; fullscreen; picture-in-picture" allowfullscreen></iframe>';
  }
  // File video tải lên trực tiếp (mp4, webm...)
  return '<video src="' + url + '" controls style="width:100%;height:100%;object-fit:cover;background:#000;"></video>';
}

function initTvcContent() {
  var section = document.getElementById('tvc-section');
  if (!section) return;
  CONTENT.getSettings().then(function (s) {
    if (!s || !s.tvc_video_url) return; // không có video -> giữ ẩn section
    var titleEl = document.getElementById('tvc-title');
    var container = document.getElementById('tvc-container');
    if (titleEl && s.tvc_title) titleEl.textContent = s.tvc_title;
    if (container) container.innerHTML = buildVideoEmbedHTML(s.tvc_video_url);
    section.style.display = '';
  });
}

// =========================================================================
// Trang chủ: 4 người nổi bật + chữ hero từ settings.json
// =========================================================================
function initHomeContent() {
  var grid = document.getElementById('featured-grid');
  if (grid) {
    CONTENT.getAllCompanions().then(function (people) {
      grid.innerHTML = people.slice(0, 4).map(companionCardHTML).join('');
    }).catch(function (err) {
      grid.innerHTML = '<p style="color:#b42318;">Không tải được danh sách người đồng hành: ' + err.message + '</p>';
    });
  }
  CONTENT.getSettings().then(function (s) {
    if (!s) return;
    var t1 = document.getElementById('hero-title-line1');
    var ta = document.getElementById('hero-title-accent');
    var d = document.getElementById('hero-desc');
    if (t1 && s.hero_title_line1) t1.textContent = s.hero_title_line1;
    if (ta && s.hero_title_accent) ta.textContent = s.hero_title_accent;
    if (d && s.hero_desc) d.textContent = s.hero_desc;

    var heroPhotoWrap = document.getElementById('hero-photo-wrap');
    if (heroPhotoWrap && s.hero_image) {
      heroPhotoWrap.innerHTML = '<img src="' + s.hero_image + '" alt="Boyfriend Material" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;">';
    }
    var ctaImageWrap = document.getElementById('cta-image-wrap');
    if (ctaImageWrap && s.cta_image) {
      ctaImageWrap.outerHTML = '<img src="' + s.cta_image + '" alt="Boyfriend Material" style="width:100%;border-radius:var(--radius-md);margin:16px 0;">';
    }
  });
}

// =========================================================================
// Trang danh sách: toàn bộ người đồng hành + bộ lọc/sắp xếp
// =========================================================================
function initDanhSachContent() {
  var grid = document.getElementById('people-grid');
  if (!grid) return;
  CONTENT.getAllCompanions().then(function (people) {
    grid.innerHTML = people.map(companionCardHTML).join('');
    var countEl = document.getElementById('result-count');
    if (countEl) countEl.textContent = people.length + ' người đồng hành';
    // Bộ lọc/sắp xếp (js/main.js) cần chạy SAU khi thẻ đã được render xong:
    if (typeof wireFilterAndSort === 'function') wireFilterAndSort();
  }).catch(function (err) {
    grid.innerHTML = '<p style="color:#b42318;">Không tải được danh sách người đồng hành: ' + err.message + '</p>';
  });
}

// =========================================================================
// Trang hồ sơ động: ho-so.html?id=<slug>
// =========================================================================
function initProfileContent() {
  var root = document.getElementById('profile-root');
  if (!root) return;
  var params = new URLSearchParams(window.location.search);
  var slug = params.get('id');
  if (!slug) {
    root.innerHTML = '<p style="padding:40px;text-align:center;">Không tìm thấy hồ sơ. <a href="danh-sach.html">Quay lại danh sách</a>.</p>';
    return;
  }
  Promise.all([CONTENT.getCompanion(slug), CONTENT.getPage('dich-vu')]).then(function (results) {
    var p = results[0];
    var servicesPage = results[1];
    var allServices = servicesPage ? (servicesPage.services || []) : null;
    var services = allServices;
    if (allServices && p.services_offered && p.services_offered.length > 0) {
      services = allServices.filter(function (s) { return p.services_offered.indexOf(s.name) !== -1; });
      if (services.length === 0) services = allServices; // phòng khi tên bị gõ sai chính tả, tránh dropdown trống hẳn
    }
    document.title = p.name + ' — Hồ sơ người đồng hành — Boyfriend Material';
    var firstName = p.name.split(' ').slice(-1)[0];
    var hobbiesHtml = (p.hobbies || []).map(function (h) { return '<span class="chip">' + h + '</span>'; }).join('');
    var persArr = p.personality || [];
    var persHtml = '<dt>Tính cách</dt><dd>' + (persArr[0] || '') + '</dd>' +
      '<dt></dt><dd>' + (persArr[1] || '') + '</dd><dt></dt><dd>' + (persArr[2] || '') + '</dd><dt></dt><dd>' + (persArr[3] || '') + '</dd>';
    var galleryHtml = (p.gallery || []).map(function (g) {
      return '<div class="gallery-item"><img src="' + g + '" alt="' + p.name + '" onerror="this.parentElement.style.display=\'none\'"></div>';
    }).join('');
    var serviceOptionsHtml = services === null
      ? '<option data-price="">⚠️ Lỗi tải dữ liệu dịch vụ — xem HUONG-DAN.md</option>'
      : (services.length
          ? services.map(function (s) {
              return '<option data-price="' + s.price + '">' + s.name + ' — ' + s.price + '</option>';
            }).join('')
          : '<option data-price="">(Chưa có dịch vụ nào — thêm ở mục "Trang Dịch vụ" trong admin)</option>');

    root.innerHTML =
      '<div class="profile-cover"><img src="' + p.cover + '" alt="Ảnh bìa" style="width:100%;height:100%;object-fit:cover;border-radius:inherit;" onerror="this.parentElement.innerHTML=\'<div class=&quot;placeholder-photo&quot;><div class=&quot;icon&quot;>🖼️</div>Chưa có ảnh bìa</div>' + '\'"></div>' +
      '<div class="profile-main">' +
        '<div class="profile-card">' +
          '<div class="profile-head">' +
            '<div class="profile-avatar"><img src="' + p.avatar + '" alt="' + p.name + '" onerror="this.outerHTML=\'Chưa có ảnh\'"></div>' +
            '<div><h2>' + p.name + ' <span class="verify-dot">✓</span></h2>' +
            '<p class="profile-meta">' + p.age + ' tuổi &nbsp;·&nbsp; ' + p.loc + ' &nbsp;·&nbsp; Cao ' + p.height + ' &nbsp;·&nbsp; ' + p.weight + ' &nbsp;·&nbsp; ' + p.job + '</p>' +
            '<div class="profile-tags"><span class="tag">★ ' + p.rating + ' (' + p.reviews + ' đánh giá)</span><span class="tag outline">' + p.bookings + ' lượt đặt</span><span class="tag outline">Đã xác minh</span></div></div>' +
          '</div>' +
          '<div class="profile-section"><h3>Giới thiệu</h3><p>' + p.bio + '</p></div>' +
          '<div class="profile-section"><h3>Thư viện ảnh</h3><div class="profile-gallery">' + galleryHtml + '</div></div>' +
          '<div class="profile-section"><h3>Sở thích</h3><div class="chip-row">' + hobbiesHtml + '</div></div>' +
          '<div class="profile-section"><h3>Thông tin</h3><div class="info-table">' +
            '<dl><dt>Ngày sinh</dt><dd>' + p.birth + '</dd><dt>Quê quán</dt><dd>' + p.hometown + '</dd><dt>Nghề nghiệp</dt><dd>' + p.job + '</dd><dt>Học vấn</dt><dd>' + p.edu + '</dd><dt>Hút thuốc</dt><dd>Không</dd><dt>Uống rượu</dt><dd>Thỉnh thoảng</dd></dl>' +
            '<dl>' + persHtml + '</dl></div></div>' +
        '</div>' +
        '<aside class="book-card" data-full-name="' + p.name + '">' +
          '<h3 style="font-size:1.1rem;">Đặt lịch với ' + firstName + '</h3>' +
          '<p style="font-size:.85rem;color:var(--ink-soft);">Giá theo từng loại dịch vụ — xem chi tiết tại trang <a href="dich-vu.html">Dịch vụ</a>.</p><hr>' +
          '<div class="field"><label>Chọn ngày</label><input type="date"></div>' +
          '<div class="field"><label>Địa điểm gặp mặt</label><input type="text" id="book-location" placeholder="Ví dụ: Quán cafe ABC, Quận 1..."></div>' +
          '<div class="field"><label>Khung giờ (từ - đến)</label><div class="time-range-row">' +
            '<select id="book-time-from"><option>06:00</option><option>08:00</option><option>10:00</option><option>12:00</option><option selected>14:00</option><option>16:00</option><option>18:00</option><option>20:00</option><option>22:00</option></select>' +
            '<span>đến</span>' +
            '<select id="book-time-to"><option>08:00</option><option>10:00</option><option>12:00</option><option>14:00</option><option selected>16:00</option><option>18:00</option><option>20:00</option><option>22:00</option><option>00:00</option></select>' +
          '</div></div>' +
          '<div class="field"><label>Chọn dịch vụ</label><select id="book-service">' + serviceOptionsHtml + '</select></div>' +
          '<a href="#" class="btn btn-primary btn-block">Đặt lịch ngay</a>' +
          '<a href="#" class="btn btn-outline btn-block" style="margin-top:10px;">Nhắn tin trước khi đặt lịch</a>' +
        '</aside>' +
      '</div>';

    if (typeof wireBooking === 'function') wireBooking();
  }).catch(function (err) {
    root.innerHTML = '<p style="padding:40px;text-align:center;">Không tìm thấy hồ sơ "' + slug + '". <a href="danh-sach.html">Quay lại danh sách</a>.</p>';
  });
}

// =========================================================================
// Logo header/footer — áp dụng trên MỌI trang có content-loader.js
// =========================================================================
function initGlobalBranding() {
  var header = document.getElementById('site-logo-header');
  var footer = document.getElementById('site-logo-footer');
  if (!header && !footer) return;
  CONTENT.getSettings().then(function (s) {
    if (!s || !s.site_logo) return;
    if (header) header.src = s.site_logo;
    if (footer) footer.src = s.site_logo;
  });
}

// =========================================================================
// Trang Dịch vụ: tiêu đề + 2 bảng gói (theo giờ / theo ngày)
// =========================================================================
function pkgCardHTML(pkg) {
  var featClass = pkg.featured ? ' featured' : '';
  var tag = pkg.featured ? '<span class="pkg-tag">Phổ biến nhất</span>' : '';
  var btnClass = pkg.featured ? 'btn-primary' : 'btn-outline';
  var feats = (pkg.features || []).map(function (f) { return '<li>' + f + '</li>'; }).join('');
  return '<div class="pkg-card' + featClass + '">' + tag +
    '<span class="pkg-name">' + pkg.name + '</span><span class="pkg-price">' + pkg.price + '</span>' +
    '<ul class="pkg-feats">' + feats + '</ul>' +
    '<a href="danh-sach.html" class="btn ' + btnClass + ' btn-block">Chọn gói</a></div>';
}
function serviceCardHTML(s) {
  return '<div class="service-card"><div class="service-icon">' + s.icon + '</div><h4>' + s.name + '</h4>' +
    '<p class="desc">' + s.desc + '</p><p class="price">Từ ' + s.price + '</p>' +
    '<a href="danh-sach.html" class="btn btn-outline btn-sm btn-block">Đặt ngay</a></div>';
}
function initServicesContent() {
  var hourlyGrid = document.getElementById('pkg-hourly');
  var dailyGrid = document.getElementById('pkg-daily');
  var servicesGrid = document.getElementById('services-grid');
  if (!hourlyGrid && !dailyGrid && !servicesGrid) return;
  CONTENT.getPage('dich-vu').then(function (p) {
    if (!p) {
      var errMsg = '<p style="grid-column:1/-1;color:#b42318;padding:20px;text-align:center;">Không tải được dữ liệu dịch vụ (content/pages/dich-vu.json). Kiểm tra file này đã có trên GitHub/Netlify chưa — xem HUONG-DAN.md mục "Khắc phục sự cố".</p>';
      if (servicesGrid) servicesGrid.innerHTML = errMsg;
      if (hourlyGrid) hourlyGrid.innerHTML = errMsg;
      return;
    }
    var titleEl = document.getElementById('dv-title');
    var descEl = document.getElementById('dv-desc');
    if (titleEl && p.intro_title) titleEl.textContent = p.intro_title;
    if (descEl && p.intro_desc) descEl.textContent = p.intro_desc;
    if (servicesGrid && p.services) servicesGrid.innerHTML = p.services.map(serviceCardHTML).join('');
    if (hourlyGrid && p.packages_hourly) hourlyGrid.innerHTML = p.packages_hourly.map(pkgCardHTML).join('');
    if (dailyGrid && p.packages_daily) dailyGrid.innerHTML = p.packages_daily.map(pkgCardHTML).join('');
  });
}

// =========================================================================
// Trang Về chúng tôi: tiêu đề, mô tả, sứ mệnh, ảnh, số liệu
// =========================================================================
function initAboutContent() {
  var wrap = document.getElementById('about-stats');
  if (!wrap) return;
  CONTENT.getPage('ve-chung-toi').then(function (p) {
    if (!p) return;
    var titleEl = document.getElementById('about-title');
    var descEl = document.getElementById('about-desc');
    var missionEl = document.getElementById('about-mission');
    var imgWrap = document.getElementById('about-image-wrap');
    if (titleEl && p.intro_title) titleEl.textContent = p.intro_title;
    if (descEl && p.intro_desc) descEl.textContent = p.intro_desc;
    if (missionEl && p.mission_text) missionEl.textContent = p.mission_text;
    if (imgWrap && p.image) {
      imgWrap.outerHTML = '<div style="border-radius:var(--radius-lg);overflow:hidden;"><img src="' + p.image + '" alt="Về chúng tôi" style="width:100%;height:100%;object-fit:cover;" onerror="this.parentElement.innerHTML=\'<div class=&quot;placeholder-photo&quot;><div class=&quot;icon&quot;>🖼️</div>Chưa có ảnh</div>' + '\'"></div>';
    }
    if (wrap && p.stats) {
      wrap.innerHTML = p.stats.map(function (s) {
        return '<div class="stat-card"><div class="num">' + s.number + '</div><div class="lbl">' + s.label + '</div></div>';
      }).join('');
    }
  });
}

// =========================================================================
// Trang liên hệ: điền số điện thoại / email / địa chỉ từ settings.json
// =========================================================================
function initContactInfoContent() {
  var wrap = document.getElementById('contact-info-app');
  if (!wrap) return;
  CONTENT.getSettings().then(function (s) {
    var titleEl = document.getElementById('contact-title');
    var descEl = document.getElementById('contact-desc');
    var hotline = document.getElementById('info-hotline');
    var email = document.getElementById('info-email');
    var address = document.getElementById('info-address');
    var hours = document.getElementById('info-hours');
    if (titleEl && s.contact_intro_title) titleEl.textContent = s.contact_intro_title;
    if (descEl && s.contact_intro_desc) descEl.textContent = s.contact_intro_desc;
    if (hotline && s.contact_hotline) hotline.textContent = s.contact_hotline;
    if (email && s.contact_email) email.textContent = s.contact_email;
    if (address && s.contact_address) address.textContent = s.contact_address;
    if (hours && s.contact_hours) hours.textContent = s.contact_hours;
  });
}

document.addEventListener('DOMContentLoaded', function () {
  initGlobalBranding();
  initHomeContent();
  initTvcContent();
  initDanhSachContent();
  initProfileContent();
  initContactInfoContent();
  initServicesContent();
  initAboutContent();
});
