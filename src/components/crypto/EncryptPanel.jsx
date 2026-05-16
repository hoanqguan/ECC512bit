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

function FileDropZone({ file, fileRef, onFileChange, onClear }) {
  return !file ? (
    <label className="flex flex-col items-center gap-2 border-2 border-dashed rounded-lg p-5 cursor-pointer hover:bg-muted/50 transition-colors">
      <FileUp className="w-7 h-7 text-muted-foreground" />
      <span className="text-sm text-muted-foreground">Click để chọn file</span>
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

export default function EncryptPanel({ selectedKey }) {
  const [mode, setMode] = useState("text"); // "text" | "file"
  const [plaintext, setPlaintext] = useState("");
  const [file, setFile] = useState(null);
  const [fileBytes, setFileBytes] = useState(null);
  const [ciphertext, setCiphertext] = useState("");
  const [loading, setLoading] = useState(false);
  const [blurred, setBlurred] = useState(true);
  const fileRef = useRef();

  const switchMode = (m) => { setMode(m); setCiphertext(""); setFile(null); setFileBytes(null); setPlaintext(""); };

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setFileBytes(new Uint8Array(ev.target.result));
    reader.readAsArrayBuffer(f);
  };

  const clearFile = () => { setFile(null); setFileBytes(null); fileRef.current.value = ""; setCiphertext(""); };

  const handleEncrypt = async () => {
    if (!selectedKey) { toast.error("Select a key pair first"); return; }
    if (mode === "text" && !plaintext.trim()) { toast.error("Enter a message to encrypt"); return; }
    if (mode === "file" && !fileBytes) { toast.error("Select a file to encrypt"); return; }
    setLoading(true);
    const ct = mode === "text"
      ? await encrypt(plaintext, selectedKey.public_key_pem)
      : await encryptBytes(fileBytes, selectedKey.public_key_pem);
    setCiphertext(ct);
    setBlurred(true);
    HistoryStore.add({
      type: "encrypt",
      keyName: selectedKey.name,
      mode,
      source: mode === "file" ? file?.name : "text message",
    });
    setLoading(false);
    toast.success("Encrypted successfully");
  };

  const downloadJson = () => {
    const obj = {
      algorithm: "ECIES-BrainpoolP512r1-AES256CBC-HMACSHA512",
      keyFingerprint: selectedKey?.fingerprint || "",
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
        {selectedKey ? (
          <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{selectedKey.name}</span>
            <Badge variant="outline" className="text-xs ml-auto">Active Key</Badge>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">← Select a key pair from the list</p>
        )}

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          <Button size="sm" variant={mode === "text" ? "default" : "ghost"} onClick={() => switchMode("text")} className="h-6 px-3 text-xs">Text</Button>
          <Button size="sm" variant={mode === "file" ? "default" : "ghost"} onClick={() => switchMode("file")} className="h-6 px-3 text-xs">File</Button>
        </div>

        {mode === "text" ? (
          <div>
            <Label className="text-xs font-medium">Plaintext</Label>
            <Textarea
              placeholder="Enter the message to encrypt..."
              value={plaintext}
              onChange={(e) => setPlaintext(e.target.value)}
              className="mt-1 h-28 resize-none font-mono text-sm"
            />
          </div>
        ) : (
          <div>
            <Label className="text-xs font-medium">File</Label>
            <div className="mt-1">
              <FileDropZone file={file} fileRef={fileRef} onFileChange={handleFileChange} onClear={clearFile} />
            </div>
          </div>
        )}

        <Button onClick={handleEncrypt} disabled={loading || !selectedKey} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
          Encrypt {mode === "file" ? "File" : "Message"} (ECIES)
        </Button>

        {ciphertext && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label className="text-xs font-medium text-muted-foreground">CIPHERTEXT (base64)</Label>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setBlurred(!blurred)}>
                  {blurred ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(ciphertext); toast.success("Copied"); }}>
                  <Copy className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" title="Tải về .enc.json" onClick={downloadJson}>
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
                    <Eye className="w-3 h-3" /> Nhấn để hiện
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Nút <Download className="w-3 h-3 inline mx-0.5" /> tải về file <code>.enc.json</code> chứa ciphertext.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}