import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ShieldCheck, KeyRound, FileText, Lock, PenLine, ArrowLeft, Download } from "lucide-react";
import { Link } from "react-router-dom";

const Section = ({ title, children }) => (
  <section className="mb-8">
    <h2 className="text-xl font-bold text-foreground mb-4 pb-2 border-b">{title}</h2>
    {children}
  </section>
);

const ParamRow = ({ label, value, mono }) => (
  <tr className="border-b last:border-0">
    <td className="py-2 pr-4 text-sm font-medium text-muted-foreground w-40 align-top">{label}</td>
    <td className={`py-2 text-sm break-all ${mono ? "font-mono text-xs" : ""}`}>{value}</td>
  </tr>
);

export default function Report() {
  const handlePrint = () => window.print();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur sticky top-0 z-10 print:hidden">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Quay lại
            </Button>
          </Link>
          <Button onClick={handlePrint} size="sm" className="gap-2">
            <Download className="w-4 h-4" /> In / Xuất PDF
          </Button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-2">
        {/* Title */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center">
              <ShieldCheck className="w-9 h-9 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">Báo Cáo Kỹ Thuật</h1>
          <p className="text-lg text-muted-foreground">ECC Crypto Toolkit · Đường Cong Brainpool P-512</p>
          <div className="flex justify-center gap-2 mt-3">
            <Badge>ECDSA</Badge>
            <Badge variant="outline">SHA-512</Badge>
            <Badge variant="outline">ECIES</Badge>
            <Badge variant="outline">AES-256-CBC</Badge>
            <Badge variant="outline">HMAC-SHA-512</Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Ngày: {new Date().toLocaleDateString("vi-VN")}</p>
        </div>

        {/* 1. Giới thiệu */}
        <Section title="1. Giới Thiệu">
          <p className="text-sm text-foreground leading-relaxed">
            <strong>ECC Crypto Toolkit</strong> là ứng dụng mật mã học chạy hoàn toàn trên trình duyệt (offline-capable),
            không yêu cầu máy chủ backend. Toàn bộ khóa và phiên đăng nhập được lưu trữ cục bộ bằng{" "}
            <code className="bg-muted px-1 rounded text-xs">localStorage</code>, đảm bảo dữ liệu không rời khỏi thiết bị người dùng.
          </p>
          <p className="text-sm text-foreground leading-relaxed mt-3">
            Ứng dụng sử dụng đường cong elliptic <strong>Brainpool P-512</strong> — một tiêu chuẩn châu Âu được định nghĩa
            trong <strong>RFC 5639</strong> bởi BSI (Cơ quan An ninh Thông tin Liên bang Đức), được thiết kế minh bạch,
            không có "backdoor" tiềm ẩn như một số đường cong NIST.
          </p>
        </Section>

        {/* 2. Đường cong Brainpool P-512 */}
        <Section title="2. Đường Cong Elliptic Brainpool P-512">
          <p className="text-sm text-muted-foreground mb-4">
            Đường cong Weierstrass ngắn gọn: <code className="bg-muted px-1 rounded text-xs">y² ≡ x³ + ax + b (mod p)</code>
          </p>
          <Card>
            <CardContent className="p-4">
              <table className="w-full">
                <tbody>
                  <ParamRow label="Tên chuẩn" value="brainpoolP512r1 (RFC 5639)" />
                  <ParamRow label="Kích thước khóa" value="512-bit (tương đương ~256-bit AES / 15360-bit RSA)" />
                  <ParamRow label="Phần tử p (mod)" value="AADD9DB8DBE9C48B3FD4E6AE33C9FC07CB308DB3B3C9D20ED6639CCA703308717D4D9B009BC66842AECDA12AE6A380E62881FF2F2D82C68528AA6056583A48F3" mono />
                  <ParamRow label="Hệ số a" value="7830A3318B603B0A37C4888CA76B9FEBB2B71468D8BC6A0B6F6A7B7C7ECDC14B84C04BC4E4BCEECEE3A97F5B96C9A4A7BF5CA3B1B5E4C6B2AAFF5AD6A6C96CA" mono />
                  <ParamRow label="Generator G" value="(x, y) định nghĩa trong RFC 5639 §3.6" />
                  <ParamRow label="Bậc n" value="AADD9DB8DBE9C48B3FD4E6AE33C9FC07CB308DB3B3C9D20ED6639CCA70330870553E5C414CA92619418661197FAC10471DB1D381085DDADDB58796829CA90069" mono />
                  <ParamRow label="Cofactor h" value="1" />
                  <ParamRow label="Nguồn gốc" value="RFC 5639 - BSI (Đức) - 2010" />
                  <ParamRow label="Lý do chọn" value="Không phải NIST, không có nghi vấn backdoor, được kiểm định độc lập" />
                </tbody>
              </table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm text-green-800">Ưu điểm</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
                  <li>Bảo mật 256-bit (quantum-resistant hơn P-256)</li>
                  <li>Thiết kế minh bạch, tham số không tùy tiện</li>
                  <li>Được BSI Đức và EU khuyến nghị</li>
                  <li>Hiệu năng tốt hơn RSA-15360 cùng mức bảo mật</li>
                  <li>Không phụ thuộc Web Crypto API (hoàn toàn custom)</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-amber-200 bg-amber-50">
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm text-amber-800">Hạn chế</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ul className="text-sm text-amber-700 space-y-1 list-disc list-inside">
                  <li>Không được Web Crypto API hỗ trợ native</li>
                  <li>Chậm hơn P-256/P-384 (do BigInt JS)</li>
                  <li>Ít thư viện hỗ trợ hơn so với NIST curves</li>
                  <li>Chưa chứng minh kháng lượng tử hoàn toàn</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </Section>

        {/* 3. Thuật toán chữ ký */}
        <Section title="3. Chữ Ký Số ECDSA + SHA-512">
          <p className="text-sm text-muted-foreground mb-4">
            Ứng dụng sử dụng ECDSA (Elliptic Curve Digital Signature Algorithm) với hàm băm SHA-512.
          </p>
          <div className="space-y-3">
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2"><PenLine className="w-4 h-4" /> Quy trình Ký (Sign)</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 text-sm space-y-1">
                <p>1. Tính <code className="bg-muted px-1 rounded text-xs">e = SHA-512(message)</code></p>
                <p>2. Chọn số ngẫu nhiên <code className="bg-muted px-1 rounded text-xs">k ∈ [1, n-1]</code></p>
                <p>3. Tính điểm <code className="bg-muted px-1 rounded text-xs">R = k·G</code>, lấy <code className="bg-muted px-1 rounded text-xs">r = R.x mod n</code></p>
                <p>4. Tính <code className="bg-muted px-1 rounded text-xs">s = k⁻¹(e + r·privKey) mod n</code></p>
                <p>5. Chữ ký = <code className="bg-muted px-1 rounded text-xs">(r, s)</code> encode Base64</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Quy trình Xác minh (Verify)</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 text-sm space-y-1">
                <p>1. Parse <code className="bg-muted px-1 rounded text-xs">(r, s)</code> từ chữ ký Base64</p>
                <p>2. Tính <code className="bg-muted px-1 rounded text-xs">e = SHA-512(message)</code></p>
                <p>3. Tính <code className="bg-muted px-1 rounded text-xs">w = s⁻¹ mod n</code></p>
                <p>4. Tính <code className="bg-muted px-1 rounded text-xs">u1 = e·w mod n</code>, <code className="bg-muted px-1 rounded text-xs">u2 = r·w mod n</code></p>
                <p>5. Tính <code className="bg-muted px-1 rounded text-xs">P = u1·G + u2·Q</code></p>
                <p>6. Hợp lệ nếu <code className="bg-muted px-1 rounded text-xs">P.x mod n == r</code></p>
              </CardContent>
            </Card>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            * Hỗ trợ ký cả văn bản (UTF-8) và file nhị phân (Uint8Array).
          </p>
        </Section>

        {/* 4. Mã hóa ECIES */}
        <Section title="4. Mã Hóa ECIES (AES-256-CBC + HMAC-SHA-512)">
          <p className="text-sm text-muted-foreground mb-4">
            ECIES (Elliptic Curve Integrated Encryption Scheme) kết hợp trao đổi khóa ECDH với mã hóa đối xứng AES và xác thực HMAC.
          </p>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><Lock className="w-4 h-4" /> Quy trình Mã hóa</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 text-sm space-y-1">
              <p>1. Tạo cặp khóa tạm thời <code className="bg-muted px-1 rounded text-xs">(r, R = r·G)</code></p>
              <p>2. Tính shared secret: <code className="bg-muted px-1 rounded text-xs">S = r · recipientPublicKey</code></p>
              <p>3. Derive keys: <code className="bg-muted px-1 rounded text-xs">SHA-512(S.x) → k_enc (32 bytes) + k_mac (32 bytes)</code></p>
              <p>4. Mã hóa: <code className="bg-muted px-1 rounded text-xs">ciphertext = AES-256-CBC(k_enc, IV, plaintext)</code></p>
              <p>5. Xác thực: <code className="bg-muted px-1 rounded text-xs">tag = HMAC-SHA-512(k_mac, IV || ciphertext)</code></p>
              <p>6. Output: <code className="bg-muted px-1 rounded text-xs">Base64(R || IV || tag || ciphertext)</code></p>
            </CardContent>
          </Card>
          <Card className="mt-3">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2"><KeyRound className="w-4 h-4" /> Quy trình Giải mã</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 text-sm space-y-1">
              <p>1. Parse <code className="bg-muted px-1 rounded text-xs">R, IV, tag, ciphertext</code> từ Base64</p>
              <p>2. Tính <code className="bg-muted px-1 rounded text-xs">S = privateKey · R</code></p>
              <p>3. Derive <code className="bg-muted px-1 rounded text-xs">k_enc, k_mac</code> từ SHA-512(S.x)</p>
              <p>4. Kiểm tra HMAC-tag — từ chối nếu không khớp</p>
              <p>5. Giải mã <code className="bg-muted px-1 rounded text-xs">AES-256-CBC(k_enc, IV, ciphertext)</code></p>
            </CardContent>
          </Card>
        </Section>

        {/* 5. Kiến trúc ứng dụng */}
        <Section title="5. Kiến Trúc Ứng Dụng">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: <ShieldCheck className="w-4 h-4" />, title: "Offline-first", desc: "No server required — keys and state stored locally in localStorage." },
              { icon: <KeyRound className="w-4 h-4" />, title: "Lưu trữ khóa", desc: "lib/localKeyStore.js — CRUD key pairs trong localStorage, mỗi khóa có id, timestamp, fingerprint." },
              { icon: <Lock className="w-4 h-4" />, title: "Thư viện mật mã", desc: "lib/brainpool.js — thuần JavaScript, BigInt, không dependency, chạy offline hoàn toàn." },
              { icon: <FileText className="w-4 h-4" />, title: "Hỗ trợ file", desc: "Sign/Verify hỗ trợ văn bản và file nhị phân. Encrypt/Decrypt xử lý chuỗi Base64." },
            ].map((item, i) => (
              <Card key={i}>
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm flex items-center gap-2">{item.icon}{item.title}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="mt-4">
            <CardContent className="p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Stack công nghệ</p>
              <div className="flex flex-wrap gap-2">
                {["React 18", "Vite", "Tailwind CSS", "shadcn/ui", "BigInt (native)", "Web Crypto API (SHA-512)", "localStorage", "React Router v6"].map(t => (
                  <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* 6. Bảo mật */}
        <Section title="6. Đánh Giá Bảo Mật">
          <div className="space-y-3 text-sm">
            <div className="flex gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-600 font-bold shrink-0">✓</span>
              <div><strong>Không rời thiết bị:</strong> Khóa riêng tư không bao giờ được gửi đến server. Tất cả tính toán xảy ra trong tab trình duyệt.</div>
            </div>
            <div className="flex gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-600 font-bold shrink-0">✓</span>
              <div><strong>HMAC integrity:</strong> ECIES có xác thực HMAC-SHA-512, chống giả mạo và tampering ciphertext.</div>
            </div>
            <div className="flex gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <span className="text-green-600 font-bold shrink-0">✓</span>
              <div><strong>IV ngẫu nhiên:</strong> Mỗi lần mã hóa dùng IV 16 byte ngẫu nhiên từ <code className="bg-muted px-1 rounded">crypto.getRandomValues()</code>.</div>
            </div>
            <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-amber-600 font-bold shrink-0">!</span>
              <div><strong>Khóa không mã hóa lúc lưu:</strong> Private key PEM lưu plaintext trong localStorage. Người dùng nên bảo vệ thiết bị bằng mật khẩu OS.</div>
            </div>
            <div className="flex gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <span className="text-amber-600 font-bold shrink-0">!</span>
              <div><strong>Mật khẩu login SHA-256:</strong> Mật khẩu đăng nhập hash SHA-256 (không có salt). Đây là xác thực UI, không phải bảo vệ khóa.</div>
            </div>
          </div>
        </Section>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pt-6 border-t">
          <p>ECC Crypto Toolkit · Báo cáo được tạo tự động · {new Date().toLocaleDateString("vi-VN")}</p>
          <p className="mt-1">Tài liệu tham khảo: RFC 5639 · NIST SP 800-56A · IEEE 1363-2000</p>
        </div>
      </div>
    </div>
  );
}