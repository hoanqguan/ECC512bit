import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, CheckCircle2, XCircle, FileUp, X } from "lucide-react";
import { verify, signatureHexToBase64, signatureDERToBase64 } from "@/lib/brainpool";
import { HistoryStore } from "@/lib/historyStore";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export default function VerifyPanel({ selectedKey, showKeyList }) {
  const t = useT();
  const [mode, setMode] = useState("text"); // "text" | "file"
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [fileBytes, setFileBytes] = useState(null);
  const [signature, setSignature] = useState("");
  const [sigFormat, setSigFormat] = useState("hex");
  const [sigFileName, setSigFileName] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [manualPublic, setManualPublic] = useState("");
  const [warning, setWarning] = useState("");
  const fileRef = useRef();
  const sigRef = useRef();

  let effectivePubKey = selectedKey?.public_key_pem || manualPublic || "";

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setWarning("");
    const reader = new FileReader();
    reader.onload = (ev) => setFileBytes(new Uint8Array(ev.target.result));
    reader.readAsArrayBuffer(f);
  };

  const clearFile = () => { setFile(null); setFileBytes(null); fileRef.current.value = ""; setResult(null); };

  const handleSigFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setSigFileName(f.name);
    setWarning("");
    const reader = new FileReader();
    if (f.name.toLowerCase().endsWith('.der')) {
      reader.onload = (ev) => {
        const bytes = new Uint8Array(ev.target.result);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
        const b64 = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        setSignature(b64);
      };
      reader.readAsArrayBuffer(f);
    } else {
      reader.onload = (ev) => { setSignature(ev.target.result.trim()); setWarning(""); };
      reader.readAsText(f);
    }
  };

  const clearSigFile = () => { setSigFileName(null); setSignature(""); sigRef.current.value = ""; };

  const handleVerify = async () => {
    if (mode === "text" && !message.trim()) { setWarning(t('enterMessageToVerify')); toast.error(t('enterMessageToVerify')); return; }
    if (mode === "file" && !fileBytes) { setWarning(t('selectFileToVerify')); toast.error(t('selectFileToVerify')); return; }
    if (!signature.trim()) { setWarning(t('enterOrImportSignature')); toast.error(t('enterOrImportSignature')); return; }
    if (!effectivePubKey.trim()) { setWarning(t('selectPublicKeyOrPaste')); toast.error(t('selectPublicKeyOrPaste')); return; }
    setLoading(true);
    setWarning("");
    try {
      const data = mode === "text" ? message : fileBytes;
      // Convert signature to base64 r||s if needed
      let sigToVerify = signature.trim();
      if (sigFormat === "hex") sigToVerify = signatureHexToBase64(sigToVerify);
      else if (sigFormat === "der") sigToVerify = signatureDERToBase64(sigToVerify);
      const valid = await verify(data, sigToVerify, effectivePubKey.trim());
      setResult(valid);
      HistoryStore.add({
        type: "verify",
        keyName: selectedKey?.name ?? "manual key",
        mode,
        source: mode === "file" ? file?.name : "text message",
        detail: valid ? "✅ Valid" : "❌ Invalid",
      });
      toast.success(valid ? t('verifyValid') : t('verifyInvalid'));
    } catch (e) {
      setWarning(t('verifyInvalid'));
      toast.error(t('verifyInvalid') + (e?.message ? (": " + e.message) : ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          {t('verify')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!selectedKey && (
          <div className="mt-2">
            <Label className="text-xs font-medium">{t('insertPublicKeyVerify')}</Label>
            <Textarea placeholder={t('pastePublicKeyPlaceholder')} value={manualPublic} onChange={(e) => { setManualPublic(e.target.value); setWarning(""); }} className="mt-1 h-20 resize-none font-mono text-xs" />
          </div>
        )}
        {selectedKey ? (
          <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{selectedKey.name}</span>
          </div>
        ) : (
          <p className="text-sm text-destructive italic cursor-pointer" onClick={() => { if (typeof showKeyList === 'function') showKeyList(); }} title={t('clickToChooseFile')}>
            <span className="hidden sm:inline">←</span>
            <span className="inline sm:hidden">↑</span>
            {' '}{t('orSelectKeyPrompt')}
          </p>
        )}

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          <Button size="sm" variant={mode === "text" ? "default" : "ghost"} onClick={() => { setMode("text"); setResult(null); }} className="h-6 px-3 text-xs">{t('modeText')}</Button>
          <Button size="sm" variant={mode === "file" ? "default" : "ghost"} onClick={() => { setMode("file"); setResult(null); }} className="h-6 px-3 text-xs">{t('modeFile')}</Button>
        </div>

        {/* Message or File */}
        {mode === "text" ? (
          <div>
            <Label className="text-xs font-medium">{t('messageLabel')}</Label>
            <Textarea
              placeholder={t('enterMessageToVerify')}
              value={message}
              onChange={(e) => { setMessage(e.target.value); setWarning(""); }}
              className="mt-1 h-20 resize-none font-mono text-sm"
            />
          </div>
        ) : (
          <div>
            <Label className="text-xs font-medium">File gốc</Label>
            <div className="mt-1">
              {!file ? (
                <label className="flex flex-col items-center gap-2 border-2 border-dashed rounded-lg p-5 cursor-pointer hover:bg-muted/50 transition-colors">
                  <FileUp className="w-7 h-7 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click để chọn file cần xác minh</span>
                  <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} />
                </label>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                  <FileUp className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-medium truncate flex-1">{file.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={clearFile}><X className="w-3 h-3" /></Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Signature — paste or import .sig */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <Label className="text-xs font-medium">Signature ({sigFormat === "base64" ? "base64" : sigFormat === "hex" ? "hex" : "DER (base64)"})</Label>
            <div className="flex items-center gap-2">
              <select className="text-xs p-1 rounded border" value={sigFormat} onChange={(e) => setSigFormat(e.target.value)}>
                <option value="base64">Base64 (r||s)</option>
                <option value="hex">Hex</option>
                <option value="der">DER</option>
              </select>
              <label className="cursor-pointer">
                  <span className="text-xs text-primary underline underline-offset-2 hover:opacity-70">
                  {sigFileName ? `📎 ${sigFileName}` : t('enterOrImportSignature')}
                </span>
                <input ref={sigRef} type="file" accept=".sig,.txt,.der" className="hidden" onChange={handleSigFileChange} />
              </label>
              {sigFileName && (
                <Button variant="ghost" size="icon" className="h-5 w-5 ml-1" onClick={clearSigFile}><X className="w-3 h-3" /></Button>
              )}
            </div>
          </div>

            <Textarea
            placeholder={sigFormat === "hex" ? t('pasteHexSignature') || "Paste hex signature..." : sigFormat === "der" ? t('pasteDerSignature') || "Paste DER (base64) or import .der file..." : t('pasteBase64Signature') || "Paste the base64 signature, or import a .sig file above..."}
            value={signature}
            onChange={(e) => { setSignature(e.target.value); setSigFileName(null); setWarning(""); }}
            className="h-20 resize-none font-mono text-xs"
          />
        </div>

        <Button onClick={handleVerify} disabled={loading || !(selectedKey || manualPublic)} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
          {t('verifyButton')} {mode === "file" ? t('modeFile') : t('verify')}
        </Button>

        {warning && (
          <p className="text-xs text-destructive italic">{warning}</p>
        )}

        {result !== null && (
          <div className={`flex items-center gap-2 p-3 rounded-lg font-semibold text-sm ${result ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {result
              ? <><CheckCircle2 className="w-5 h-5" /> Signature is VALID</>
              : <><XCircle className="w-5 h-5" /> Signature is INVALID</>
            }
          </div>
        )}
      </CardContent>
    </Card>
  );
}