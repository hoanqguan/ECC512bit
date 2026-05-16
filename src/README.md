# ECC Crypto Toolkit

Ứng dụng mật mã học Brainpool P-512 chạy hoàn toàn offline, không cần backend.

## Chạy Local (VS Code)

### Yêu cầu
- **Node.js** v18+ → https://nodejs.org
- **VS Code** (khuyến nghị extension: ESLint, Prettier)

### Các bước

```bash
# 1. Giải nén / clone project vào thư mục
cd ecc-crypto-toolkit

# 2. Cài dependencies
npm install

# 3. Chạy dev server
npm run dev
```

Mở trình duyệt tại: **http://localhost:5173**

### Build production

```bash
npm run build
# Output: thư mục dist/
# Serve: npx serve dist
```

## Lưu ý

- Toàn bộ khóa và tài khoản lưu trong **localStorage** của trình duyệt
- Không có server, không cần internet sau khi `npm install`
- Xóa localStorage = mất toàn bộ khóa → hãy backup PEM thủ công