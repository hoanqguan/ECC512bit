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

  const handleGenerate = async () => {
    if (!name.trim()) { toast.error("Please enter a key name"); return; }
    setLoading(true);
    const { privateKeyPem, publicKeyPem } = generateAndExportKeyPair();
    const fingerprint = await computeFingerprint(publicKeyPem);
    KeyStore.create({
      name: name.trim(),
      curve: "brainpoolP512r1",
      public_key_pem: publicKeyPem,
      private_key_pem: privateKeyPem,
      fingerprint,
      notes: notes.trim(),
    });
    HistoryStore.add({ type: "keygen", source: name.trim(), detail: "Brainpool P-512" });
    toast.success("Key pair generated and saved");
    setName(""); setNotes("");
    setLoading(false);
    onGenerated();
    onClose();
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