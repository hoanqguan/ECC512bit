import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, ShieldCheck, CheckCircle2, XCircle, FileUp, X } from "lucide-react";
import { verify } from "@/lib/brainpool";
import { HistoryStore } from "@/lib/historyStore";
import { toast } from "sonner";

export default function VerifyPanel({ selectedKey }) {
  const [mode, setMode] = useState("text"); // "text" | "file"
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [fileBytes, setFileBytes] = useState(null);
  const [signature, setSignature] = useState("");
  const [sigFileName, setSigFileName] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef();
  const sigRef = useRef();

  const effectivePubKey = selectedKey?.public_key_pem ?? "";

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    const reader = new FileReader();
    reader.onload = (ev) => setFileBytes(new Uint8Array(ev.target.result));
    reader.readAsArrayBuffer(f);
  };

  const clearFile = () => { setFile(null); setFileBytes(null); fileRef.current.value = ""; setResult(null); };

  const handleSigFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setSigFileName(f.name);
    const reader = new FileReader();
    reader.onload = (ev) => setSignature(ev.target.result.trim());
    reader.readAsText(f);
  };

  const clearSigFile = () => { setSigFileName(null); setSignature(""); sigRef.current.value = ""; };

  const handleVerify = async () => {
    if (mode === "text" && !message.trim()) { toast.error("Enter a message"); return; }
    if (mode === "file" && !fileBytes) { toast.error("Select a file to verify"); return; }
    if (!signature.trim()) { toast.error("Enter or import a signature"); return; }
    if (!effectivePubKey.trim()) { toast.error("Select a key pair first"); return; }
    setLoading(true);
    const data = mode === "text" ? message : fileBytes;
    const valid = await verify(data, signature.trim(), effectivePubKey.trim());
    setResult(valid);
    HistoryStore.add({
      type: "verify",
      keyName: selectedKey?.name ?? "manual key",
      mode,
      source: mode === "file" ? file?.name : "text message",
      detail: valid ? "✅ Valid" : "❌ Invalid",
    });
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          Verify Signature
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {selectedKey ? (
          <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{selectedKey.name}</span>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">← Select a key pair from the list</p>
        )}

        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          <Button size="sm" variant={mode === "text" ? "default" : "ghost"} onClick={() => { setMode("text"); setResult(null); }} className="h-6 px-3 text-xs">Text</Button>
          <Button size="sm" variant={mode === "file" ? "default" : "ghost"} onClick={() => { setMode("file"); setResult(null); }} className="h-6 px-3 text-xs">File</Button>
        </div>

        {/* Message or File */}
        {mode === "text" ? (
          <div>
            <Label className="text-xs font-medium">Message</Label>
            <Textarea
              placeholder="Original message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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
            <Label className="text-xs font-medium">Signature (base64)</Label>
            <label className="cursor-pointer">
              <span className="text-xs text-primary underline underline-offset-2 hover:opacity-70">
                {sigFileName ? `📎 ${sigFileName}` : "Import .sig file"}
              </span>
              <input ref={sigRef} type="file" accept=".sig,.txt" className="hidden" onChange={handleSigFileChange} />
            </label>
            {sigFileName && (
              <Button variant="ghost" size="icon" className="h-5 w-5 ml-1" onClick={clearSigFile}><X className="w-3 h-3" /></Button>
            )}
          </div>
          <Textarea
            placeholder="Paste the base64 signature, or import a .sig file above..."
            value={signature}
            onChange={(e) => { setSignature(e.target.value); setSigFileName(null); }}
            className="h-20 resize-none font-mono text-xs"
          />
        </div>

        <Button onClick={handleVerify} disabled={loading} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
          Verify {mode === "file" ? "File" : "Signature"}
        </Button>

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