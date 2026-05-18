import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, PenLine, Copy, CheckCircle2, FileUp, X, Download, Eye, EyeOff } from "lucide-react";
import { sign, signatureBase64ToHex } from "@/lib/brainpool";
import { HistoryStore } from "@/lib/historyStore";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export default function SignPanel({ selectedKey, showKeyList }) {
  const t = useT();
  const [mode, setMode] = useState("text");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [fileBytes, setFileBytes] = useState(null);
  const [signature, setSignature] = useState("");
  const [base64Signature, setBase64Signature] = useState("");
  const [sigFormat, setSigFormat] = useState("base64");
  const [loading, setLoading] = useState(false);
  const [blurred, setBlurred] = useState(true);
  const [manualPrivate, setManualPrivate] = useState("");
  const [warning, setWarning] = useState("");
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setWarning("");
    const reader = new FileReader();
    reader.onload = (ev) => setFileBytes(new Uint8Array(ev.target.result));
    reader.readAsArrayBuffer(f);
  };

  const clearFile = () => { setFile(null); setFileBytes(null); fileRef.current.value = ""; setSignature(""); setBase64Signature(""); };

  const handleSign = async () => {
    const privatePem = selectedKey?.private_key_pem || manualPrivate;
    if (!privatePem) { setWarning(t('selectPrivateKeySignFirst')); toast.error(t('selectPrivateKeySignFirst')); return; }
    if (mode === "text" && !message.trim()) { setWarning(t('enterMessageToSign')); toast.error(t('enterMessageToSign')); return; }
    if (mode === "file" && !fileBytes) { setWarning(t('selectFileToSign')); toast.error(t('selectFileToSign')); return; }
    setLoading(true);
    setWarning("");
    try {
      const data = mode === "text" ? message : fileBytes;
      const sig = await sign(data, privatePem);
      // sig is base64 of r||s
      setBase64Signature(sig);
      if (sigFormat === "base64") setSignature(sig);
      else if (sigFormat === "hex") setSignature(signatureBase64ToHex(sig));
      setBlurred(true);
      HistoryStore.add({
        type: "sign",
        keyName: selectedKey?.name || "manual key",
        mode,
        source: mode === "file" ? file.name : "text message",
      });
      toast.success(t('signSuccess'));
    } catch (e) {
      setWarning(t('signFail'));
      toast.error(t('signFail') + (e?.message ? (": " + e.message) : ""));
    } finally {
      setLoading(false);
    }
  };

  const downloadSig = () => {
    const blob = new Blob([signature], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = (mode === "file" ? file.name : "message").replace(/\.[^.]+$/, "");
    const ext = sigFormat === "hex" ? ".hex" : ".sig";
    a.download = `${baseName}${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <PenLine className="w-4 h-4" />
          {t('sign')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!selectedKey && (
          <div className="mt-2">
            <Label className="text-xs font-medium">{t('insertPrivateKeySign')}</Label>
            <Textarea placeholder={t('pastePrivateKeyPlaceholder')} value={manualPrivate} onChange={(e) => { setManualPrivate(e.target.value); setSignature(""); setBase64Signature(""); setWarning(""); }} className="mt-1 h-20 resize-none font-mono text-xs" />
          </div>
        )}
        {selectedKey ? (
          <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{selectedKey.name}</span>
            <Badge variant="outline" className="text-xs ml-auto">{t('activeKey')}</Badge>
          </div>
        ) : (
          <p
            className="text-sm text-destructive italic cursor-pointer"
            onClick={() => { if (typeof showKeyList === 'function') showKeyList(); }}
            title={t('clickToChooseFile')}
          >
            <span className="hidden sm:inline">←</span>
            <span className="inline sm:hidden">↑</span>
            {' '}{t('orSelectKeyPrompt')}
          </p>
        )}

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          <Button size="sm" variant={mode === "text" ? "default" : "ghost"} onClick={() => { setMode("text"); setSignature(""); setBase64Signature(""); setWarning(""); }} className="h-6 px-3 text-xs">{t('modeText')}</Button>
          <Button size="sm" variant={mode === "file" ? "default" : "ghost"} onClick={() => { setMode("file"); setSignature(""); setBase64Signature(""); setWarning(""); }} className="h-6 px-3 text-xs">{t('modeFile')}</Button>
        </div>

        {mode === "text" ? (
          <div>
            <Label className="text-xs font-medium">{t('messageLabel')}</Label>
            <Textarea
              placeholder={t('enterMessageToSign')}
              value={message}
              onChange={(e) => { setMessage(e.target.value); setSignature(""); setBase64Signature(""); setWarning(""); }}
              className="mt-1 h-28 resize-none font-mono text-sm"
            />
          </div>
        ) : (
          <div>
            <Label className="text-xs font-medium">File</Label>
            <div className="mt-1">
              {!file ? (
                <label className="flex flex-col items-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                  <FileUp className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Click to select a file</span>
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

        <Button onClick={handleSign} disabled={loading || !(selectedKey || manualPrivate)} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PenLine className="w-4 h-4 mr-2" />}
          ECDSA (Brainpool P512) {t('signButton')} {mode === "file" ? t('modeFile') : t('modeText')}
        </Button>

        {warning && (
          <p className="text-xs text-destructive italic">{warning}</p>
        )}

        {signature && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label className="text-xs font-medium text-muted-foreground">SIGNATURE ({sigFormat === "base64" ? "base64" : "hex"})</Label>
              <div className="flex items-center gap-2">
                <select
                  className="text-xs p-1 rounded border"
                  value={sigFormat}
                  onChange={(e) => {
                    const newFormat = e.target.value;
                    setSigFormat(newFormat);
                    if (!base64Signature) {
                      setSignature("");
                      return;
                    }
                    if (newFormat === "base64") setSignature(base64Signature);
                    else if (newFormat === "hex") setSignature(signatureBase64ToHex(base64Signature));
                  }}
                >
                  <option value="base64">Base64 (r||s)</option>
                  <option value="hex">Hex</option>
                </select>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setBlurred(!blurred)}>
                    {blurred ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(signature); toast.success(t('copySuccess')); }}>
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={downloadSig}>
                    <Download className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="relative">
              <Textarea
                value={signature}
                readOnly
                className="text-xs font-mono h-24 resize-none bg-muted/50"
                style={blurred ? { filter: "blur(4px)", userSelect: "none" } : {}}
              />
              {blurred && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button size="sm" variant="outline" className="text-xs gap-1" onClick={() => setBlurred(false)}>
                    <Eye className="w-3 h-3" /> {t('revealBtn')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}