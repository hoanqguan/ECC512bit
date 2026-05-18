# ECC Crypto Toolkit

## Mục tiêu

`ECC Crypto Toolkit` là một ứng dụng mật mã học offline, chạy hoàn toàn trong trình duyệt.

- Không cần backend.
- Không có tính năng login/auth.
- Dữ liệu và khóa được xử lý cục bộ trong client.
- Tài liệu này tập trung vào công nghệ, giải thích cách app xử lý mật mã trên trình duyệt chứ không mô tả backend.
- Phù hợp để trình bày kỹ thuật, demo ECC và ECIES.

## Công nghệ chính

### 1. ECC Brainpool P-512

- Curve: `Brainpool P-512` (RFC 5639)
- Kích thước khóa: 512 bit
- Toán học được triển khai bằng `BigInt` trong `src/lib/brainpool.js`

### 2. Chữ ký số

- Thuật toán: `ECDSA`
- Hàm băm: `SHA-512` (Web Crypto API)
- Mục tiêu: ký và xác minh dữ liệu

### 3. Mã hóa

- Mô hình: `ECIES`
- Cơ chế:
  - Trao đổi khóa ECDH
  - Dẫn xuất khóa bằng `SHA-512`
  - Mã hóa đối xứng với `AES-256-CBC`
  - Xác thực dữ liệu bằng `HMAC-SHA-256`

### 4. Hash & cryptography API

- `SHA-512`: dùng cho ECDSA và KDF trong ECIES
- `SHA-256`: dùng cho HMAC của ECIES
- `AES-CBC`: mã hóa đối xứng
- `HMAC`: kiểm tra tính toàn vẹn ciphertext

## Trao đổi Alice và Bob

- Alice dùng public key của Bob để mã hóa dữ liệu trong tab `Encrypt`.
- Alice không cần private key của Bob, chỉ cần public key đã được chia sẻ công khai.
- Khi Bob nhận ciphertext, Bob dùng private key của chính mình trong tab `Decrypt` để giải mã.
- Với `Sign` và `Verify`: Bob có thể ký message bằng private key, còn Alice hoặc bên khác sẽ kiểm tra chữ ký bằng public key của Bob.
- Đây là mô hình cơ bản của ECC: public key được phân phối, private key giữ bí mật.

## 4 tab chính trong app

### Tab Encrypt

- Dùng public key để mã hóa
- Hỗ trợ `text` và `file`
- Kết quả: ciphertext Base64
- File xuất: `.enc.json`

### Tab Decrypt

- Dùng private key để giải mã
- Hỗ trợ input ciphertext hoặc import `.enc.json`
- Kết quả: plaintext hoặc file download

### Tab Sign

- Dùng private key để ký
- Hỗ trợ `text` và `file`
- Kết quả: signature `base64` / `hex`

### Tab Verify

- Dùng public key để xác minh
- Hỗ trợ `text` và `file`
- Hỗ trợ signature `base64` / `hex`

## Trình bày luồng công nghệ (dễ thuyết trình)

### A. Ký số

1. User nhập message hoặc chọn file
2. Message được băm bằng `SHA-512`
3. Kết quả băm được ký bằng `ECDSA` trên Brainpool P-512
4. Xuất chữ ký dưới dạng `base64(r||s)` hoặc `hex`

### B. Xác thực

1. User nhập message hoặc chọn file
2. Message được băm bằng `SHA-512`
3. Dùng public key để kiểm tra bằng `ECDSA Verify`
4. Hiện kết quả `Valid` / `Invalid`

### C. Mã hóa

1. Sinh khóa tạm thời `r`
2. Tính điểm `R = r * G`
3. Tính shared secret `S = r * Q`
4. Dẫn xuất 64 byte từ `SHA-512(S.x)`
5. Chia thành:
   - `encKey` 32 byte cho `AES-256-CBC`
   - `macKey` 32 byte cho `HMAC-SHA-256`
6. Mã hóa plaintext/file
7. Tính MAC trên `IV || ciphertext`
8. Xuất gói: `R || IV || ciphertext || MAC`

### D. Giải mã

1. Lấy private key
2. Giải mã `R` từ gói ciphertext
3. Tính shared secret `S = d * R`
4. Dẫn xuất `encKey` và `macKey` từ `SHA-512(S.x)`
5. Verify `HMAC-SHA-256` trước
6. Nếu hợp lệ, giải mã `AES-256-CBC`

## Thiết kế client-side

### Tab Encrypt

- Dùng public key để mã hóa
- Hỗ trợ `text` và `file`
- Kết quả: ciphertext Base64
- File xuất: `.enc.json`

### Tab Decrypt

- Dùng private key để giải mã
- Hỗ trợ input ciphertext hoặc import `.enc.json`
- Kết quả: plaintext hoặc file download

### Tab Sign

- Dùng private key để ký
- Hỗ trợ `text` và `file`
- Kết quả: signature `base64` / `hex`

### Tab Verify

- Dùng public key để xác minh
- Hỗ trợ `text` và `file`
- Hỗ trợ signature `base64` / `hex`

## Thiết kế client-side

- `src/pages/CryptoToolkit.jsx`: quản lý tab, state, key selection
- `src/components/crypto/EncryptPanel.jsx`: mã hóa ECIES
- `src/components/crypto/DecryptPanel.jsx`: giải mã ECIES
- `src/components/crypto/SignPanel.jsx`: ký ECDSA
- `src/components/crypto/VerifyPanel.jsx`: xác minh ECDSA
- `src/lib/brainpool.js`: thuật toán ECC, ECDSA, ECIES, conversion
- `src/lib/historyStore.js`: ghi lại lịch sử thao tác

## Lưu trữ key pair

- Key pair được lưu trong `localStorage` của trình duyệt dưới khóa `ecc_keypairs`.
- Dữ liệu được ghi dưới dạng mảng JSON, mỗi phần tử chứa:
  - `id`: UUID khóa
  - `name`: tên key (tối đa 12 ký tự)
  - `public_key_pem`: public key PEM
  - `private_key_pem`: private key PEM
  - `fingerprint`: fingerprint của public key
  - `created_date`, `updated_date`
  - `notes` nếu có
- Việc lưu và đọc key được thực hiện trong `src/lib/localKeyStore.js`.
- Khi import hoặc tạo key mới, ứng dụng sẽ ghi thêm phần tử vào mảng hiện có và cập nhật lại `localStorage`.

## Ghi chú khi thuyết trình

- Ứng dụng hoàn toàn chạy trên trình duyệt, không cần server.
- Key và dữ liệu không rời khỏi client.
- Brainpool P-512 là điểm khác biệt so với NIST curve thường gặp.
- ECIES ở đây dùng `SHA-512` để dẫn xuất khóa và `HMAC-SHA-256` để xác thực.
- Mục tiêu là minh họa quy trình mật mã, không phải triển khai production-grade security.
