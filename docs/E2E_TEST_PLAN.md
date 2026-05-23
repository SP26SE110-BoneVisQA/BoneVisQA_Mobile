# E2E Test Plan - Maestro Student Features

## Phạm vi

Bộ flow Maestro tại `.maestro/` kiểm tra luồng student sau khi nhánh tính năng được
tích hợp. Android `appId` lấy từ `app.json` là `com.doanminhtien.mobile`.

Suite mặc định không gửi câu hỏi AI, không nộp assignment và không xác nhận rời
lớp. Nó chỉ tạo một draft assignment trong local storage của app.

## Cấu trúc flow

| Flow | Mục đích | Mặc định |
| --- | --- | --- |
| `.maestro/safe_suite.yaml` | Chạy toàn bộ kiểm tra không destructive | Có |
| `flows/safe/smoke_student_navigation.yaml` | Login và điều hướng tab student | Có |
| `flows/safe/assignments_local_draft.yaml` | Mở assignment mock, lưu/khôi phục draft local | Có |
| `flows/safe/classes_list_detail.yaml` | Mở danh sách và chi tiết lớp | Có |
| `flows/safe/visual_qa_history_thread.yaml` | Mở history/thread và thấy entry yêu cầu review | Có |
| `flows/safe/advanced_analytics.yaml` | Kiểm tra màn analytics và các section nâng cao | Có |
| `flows/opt_in/assignment_mock_submit.yaml` | Nộp assignment mock và đổi trạng thái local | Không |
| `flows/opt_in/classes_leave_confirmation_cancel.yaml` | Mở hộp thoại rời lớp rồi huỷ | Không |
| `flows/opt_in/visual_qa_review_form_cancel.yaml` | Mở form review rồi huỷ, không gửi | Không |

## Điều kiện dữ liệu

Cần cung cấp tài khoản student test hợp lệ và fixture/mock data ổn định:

| Biến | Nội dung cần cung cấp |
| --- | --- |
| `STUDENT_EMAIL` | Email tài khoản student test |
| `STUDENT_PASSWORD` | Mật khẩu, chỉ truyền qua môi trường; không commit |
| `E2E_ASSIGNMENT_TITLE` | `Bao cao quan sat X-quang nguc`, assignment demo local đang `pending` |
| `E2E_CLASS_TITLE` | Tên lớp fixture mà student đang tham gia |
| `E2E_VISUAL_QA_THREAD_TITLE` | Thread history có sẵn để mở mà không gửi AI request |

Assignment dùng cho `assignment_mock_submit.yaml` phải là dữ liệu demo/mock,
không ghi submission lên backend thật. Class dùng cho flow leave phải là dữ liệu
test; flow hiện chỉ nhấn `Hủy`, không nhấn nút xác nhận rời lớp.

## Chạy trên Windows PowerShell

Sau khi cài Maestro và khởi động emulator/device có app build đã cài:

```powershell
$env:STUDENT_EMAIL = Read-Host "STUDENT_EMAIL"
$secret = Read-Host "STUDENT_PASSWORD" -AsSecureString
$ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
try { $env:STUDENT_PASSWORD = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
$env:E2E_ASSIGNMENT_TITLE = "Bao cao quan sat X-quang nguc"
$env:E2E_CLASS_TITLE = "Lop X-quang Test"
$env:E2E_VISUAL_QA_THREAD_TITLE = "Visual QA Demo E2E"

maestro test `
  -e STUDENT_EMAIL="$env:STUDENT_EMAIL" `
  -e STUDENT_PASSWORD="$env:STUDENT_PASSWORD" `
  -e E2E_ASSIGNMENT_TITLE="$env:E2E_ASSIGNMENT_TITLE" `
  -e E2E_CLASS_TITLE="$env:E2E_CLASS_TITLE" `
  -e E2E_VISUAL_QA_THREAD_TITLE="$env:E2E_VISUAL_QA_THREAD_TITLE" `
  .maestro/safe_suite.yaml
```

Chạy riêng flow opt-in chỉ sau khi đã xác nhận môi trường dùng mock/test data:

```powershell
maestro test -e STUDENT_EMAIL="$env:STUDENT_EMAIL" -e STUDENT_PASSWORD="$env:STUDENT_PASSWORD" -e E2E_ASSIGNMENT_TITLE="$env:E2E_ASSIGNMENT_TITLE" .maestro/flows/opt_in/assignment_mock_submit.yaml
maestro test -e STUDENT_EMAIL="$env:STUDENT_EMAIL" -e STUDENT_PASSWORD="$env:STUDENT_PASSWORD" -e E2E_CLASS_TITLE="$env:E2E_CLASS_TITLE" .maestro/flows/opt_in/classes_leave_confirmation_cancel.yaml
maestro test -e STUDENT_EMAIL="$env:STUDENT_EMAIL" -e STUDENT_PASSWORD="$env:STUDENT_PASSWORD" -e E2E_VISUAL_QA_THREAD_TITLE="$env:E2E_VISUAL_QA_THREAD_TITLE" .maestro/flows/opt_in/visual_qa_review_form_cancel.yaml
```

Không chạy `maestro test .maestro` trong CI mặc định, vì lệnh đó có thể thu thập
cả thư mục `flows/opt_in`.

## Hợp đồng selector/UI

Các flow ưu tiên text visible thay vì toạ độ. Agent Code cần giữ các nhãn sau
hoặc điều chỉnh flow cùng lúc khi UI đổi:

| Khu vực | Nhãn/selector bắt buộc cho flow |
| --- | --- |
| Login | `student@example.com`, `Nhập mật khẩu`, `Đăng nhập` |
| Navigation | `Trang chủ`, `Quiz`, `Bài tập`, `Ca lâm sàng`, `Thông báo`, `Hồ sơ` |
| Assignment | `Bài tự luận`, title từ `E2E_ASSIGNMENT_TITLE`, `Bài làm`, `Nhập câu trả lời tự luận...`, `Đã lưu nháp`, `Đã khôi phục nháp`, `Nộp bài`, `Nộp assignment?`, `Đã nộp`, `Nội dung đã nộp` |
| Classes | Entry `Lớp học`, heading `Lớp học của tôi`, title từ `E2E_CLASS_TITLE`, `Chi tiết lớp`, `Bài tập`, `Rời lớp`, confirm `Bạn có chắc muốn rời lớp?`, `Hủy` |
| Visual QA | Entry trong Cases `Hỏi đáp hình ảnh`, `Lịch sử Visual QA`, title từ `E2E_VISUAL_QA_THREAD_TITLE`, `Chi tiết hội thoại`, `Yêu cầu review`, form `Yêu cầu chuyên gia review`, `Gửi yêu cầu review`, `Hủy` |
| Analytics | `Tiến độ`, `Tiến độ học tập`, `Xem phân tích chi tiết`, `Hiệu suất tổng thể`, `Điểm trung bình theo tuần`, `Điểm mạnh`, `Cần cải thiện`, `Phân tích nâng cao`, `Năng lực`, `Lỗi lặp lại`, `Gợi ý cá nhân` |

Với phần tử icon-only hoặc text động, nên thêm accessibility label trùng text
trong bảng để Maestro có selector ổn định, đặc biệt cho entry Visual QA history
và nút mở Classes.

## Trạng thái thực thi tại thời điểm tạo

Ngày 2026-05-23, máy local có `adb` và Java 17 nhưng chưa có lệnh `maestro`.
Vì vậy chưa thể execute hoặc validate runtime các flow trên local.

Ngoài ra, ở snapshot production code được đọc khi viết kế hoạch:

- Classes list/detail/leave, Visual QA history/thread/review và Analytics nâng cao
  đã được triển khai; khả năng chạy còn phụ thuộc dữ liệu của tài khoản Student.
- Assignment draft sử dụng dữ liệu demo/local submission, không ghi bài nộp lên backend.

Sau khi Agent Code hoàn thành và Maestro được cài, chạy `safe_suite.yaml` trước;
chỉ chạy từng flow `opt_in` trong dữ liệu mock/test đã được kiểm chứng.
