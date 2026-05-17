import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, Unlock, Copy, CheckCircle2, Download, FileUp, X, Eye, EyeOff } from "lucide-react";
import { decrypt, decryptToBytes } from "@/lib/brainpool";
import { HistoryStore } from "@/lib/historyStore";
import { toast } from "sonner";
import { useT } from "@/lib/i18n";

export default function DecryptPanel({ selectedKey, showKeyList }) {
  const t = useT();
  const [mode, setMode] = useState("text"); // "text" | "file"
  const [ciphertext, setCiphertext] = useState("");
  const [plaintext, setPlaintext] = useState("");
  const [decryptedBytes, setDecryptedBytes] = useState(null);
  const [decryptedFileName, setDecryptedFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [blurred, setBlurred] = useState(true);
  const [manualPrivate, setManualPrivate] = useState("");
  const [importedFile, setImportedFile] = useState(null);
  const [warning, setWarning] = useState("");
  const jsonRef = useRef();

  const switchMode = (m) => {
    setMode(m);
    setCiphertext(""); setPlaintext(""); setDecryptedBytes(null);
    setImportedFile(null);
    setWarning("");
  };

  const handleImportJson = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setImportedFile(f.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const obj = JSON.parse(ev.target.result);
        if (obj.ciphertext) {
          setCiphertext(obj.ciphertext);
          setWarning("");
          // Remember original file name for download
          if (obj.sourceFileName) setDecryptedFileName(obj.sourceFileName);
          toast.success(t('importedEncJsonSuccess'));
        } else {
          toast.error(t('invalidJsonMissingCiphertext'));
        }
      } catch { toast.error(t('invalidFile')); }
    };
    reader.readAsText(f);
  };

  const clearImport = () => { setImportedFile(null); setCiphertext(""); jsonRef.current.value = ""; };

  const handleDecrypt = async () => {
    const privatePem = selectedKey?.private_key_pem || manualPrivate;
    if (!privatePem) { setWarning(t('selectPrivateKeyFirst')); toast.error(t('selectPrivateKeyFirst')); return; }
    if (mode === "file" && !ciphertext.trim()) { setWarning(t('selectEncJsonFirst')); toast.error(t('selectEncJsonFirst')); return; }
    if (mode === "text" && !ciphertext.trim()) { setWarning(t('pasteCiphertextToDecrypt')); toast.error(t('pasteCiphertextToDecrypt')); return; }
    setLoading(true);
    setWarning("");
    try {
      if (mode === "file") {
        const bytes = await decryptToBytes(ciphertext.trim(), privatePem);
        setDecryptedBytes(bytes);
        setPlaintext("");
      } else {
        const result = await decrypt(ciphertext.trim(), privatePem);
        setPlaintext(result);
        setDecryptedBytes(null);
      }
      HistoryStore.add({
        type: "decrypt",
        keyName: selectedKey?.name || "manual key",
        mode,
        source: mode === "file" ? (importedFile ?? "file") : "text ciphertext",
      });
      toast.success(t('decryptSuccess'));
    } catch (e) {
      setWarning(t('decryptFail'));
      toast.error(t('decryptFail') + (e?.message ? (": " + e.message) : ""));
    } finally {
      setLoading(false);
    }
  };

  const downloadPlaintext = () => {
    const blob = new Blob([plaintext], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `decrypted_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadFile = () => {
    const blob = new Blob([decryptedBytes]);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = decryptedFileName || `decrypted_${Date.now()}.bin`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
          <Unlock className="w-4 h-4" />
          {t('decrypt')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!selectedKey && (
          <div className="mt-2">
            <Label className="text-xs font-medium">{t('insertPrivateKey')}</Label>
            <Textarea placeholder={t('pastePrivateKeyPlaceholder')} value={manualPrivate} onChange={(e) => { setManualPrivate(e.target.value); setWarning(""); }} className="mt-1 h-20 resize-none font-mono text-xs" />
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

        {mode === "file" ? (
          /* File mode: chọn .enc.json */
          <div>
            <Label className="text-xs font-medium">File <code>.enc.json</code></Label>
            <div className="mt-1">
              {!importedFile ? (
                <label className="flex flex-col items-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-muted/50 transition-colors">
                  <FileUp className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{t('clickToChooseFile')} <code>.enc.json</code></span>
                  <input ref={jsonRef} type="file" accept=".json" className="hidden" onChange={handleImportJson} />
                </label>
              ) : (
                <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg border">
                  <FileUp className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-sm font-medium truncate flex-1">{importedFile}</span>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={clearImport}><X className="w-3 h-3" /></Button>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Text mode: paste ciphertext */
          <div>
            <Label className="text-xs font-medium">{t('ciphertextLabel')}</Label>
            <Textarea
              placeholder={t('pasteCiphertextToDecrypt')}
              value={ciphertext}
              onChange={(e) => { setCiphertext(e.target.value); setWarning(""); }}
              className="mt-1 h-28 resize-none font-mono text-xs"
            />
          </div>
        )}

        <Button onClick={handleDecrypt} disabled={loading || !(selectedKey || manualPrivate)} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Unlock className="w-4 h-4 mr-2" />}
          {t('decryptButton')} {mode === "file" ? t('modeFile') : t('modeText')} (ECIES)
        </Button>

        {warning && (
          <p className="text-xs text-destructive italic">{warning}</p>
        )}

        {/* Text result */}
        {plaintext && mode === "text" && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label className="text-xs font-medium text-muted-foreground">PLAINTEXT</Label>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setBlurred(!blurred)} title={blurred ? "Show" : "Hide"}>
                  {blurred ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(plaintext); toast.success(t('copySuccess')); }}>
                  <Copy className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" title="Tải về .txt" onClick={downloadPlaintext}>
                  <Download className="w-3 h-3" />
                </Button>
              </div>
            </div>
            <Textarea value={plaintext} readOnly className={`text-xs font-mono h-24 resize-none bg-muted/50 ${blurred ? "blur-sm" : ""}`} />
          </div>
        )}

        {/* File result */}
        {decryptedBytes && mode === "file" && (
          <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-green-700">Giải mã thành công</p>
              <p className="text-xs text-green-600">{decryptedFileName || "file"} · {(decryptedBytes.length / 1024).toFixed(1)} KB</p>
            </div>
            <Button size="sm" variant="outline" className="gap-1.5 shrink-0 border-green-300 text-green-700 hover:bg-green-100" onClick={downloadFile}>
              <Download className="w-3.5 h-3.5" />
              Tải về
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}