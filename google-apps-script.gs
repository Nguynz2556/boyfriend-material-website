/**
 * ===========================================================================
 * GOOGLE APPS SCRIPT — nhận dữ liệu từ website Boyfriend Material
 * ===========================================================================
 * File này KHÔNG chạy trên website — bạn cần copy toàn bộ nội dung bên dưới
 * và dán vào Google Apps Script (xem hướng dẫn chi tiết trong HUONG-DAN.md,
 * mục "9. Gửi dữ liệu về Google Doc / Google Sheet").
 *
 * Việc script làm:
 * - Khi có người ĐĂNG KÝ tài khoản mới trên web -> ghi thêm 1 dòng vào Google Doc.
 * - Khi có người ĐẶT LỊCH hoặc GỬI FORM LIÊN HỆ -> ghi thêm 1 dòng vào Google Sheet.
 * ===========================================================================
 */

var DOC_ID = '1EKew-YKZsw_przcn78E7n3b4dapM_p_7iJcoHKNtQdU';
var SHEET_ID = '11kZaknpPXUbovbguPVJHB9NwmYx3qR3-l8ENWtno9YU';

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    if (data.type === 'register') {
      appendToDoc(data);
    } else {
      appendToSheet(data);
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
  return ContentService.createTextOutput('Boyfriend Material webhook đang hoạt động ✅');
}

function appendToDoc(data) {
  var doc = DocumentApp.openById(DOC_ID);
  var body = doc.getBody();
  var time = Utilities.formatDate(new Date(), 'GMT+7', 'dd/MM/yyyy HH:mm');
  body.appendParagraph(time + '  —  ' + (data.name || '') + '  —  ' + (data.email || ''));
}

function appendToSheet(data) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheets()[0];

  // Nếu sheet đang trống, tự thêm dòng tiêu đề trước.
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['Thời gian', 'Loại', 'Họ tên', 'Email', 'SĐT', 'Nội dung', 'Người đồng hành', 'Dịch vụ', 'Ngày hẹn', 'Khung giờ']);
  }

  sheet.appendRow([
    new Date(),
    data.type || '',
    data.name || data.userName || '',
    data.email || data.userEmail || '',
    data.phone || '',
    data.message || '',
    data.companionName || '',
    data.service || '',
    data.date || '',
    data.timeRange || '',
  ]);
}
