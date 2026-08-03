/* =========================================================================
   store.js — Lớp "cơ sở dữ liệu" DEMO chạy hoàn toàn trên trình duyệt
   (dùng localStorage). KHÔNG PHẢI backend thật:
   - Dữ liệu chỉ lưu trên máy/trình duyệt của từng người dùng, không đồng bộ
     giữa các thiết bị, không có ai khác nhìn thấy được.
   - Mật khẩu lưu dạng thường (không mã hoá) — chỉ dùng để demo giao diện,
     TUYỆT ĐỐI không dùng mật khẩu thật của bạn.
   - Khi lên môi trường thật, hãy thay lớp này bằng backend + database thật
     (Node/Express + MongoDB, Firebase, Supabase...) và mã hoá mật khẩu (bcrypt).
   ========================================================================= */

const BM = (function () {
  const KEYS = {
    users: 'bm_users',
    session: 'bm_session',
    companionsExtra: 'bm_companions_extra',
    bookings: 'bm_bookings',
    messages: 'bm_messages',
    ekyc: 'bm_ekyc',
    companionApplications: 'bm_companion_applications',
  };

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // ---- Users / Auth ----
  function getUsers() { return read(KEYS.users, []); }
  function saveUsers(list) { write(KEYS.users, list); }

  function signup(name, email, password, role) {
    const users = getUsers();
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { ok: false, error: 'Email này đã được đăng ký.' };
    }
    const user = { id: uid(), name: name, email: email, password: password, role: role || 'customer', createdAt: Date.now() };
    users.push(user);
    saveUsers(users);
    setSession(user.id);
    return { ok: true, user: user };
  }

  function login(email, password) {
    const users = getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (!user) return { ok: false, error: 'Email hoặc mật khẩu không đúng.' };
    setSession(user.id);
    return { ok: true, user: user };
  }

  function setSession(userId) { write(KEYS.session, { userId: userId }); }
  function logout() { localStorage.removeItem(KEYS.session); }
  function currentUser() {
    const s = read(KEYS.session, null);
    if (!s) return null;
    return getUsers().find(u => u.id === s.userId) || null;
  }

  // ---- Companions added via admin panel ----
  function getExtraCompanions() { return read(KEYS.companionsExtra, []); }
  function saveExtraCompanions(list) { write(KEYS.companionsExtra, list); }
  function addCompanion(data) {
    const list = getExtraCompanions();
    const item = Object.assign({ id: uid(), createdAt: Date.now() }, data);
    list.push(item);
    saveExtraCompanions(list);
    return item;
  }
  function deleteCompanion(id) {
    saveExtraCompanions(getExtraCompanions().filter(c => c.id !== id));
  }

  // ---- Bookings ----
  function getBookings() { return read(KEYS.bookings, []); }
  function addBooking(data) {
    const list = getBookings();
    const item = Object.assign({ id: uid(), createdAt: Date.now(), status: 'Chờ ký hợp đồng' }, data);
    list.push(item);
    write(KEYS.bookings, list);
    return item;
  }

  // ---- Messages (demo chat) ----
  function getMessages(companionName) {
    const all = read(KEYS.messages, []);
    const user = currentUser();
    if (!user) return [];
    return all.filter(m => m.companionName === companionName && m.userId === user.id);
  }
  function getConversationNames() {
    const all = read(KEYS.messages, []);
    const user = currentUser();
    if (!user) return [];
    const names = [];
    all.forEach(m => {
      if (m.userId === user.id && names.indexOf(m.companionName) === -1) names.push(m.companionName);
    });
    return names;
  }
  function addMessage(companionName, text, from) {
    const all = read(KEYS.messages, []);
    const user = currentUser();
    if (!user) return null;
    const msg = { id: uid(), userId: user.id, companionName: companionName, text: text, from: from, createdAt: Date.now() };
    all.push(msg);
    write(KEYS.messages, all);
    return msg;
  }

  // ---- eKYC (xác minh danh tính 1 lần / tài khoản) ----
  // CẢNH BÁO: đây là bản DEMO — ảnh CCCD và khuôn mặt lưu dạng base64 ngay
  // trong localStorage của trình duyệt, KHÔNG mã hoá, KHÔNG có xác thực thật
  // (không đối chiếu với cơ sở dữ liệu dân cư, không kiểm tra giả mạo/liveness).
  // Tuyệt đối không dùng để lưu CCCD thật của người dùng thật. Khi triển khai
  // thật, phải dùng nhà cung cấp eKYC được cấp phép (VNeID, FPT.AI, VNPT eKYC...)
  // và tuân thủ Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân.
  function getEkyc(userId) {
    const all = read(KEYS.ekyc, {});
    return all[userId] || null;
  }
  function saveEkycStep(userId, stepData) {
    const all = read(KEYS.ekyc, {});
    all[userId] = Object.assign({}, all[userId], stepData, { updatedAt: Date.now() });
    write(KEYS.ekyc, all);
    return all[userId];
  }
  function isEkycVerified(userId) {
    const e = getEkyc(userId);
    return !!(e && e.cccdFront && e.cccdBack && e.selfie && e.verifiedAt);
  }

  // ---- Hợp đồng điện tử (ký theo từng lượt đặt lịch) ----
  function signBookingContract(bookingId, signatureDataUrl, fullName) {
    const list = getBookings();
    const idx = list.findIndex(b => b.id === bookingId);
    if (idx === -1) return null;
    list[idx].contract = { signatureDataUrl: signatureDataUrl, fullName: fullName, signedAt: Date.now() };
    list[idx].status = 'Đã ký hợp đồng - Đã xác nhận';
    write(KEYS.bookings, list);
    return list[idx];
  }
  function getBookingById(bookingId) {
    return getBookings().find(b => b.id === bookingId) || null;
  }

  // ---- Đơn đăng ký làm người đồng hành (chờ admin duyệt) ----
  function getCompanionApplications() { return read(KEYS.companionApplications, []); }
  function submitCompanionApplication(userId) {
    const list = getCompanionApplications();
    if (list.some(a => a.userId === userId)) return list.find(a => a.userId === userId);
    const user = getUsers().find(u => u.id === userId);
    const app = { id: uid(), userId: userId, name: user ? user.name : '', email: user ? user.email : '', status: 'pending', createdAt: Date.now() };
    list.push(app);
    write(KEYS.companionApplications, list);
    return app;
  }
  function approveCompanionApplication(appId, extraInfo) {
    const list = getCompanionApplications();
    const idx = list.findIndex(a => a.id === appId);
    if (idx === -1) return null;
    list[idx].status = 'approved';
    write(KEYS.companionApplications, list);
    addCompanion(Object.assign({ name: list[idx].name, ekycVerified: true }, extraInfo));
    return list[idx];
  }
  function rejectCompanionApplication(appId) {
    const list = getCompanionApplications();
    const idx = list.findIndex(a => a.id === appId);
    if (idx === -1) return null;
    list[idx].status = 'rejected';
    write(KEYS.companionApplications, list);
    return list[idx];
  }

  return {
    signup, login, logout, currentUser,
    getExtraCompanions, addCompanion, deleteCompanion,
    getBookings, addBooking, getBookingById,
    getMessages, getConversationNames, addMessage,
    getEkyc, saveEkycStep, isEkycVerified,
    signBookingContract,
    getCompanionApplications, submitCompanionApplication, approveCompanionApplication, rejectCompanionApplication,
  };
})();
