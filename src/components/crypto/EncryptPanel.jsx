import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Lock, Copy, CheckCircle2, Download, Eye, EyeOff, FileUp, X } from "lucide-react";
import { encrypt, encryptBytes } from "@/lib/brainpool";
import { HistoryStore } from "@/lib/historyStore";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

function FileDropZone({ file, fileRef, onFileChange, onClear, t }) {
  return !file ? (
    <label className="flex flex-col items-center gap-2 border-2 border-dashed rounded-lg p-5 cursor-pointer hover:bg-muted/50 transition-colors">
      <FileUp className="w-7 h-7 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">{t('clickToChooseFile')}</span>
      <input ref={fileRef} type="file" className="hidden" onChange={onFileChange} />
    </label>
  ) : (
    <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
      <FileUp className="w-4 h-4 text-primary shrink-0" />
      <span className="text-sm font-medium truncate flex-1">{file.name}</span>
      <span className="text-xs text-muted-foreground shrink-0">{(file.size / 1024).toFixed(1)} KB</span>
      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={onClear}><X className="w-3 h-3" /></Button>
    </div>
  );
}

export default function EncryptPanel({ selectedKey, showKeyList }) {
  const t = useT();
  const [mode, setMode] = useState("text"); // "text" | "file"
  const [plaintext, setPlaintext] = useState("");
  const [file, setFile] = useState(null);
  const [fileBytes, setFileBytes] = useState(null);
  const [ciphertext, setCiphertext] = useState("");
  const [loading, setLoading] = useState(false);
  const [blurred, setBlurred] = useState(true);
  const [manualPublic, setManualPublic] = useState("");
  const [warning, setWarning] = useState("");
  const fileRef = useRef();

  const switchMode = (m) => { setMode(m); setCiphertext(""); setFile(null); setFileBytes(null); setPlaintext(""); setWarning(""); };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setWarning("");
    const reader = new FileReader();
    reader.onload = (ev) => setFileBytes(new Uint8Array(ev.target.result));
    reader.readAsArrayBuffer(f);
  };

  const clearFile = () => { setFile(null); setFileBytes(null); fileRef.current.value = ""; setCiphertext(""); };

  const handleEncrypt = async () => {
    const publicPem = selectedKey?.public_key_pem || manualPublic;
    if (!publicPem) { setWarning(t('selectPublicKeyFirst')); toast.error(t('selectPublicKeyFirst')); return; }
    if (mode === "text" && !plaintext.trim()) { setWarning(t('enterPlaintext')); toast.error(t('enterPlaintext')); return; }
    if (mode === "file" && !fileBytes) { setWarning(t('selectFileToEncrypt')); toast.error(t('selectFileToEncrypt')); return; }
    setLoading(true);
    setWarning("");
    try {
      const ct = mode === "text"
        ? await encrypt(plaintext, publicPem)
        : await encryptBytes(fileBytes, publicPem);
      setCiphertext(ct);
      setBlurred(true);
      HistoryStore.add({
        type: "encrypt",
        keyName: selectedKey?.name || "manual key",
        mode,
        source: mode === "file" ? file?.name : "text message",
      });
      toast.success(t('encryptSuccess'));
    } catch (e) {
      setWarning(t('encryptFail'));
      toast.error(t('encryptFail') + (e?.message ? (": " + e.message) : ""));
    } finally {
      setLoading(false);
    }
  };

  const downloadJson = () => {
    const obj = {
      algorithm: "ECIES-BrainpoolP512r1-AES256CBC-HMACSHA512",
      keyFingerprint: selectedKey?.fingerprint || "manual-key",
      sourceType: mode,
      sourceFileName: mode === "file" ? file?.name : undefined,
      ciphertext,
      createdAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const baseName = mode === "file" ? file?.name || "file" : "message";
    a.download = `${baseName}.enc.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Lock className="w-4 h-4" />
          Encrypt
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!selectedKey && (
          <div className="mt-2">
            <Label className="text-xs font-medium">{t('insertPublicKey')}</Label>
            <Textarea placeholder={t('pastePublicKeyPlaceholder')} value={manualPublic} onChange={(e) => { setManualPublic(e.target.value); setWarning(""); }} className="mt-1 h-20 resize-none font-mono text-xs" />
          </div>
        )}
        {selectedKey ? (
          <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{selectedKey.name}</span>
            <Badge variant="outline" className="text-xs ml-auto">{t('activeKey')}</Badge>
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
          <Button size="sm" variant={mode === "text" ? "default" : "ghost"} onClick={() => switchMode("text")} className="h-6 px-3 text-xs">{t('modeText')}</Button>
          <Button size="sm" variant={mode === "file" ? "default" : "ghost"} onClick={() => switchMode("file")} className="h-6 px-3 text-xs">{t('modeFile')}</Button>
        </div>

        {mode === "text" ? (
          <div>
            <Label className="text-xs font-medium">{t('plaintext')}</Label>
            <Textarea
              placeholder={t('enterMessagePlaceholder')}
              value={plaintext}
              onChange={(e) => { setPlaintext(e.target.value); setWarning(""); }}
              className="mt-1 h-28 resize-none font-mono text-sm"
            />
          </div>
        ) : (
          <div>
            <Label className="text-xs font-medium">File</Label>
            <div className="mt-1">
              <FileDropZone file={file} fileRef={fileRef} onFileChange={handleFileChange} onClear={clearFile} t={t} />
            </div>
          </div>
        )}

        <Button onClick={handleEncrypt} disabled={loading || !(selectedKey || manualPublic)} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
         {t('encryptButton')} {mode === "file" ? t('modeFile') : t('modeText')} (ECIES)
        </Button>

        {warning && (
          <p className="text-xs text-destructive italic">{warning}</p>
        )}

        {ciphertext && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label className="text-xs font-medium text-muted-foreground">{t('ciphertextLabel')}</Label>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setBlurred(!blurred)}>
                  {blurred ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(ciphertext); toast.success(t('copySuccess')); }}>
                  <Copy className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" title={t('downloadEncJsonTitle')} onClick={downloadJson}>
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <div className="relative">
              <Textarea
                value={ciphertext}
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
            <p className="text-xs text-muted-foreground mt-1">{t('downloadCiphertextNote')}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}