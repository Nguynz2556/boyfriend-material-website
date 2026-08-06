/**
 * ===========================================================================
 * GOOGLE APPS SCRIPT — "Backend nhẹ" cho website Boyfriend Material
 * ===========================================================================
 * File này KHÔNG chạy trên website — bạn cần copy toàn bộ nội dung bên dưới
 * và dán vào Google Apps Script (xem hướng dẫn chi tiết trong HUONG-DAN.md,
 * mục "25. Hướng A — Google Sheet làm backend nhẹ, theo thời gian thực").
 *
 * Việc script làm — TỰ ĐỘNG, THEO THỜI GIAN THỰC, ngay khi có người thao tác trên web:
 * - Có người ĐĂNG KÝ tài khoản mới      -> ghi 1 dòng vào tab "Tài khoản"
 * - Có người ĐẶT LỊCH                   -> ghi 1 dòng vào tab "Đơn hàng" (trạng thái: Mới đặt)
 * - Người đó KÝ HỢP ĐỒNG xác nhận       -> cập nhật lại đúng dòng đó (trạng thái: Đã ký hợp đồng)
 * - Có người hoàn tất eKYC              -> ghi 1 dòng vào tab "Tài khoản" (cột trạng thái eKYC)
 * - Có người gửi form Liên hệ           -> ghi 1 dòng vào tab "Liên hệ"
 * ===========================================================================
 */

var SHEET_ID = '11kZaknpPXUbovbguPVJHB9NwmYx3qR3-l8ENWtno9YU';

var TAB_ACCOUNTS = 'Tài khoản';
var TAB_ORDERS = 'Đơn hàng';
var TAB_CONTACT = 'Liên hệ';

var HEADERS = {};
HEADERS[TAB_ACCOUNTS] = ['Thời gian', 'Họ tên', 'Email', 'Vai trò', 'Trạng thái eKYC', 'SĐT (từ eKYC)'];
HEADERS[TAB_ORDERS] = ['Thời gian đặt', 'Mã đơn', 'Khách hàng', 'Email', 'SĐT', 'Người đồng hành', 'Dịch vụ', 'Ngày hẹn', 'Khung giờ', 'Địa điểm', 'Trạng thái'];
HEADERS[TAB_CONTACT] = ['Thời gian', 'Họ tên', 'Email', 'SĐT', 'Chủ đề/Nội dung'];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.type === 'register') {
      appendRow(TAB_ACCOUNTS, [nowStr(), data.name || '', data.email || '', data.role === 'companion' ? 'Người đồng hành' : 'Khách hàng', 'Chưa xác minh', '']);
    } else if (data.type === 'ekyc_completed') {
      appendRow(TAB_ACCOUNTS, [nowStr(), data.name || '', data.email || '', '', 'Đã xác minh eKYC', data.phone || '']);
    } else if (data.type === 'booking') {
      appendRow(TAB_ORDERS, [nowStr(), data.bookingId || '', data.userName || '', data.userEmail || '', data.phone || '', data.companionName || '', data.service || '', data.date || '', data.timeRange || '', data.location || '', 'Mới đặt (chờ ký hợp đồng)']);
    } else if (data.type === 'contract_signed') {
      updateOrderStatus(data.bookingId, 'Đã ký hợp đồng - Đã xác nhận');
    } else if (data.type === 'contact') {
      appendRow(TAB_CONTACT, [nowStr(), data.name || '', data.email || '', data.phone || '', data.message || '']);
    }

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Cho phép mở thử link Web App trên trình duyệt để kiểm tra đã deploy đúng chưa.
function doGet(e) {
  return ContentService.createTextOutput('Boyfriend Material webhook đang hoạt động ✅ — ' + new Date());
}

function nowStr() {
  return Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM/yyyy HH:mm:ss');
}

function getOrCreateSheet(tabName) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName(tabName);
  if (!sheet) {
    sheet = ss.insertSheet(tabName);
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS[tabName]);
    sheet.getRange(1, 1, 1, HEADERS[tabName].length).setFontWeight('bold').setBackground('#172341').setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function appendRow(tabName, rowValues) {
  var sheet = getOrCreateSheet(tabName);
  sheet.appendRow(rowValues);
}

// Tìm đúng dòng theo "Mã đơn" (bookingId) trong tab Đơn hàng và cập nhật cột Trạng thái.
function updateOrderStatus(bookingId, newStatus) {
  if (!bookingId) return;
  var sheet = getOrCreateSheet(TAB_ORDERS);
  var data = sheet.getDataRange().getValues();
  var idCol = HEADERS[TAB_ORDERS].indexOf('Mã đơn'); // 0-based
  var statusCol = HEADERS[TAB_ORDERS].indexOf('Trạng thái');
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(bookingId)) {
      sheet.getRange(i + 1, statusCol + 1).setValue(newStatus);
      return;
    }
  }
  // Không tìm thấy dòng cũ (hiếm khi xảy ra) -> ghi thêm dòng mới để không mất dữ liệu.
  appendRow(TAB_ORDERS, [nowStr(), bookingId, '', '', '', '', '', '', '', '', newStatus]);
}
