import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Key } from "lucide-react";
import { generateAndExportKeyPair, computeFingerprint } from "@/lib/brainpool";
import { KeyStore } from "@/lib/localKeyStore";
import { HistoryStore } from "@/lib/historyStore";
import { toast } from "sonner";

export default function GenerateKeyModal({ open, onClose, onGenerated }) {
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [autoDownload, setAutoDownload] = useState(false);

  const handleGenerate = async () => {
    const trimmed = name.trim().slice(0, 12);
    if (!trimmed) { toast.error("Please enter a key name"); return; }
    setLoading(true);
    try {
      const { privateKeyPem, publicKeyPem } = generateAndExportKeyPair();
      const fingerprint = await computeFingerprint(publicKeyPem);
      KeyStore.create({
        name: trimmed,
        curve: "brainpoolP512r1",
        public_key_pem: publicKeyPem,
        private_key_pem: privateKeyPem,
        fingerprint,
        notes: notes.trim(),
      });
      // Export as JWK only if the user opted in
      if (autoDownload) {
        try {
          const { publicKeyPemToJWK, privateKeyPemToJWK } = await import("@/lib/brainpool");
          const pubJwk = publicKeyPemToJWK(publicKeyPem);
          const privJwk = privateKeyPemToJWK(privateKeyPem);
          const exportData = {
            name: trimmed,
            curve: "brainpoolP512r1",
            format: "jwk",
            public_jwk: pubJwk,
            private_jwk: privJwk,
            fingerprint,
            notes: notes.trim(),
            generated_at: new Date().toISOString(),
          };
          const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${trimmed.replace(/\s+/g, "_")}_keypair.json`;
          a.click();
          URL.revokeObjectURL(url);
        } catch (e) {
          // non-fatal
        }
      }
      HistoryStore.add({ type: "keygen", source: trimmed, detail: "Brainpool P-512" });
      toast.success("Key pair generated and saved");
      setName(""); setNotes("");
      onGenerated();
      onClose();
    } catch (e) {
      toast.error("Failed to generate key pair: " + (e?.message || e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            Generate New Key Pair
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label htmlFor="keyname">Key Name <span className="text-destructive">*</span></Label>
            <Input
              id="keyname"
              placeholder="e.g. Production Signing Key"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={12}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="keynotes">Notes (optional)</Label>
            <Textarea
              id="keynotes"
              placeholder="What is this key used for?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="mt-1 h-20 resize-none"
            />
          </div>
          <div className="flex flex-col gap-2 text-xs text-muted-foreground p-2 bg-muted/40 rounded">
            <p>📋 Key pair will be saved locally.</p>
            <label className="inline-flex items-center gap-2">
              <input type="checkbox" checked={autoDownload} onChange={(e) => setAutoDownload(e.target.checked)} />
              <span>Automatically download JWK export after generation</span>
            </label>
          </div>
          <div className="bg-muted/60 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
            <p><span className="font-semibold">Curve:</span> Brainpool P-512 (brainpoolP512r1)</p>
            <p><span className="font-semibold">Key size:</span> 512 bits</p>
            <p><span className="font-semibold">Algorithm:</span> ECDSA + SHA-512</p>
          </div>
          <Button onClick={handleGenerate} disabled={loading} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
            Generate Key Pair
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}