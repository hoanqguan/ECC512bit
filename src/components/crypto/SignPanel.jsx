import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, PenLine, Copy, CheckCircle2, FileUp, X, Download, Eye, EyeOff } from "lucide-react";
import { sign } from "@/lib/brainpool";
import { HistoryStore } from "@/lib/historyStore";
import { toast } from "sonner";

export default function SignPanel({ selectedKey }) {
  const [mode, setMode] = useState("text");
  const [message, setMessage] = useState("");
  const [file, setFile] = useState(null);
  const [fileBytes, setFileBytes] = useState(null);
  const [signature, setSignature] = useState("");
  const [loading, setLoading] = useState(false);
  const [blurred, setBlurred] = useState(true);
  const fileRef = useRef();

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setFileBytes(new Uint8Array(ev.target.result));
    reader.readAsArrayBuffer(f);
  };

  const clearFile = () => { setFile(null); setFileBytes(null); fileRef.current.value = ""; };

  const handleSign = async () => {
    if (!selectedKey) { toast.error("Select a key pair first"); return; }
    if (mode === "text" && !message.trim()) { toast.error("Enter a message to sign"); return; }
    if (mode === "file" && !fileBytes) { toast.error("Select a file to sign"); return; }
    setLoading(true);
    const data = mode === "text" ? message : fileBytes;
    const sig = await sign(data, selectedKey.private_key_pem);
    setSignature(sig);
    setBlurred(true);
    HistoryStore.add({
      type: "sign",
      keyName: selectedKey.name,
      mode,
      source: mode === "file" ? file.name : "text message",
    });
    setLoading(false);
    toast.success("Signed successfully");
  };

  const downloadSig = () => {
    const blob = new Blob([signature], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(mode === "file" ? file.name : "message").replace(/\.[^.]+$/, "")}.sig`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <PenLine className="w-4 h-4" />
          Sign
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Mode toggle */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg w-fit">
          <Button size="sm" variant={mode === "text" ? "default" : "ghost"} onClick={() => { setMode("text"); setSignature(""); }} className="h-6 px-3 text-xs">Text</Button>
          <Button size="sm" variant={mode === "file" ? "default" : "ghost"} onClick={() => { setMode("file"); setSignature(""); }} className="h-6 px-3 text-xs">File</Button>
        </div>

        {selectedKey ? (
          <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-lg">
            <CheckCircle2 className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">{selectedKey.name}</span>
            <Badge variant="outline" className="text-xs ml-auto">Active Key</Badge>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground italic">← Select a key pair from the list</p>
        )}

        {mode === "text" ? (
          <div>
            <Label className="text-xs font-medium">Message</Label>
            <Textarea
              placeholder="Enter the message to sign..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
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

        <Button onClick={handleSign} disabled={loading || !selectedKey} className="w-full">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PenLine className="w-4 h-4 mr-2" />}
          Sign {mode === "file" ? "File" : "Message"}
        </Button>

        {signature && (
          <div>
            <div className="flex justify-between items-center mb-1">
              <Label className="text-xs font-medium text-muted-foreground">SIGNATURE (base64)</Label>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setBlurred(!blurred)}>
                  {blurred ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(signature); toast.success("Copied"); }}>
                  <Copy className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={downloadSig}>
                  <Download className="w-3 h-3" />
                </Button>
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
                    <Eye className="w-3 h-3" /> Nhấn để hiện
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