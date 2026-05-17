# ECC Crypto Toolkit

## 1. Giới thiệu

`ECC Crypto Toolkit` là một ứng dụng mật mã học chạy hoàn toàn trên trình duyệt. Ứng dụng sử dụng:

- Đường cong elliptic Brainpool P-512 (RFC 5639).
- Thuật toán chữ ký số ECDSA với hàm băm SHA-512.
- Mã hóa hỗn hợp ECIES kết hợp trao đổi khóa ECDH, AES-256-CBC và HMAC-SHA-256.
- Các hàm băm Web Crypto API: SHA-512 và SHA-256.
- Thư viện mã hóa thuần JavaScript (`src/lib/brainpool.js`) với toán học BigInt và các phép toán trực tiếp trên đường cong.

Ứng dụng không cần server để thực hiện toàn bộ thao tác mật mã; mọi khóa và dữ liệu có thể được sinh, ký và giải mã trực tiếp trong trình duyệt.

## 2. Công nghệ chính trong ứng dụng

- `React 18`, `Vite`, `Tailwind CSS`, `shadcn/ui` cho giao diện.
- `BigInt` để thực hiện toán học modulo lớn, xử lý các tham số trường số nguyên của đường cong.
- `crypto.subtle` (Web Crypto API) để thực hiện:
  - `SHA-512` cho băm message và dẫn xuất khóa.
  - `SHA-256` cho băm mật khẩu đăng nhập và HMAC.
  - `AES-CBC` cho mã hóa đối xứng trong ECIES.
  - `HMAC` cho xác thực tính toàn vẹn ciphertext.

## 3. Đường cong Elliptic Brainpool P-512

Ứng dụng dùng đường cong Brainpool P-512, một đường cong prime-field tiêu chuẩn châu Âu định nghĩa trong RFC 5639.

Đường cong có dạng:

`y^2 = x^3 + a x + b (mod p)`

Các tham số chính:

- `p` (prime field):
  `AADD9DB8DBE9C48B3FD4E6AE33C9FC07CB308DB3B3C9D20ED6639CCA703308717D4D9B009BC66842AECDA12AE6A380E62881FF2F2D82C68528AA6056583A48F3`
- `a`:
  `7830A3318B603B89E2327145AC234CC594CBDD8D3DF91610A83441CAEA9863BC2DED5D5AA8253AA10A2EF1C98B9AC8B57F1117A72BF2C7B9E7C1AC4D77FC94CA`
- `b`:
  `3DF91610A83441CAEA9863BC2DED5D5AA8253AA10A2EF1C98B9AC8B57F1117A72BF2C7B9E7C1AC4D77FC94CADC083E67984050B75EBAE5DD2809BD638016F723`
- Điểm sinh `G`:
  - `Gx`: `81AEE4BDD82ED9645A21322E9C4C6A9385ED9F70B5D916C1B43B62EEF4D0098EFF3B1F78E2D0D48D50D1687B93B97D5F7C6D5047406A5E688B352209BCB9F822`
  - `Gy`: `7DDE385D566332ECC0EABFA9CF7822FDF209F70024A57B1AA000C55B881F8111B2DCDE494A5F485E5BCA4BD88A2763AED1CA2B2FA8F0540678CD1E0F3AD80892`
- `n` (order của điểm G):
  `AADD9DB8DBE9C48B3FD4E6AE33C9FC07CB308DB3B3C9D20ED6639CCA70330870553E5C414CA92619418661197FAC10471DB1D381085DDADDB58796829CA90069`
- `h` (cofactor): `1`

### 3.1. Toán học đường cong sử dụng trong mã

Trong `src/lib/brainpool.js`, ứng dụng triển khai:

- `mod(a, p)`: tính modulo dương.
- `modInv(a, p)`: nghịch đảo modulo p dựa trên `a^(p-2) mod p`.
- `pointAdd(P, Q)`: phép cộng hai điểm trên đường cong.
- `pointDouble(P)`: phép nhân đôi một điểm.
- `pointMul(k, P)`: phép nhân vô hướng bằng phương pháp double-and-add.

Đây là các phép toán nền tảng để xây dựng khóa công khai, chữ ký và chia sẻ bí mật ECDH.

## 4. Sinh khóa ECC

Khóa được tạo bằng cách:

1. Sinh số nguyên ngẫu nhiên `d` trong khoảng `1 <= d <= n-1`.
2. Tính điểm công khai `Q = d * G` trên đường cong.

- `d` là khóa riêng.
- `Q` là khóa công khai.

Key pair được xuất ra định dạng PEM-like đơn giản:

- Public key: `-----BEGIN BRAINPOOL P512 PUBLIC KEY-----`
- Private key: `-----BEGIN BRAINPOOL P512 PRIVATE KEY-----`

Key cũng có thể chuyển đổi sang/ra JWK với `crv: "brainpoolP512r1"` và các trường `x`, `y`, `d` được mã hóa base64url.

## 5. Chữ ký số ECDSA + SHA-512

Ứng dụng sử dụng ECDSA trên đường cong Brainpool P-512 với hàm băm SHA-512.

Tóm tắt quy trình ký:

1. `hash = SHA-512(message)`.
2. `e = hash mod n`.
3. Chọn nonce ngẫu nhiên `k` trong `(0, n)`.
4. Tính `R = k * G`.
5. `r = R.x mod n`.
6. `s = k^-1 * (e + r * d) mod n`.
7. Nếu `r == 0` hoặc `s == 0`, lặp lại với `k` khác.

Trong mã:

- `sign(...)` thực hiện ký bằng cách dùng `randomBigInt(512)` để sinh `k`.
- `verify(...)` kiểm tra tính đúng đắn bằng công thức:
  - `w = s^-1 mod n`
  - `u1 = e * w mod n`
  - `u2 = r * w mod n`
  - `X = u1 * G + u2 * Q`
  - `valid` nếu `X.x mod n === r`

Ứng dụng hỗ trợ xuất chữ ký sang nhiều định dạng: Base64, hex, DER, và JSON `(r, s)`.

## 6. Hash functions trong ứng dụng

### SHA-512

- Dùng để băm message trong ECDSA.
- Dùng để dẫn xuất khóa đối xứng và khóa HMAC trong ECIES.
- Dùng `crypto.subtle.digest("SHA-512", data)`.

### SHA-256

- Dùng để băm mật khẩu đăng nhập trong `src/lib/localAuth.js`.
- Dùng để tính HMAC cho gói ciphertext ECIES thực tế.

### Ghi chú quan trọng

Mặc dù tài liệu giao diện có thể đề cập `HMAC-SHA-512`, thực tế mã thực hiện HMAC với `SHA-256` trong ECIES. Khóa HMAC vẫn được dẫn xuất từ SHA-512 của shared secret.

## 7. Mã hóa ECIES

Ứng dụng dùng một biến thể ECIES thuần JS với các bước:

1. Sinh khóa tạm thời `r` và tính điểm tạm thời `R = r * G`.
2. Tính shared secret `S = r * Q` với `Q` là khóa công khai của người nhận.
3. Dẫn xuất 64 byte từ `SHA-512(S.x)`.
4. Chia làm hai phần:
   - `encKey = first 32 bytes` → AES-256-CBC.
   - `macKey = last 32 bytes` → HMAC-SHA-256.
5. Mã hóa plaintext bằng `AES-CBC` với IV 16 byte ngẫu nhiên.
6. Tính MAC trên `IV || ciphertext`.
7. Kết quả đầu ra: `R || IV || ciphertext || mac`, sau đó mã hóa Base64.

### Ghi chú kỹ thuật

- `R` được mã hóa dạng public key không nén (uncompressed): `0x04 || x || y`.
- HMAC xác thực toàn vẹn ciphertext và IV.
- Khi giải mã, ứng dụng kiểm tra MAC trước khi giải mã AES, bảo vệ chống tấn công thay đổi dữ liệu.

## 8. Định dạng và chuyển đổi khóa

Ứng dụng hỗ trợ:

- PEM-like custom key format cho public/private brainpool.
- JWK (JSON Web Key) cho interoperable EC key exchange.
- Point uncompressed form: `0x04 || x || y`.
- Base64 URL-safe để lưu / truyền dữ liệu trong chuỗi.

Các hàm chuyển đổi chính nằm trong `src/lib/brainpool.js`:

- `publicKeyPemToJWK`
- `privateKeyPemToJWK`
- `jwkToPublicKeyPem`
- `jwkToPrivateKeyPem`

## 9. Bảo mật & giới hạn

### Ưu điểm

- Brainpool P-512 cung cấp độ an toàn cao hơn so với các đường cong 256-bit.
- Mã chạy offline và không phụ thuộc vào backend, nên dữ liệu khóa có thể được giữ trong trình duyệt.
- ECIES kết hợp cả mã hóa đối xứng và xác thực MAC.

### Giới hạn quan trọng

- Mã chưa có các bảo vệ side-channel, constant-time, hoặc hardening cho tấn công kênh rò rỉ.
- `localAuth.js` dùng SHA-256 cho mật khẩu mà không có salt hoặc PBKDF2, do đó chỉ phù hợp cho xác thực UI nội bộ, không phải là lưu trữ mật khẩu an toàn.
- AES-CBC không cung cấp tính duy nhất ngữ cảnh như GCM; bảo mật phụ thuộc vào MAC và IV ngẫu nhiên.
- Đường cong Brainpool ít phổ biến hơn NIST, nên tính tương thích với thư viện bên ngoài có thể hạn chế.
- Việc sử dụng nonce `k` ngẫu nhiên trong ECDSA mà không có deterministic RFC 6979 dễ bị yếu nếu RNG kém.

## 10. Các tệp mã nguồn liên quan

- `src/lib/brainpool.js` — triển khai toàn bộ ECC Brainpool P-512, sinh khóa, chữ ký, xác thực, ECIES, và chuyển đổi định dạng.
- `src/lib/localAuth.js` — xác thực người dùng nội bộ bằng SHA-256 và localStorage.
- `src/components/crypto/GenerateKeyModal.jsx` — UI hiển thị thông tin khóa Brainpool P-512 và thuật toán ECDSA + SHA-512.
- `src/components/crypto/EncryptPanel.jsx` / `DecryptPanel.jsx` — giao diện mã hóa/giải mã ECIES.
- `src/components/crypto/SignPanel.jsx` / `VerifyPanel.jsx` — giao diện ký và xác minh ECDSA.
- `src/pages/Report.jsx` — trang báo cáo trong ứng dụng mô tả lại các công nghệ và thuật toán.

## 11. Kết luận

Ứng dụng này là một bộ công cụ mật mã học minh họa cách kết hợp:

- ECC Brainpool P-512 cho khóa và chữ ký.
- SHA-512 cho băm và dẫn xuất khóa.
- AES-256-CBC + HMAC-SHA-256 cho mã hóa dữ liệu.

Tuy nhiên, đây là triển khai học thuật/demo; nếu muốn dùng trong sản phẩm thực, cần bổ sung bảo vệ an toàn, xác thực đầu cuối, quản lý khóa mạnh và tiêu chuẩn hóa định dạng.
