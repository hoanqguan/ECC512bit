import { useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Copy, Trash2, Key, ChevronDown, ChevronUp, Shield, Download, AlertTriangle } from "lucide-react";
import { KeyStore } from "@/lib/localKeyStore";
import { publicKeyPemToJWK, privateKeyPemToJWK } from "@/lib/brainpool";
import { toast } from "sonner";

export default function KeyCard({ keyPair, onDelete, onSelect, isSelected, onRefresh }) {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const importRef = useRef();

  const copy = (text, label) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const exportKey = (format) => {
    try {
      const fmt = (format || 'jwk').toLowerCase();
      if (fmt === 'pem') {
        const pub = keyPair.public_key_pem || "";
        const priv = keyPair.private_key_pem || "";
        const combined = `${priv ? priv + "\n" : ""}${pub ? pub + "\n" : ""}`.trim();
        if (!combined) throw new Error('No PEM data available for this key');
        const blob = new Blob([combined], { type: 'application/x-pem-file' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `keypair_${keyPair.name.replace(/\s+/g, "_")}.pem`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Key pair exported as PEM');
        return;
      }

      // default to JWK
      const pubJwk = publicKeyPemToJWK(keyPair.public_key_pem);
      const privJwk = privateKeyPemToJWK(keyPair.private_key_pem);
      const exportData = {
        name: keyPair.name,
        curve: keyPair.curve || "brainpoolP512r1",
        format: "jwk",
        public_jwk: pubJwk,
        private_jwk: privJwk,
        fingerprint: keyPair.fingerprint,
        notes: keyPair.notes || "",
        exported_at: new Date().toISOString(),
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `keypair_${keyPair.name.replace(/\s+/g, "_")}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Key pair exported as JWK");
    } catch (e) {
      toast.error("Failed to export key: " + (e?.message || e));
    }
  };

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 border-2 ${
        isSelected
          ? "border-primary shadow-lg"
          : "border-border hover:border-primary/40 hover:shadow-md"
      }`}
      onClick={() => onSelect(keyPair)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Key className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">{keyPair.name}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(keyPair.created_date).toLocaleDateString()}
              </p>
            </div>
          </div>
          <AlertDialog open={showExportDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Export Key Pair</AlertDialogTitle>
                <AlertDialogDescription>Chọn định dạng xuất cho key "{keyPair.name}"</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={(e) => { e.stopPropagation(); setShowExportDialog(false); }}>Hủy</AlertDialogCancel>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); exportKey('jwk'); setShowExportDialog(false); }}>Export JWK</Button>
                  <Button size="sm" onClick={(e) => { e.stopPropagation(); exportKey('pem'); setShowExportDialog(false); }}>Export PEM</Button>
                </div>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs font-mono">
              <Shield className="w-3 h-3 mr-1" />
              {keyPair.curve || "brainpoolP512r1"}
            </Badge>
            {isSelected && (
              <Badge className="text-xs ml-2 bg-primary text-primary-foreground font-semibold">✓ Used</Badge>
            )}
            {!isSelected && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1"
                  title="Export"
                  onClick={(e) => { e.stopPropagation(); setShowExportDialog(true); }}
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Export</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-destructive hover:text-destructive"
                  onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </>
            )}
          </div>
        </div>
        {keyPair.fingerprint && (
          <p className="text-xs text-muted-foreground font-mono truncate mt-1">
            FP: {keyPair.fingerprint.slice(0, 47)}…
          </p>
        )}
        {keyPair.notes && (
          <p className="text-xs text-muted-foreground italic">{keyPair.notes}</p>
        )}
      </CardHeader>

      <CardContent className="pt-0">
        <Button
          variant="ghost"
          size="sm"
          className="w-full text-xs h-7"
          onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
        >
          {expanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
          {expanded ? "Hide keys" : "Show keys"}
        </Button>

        {expanded && (
          <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-muted-foreground">PUBLIC KEY</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copy(keyPair.public_key_pem, "Public key")}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <Textarea value={keyPair.public_key_pem} readOnly className="text-xs font-mono h-20 resize-none bg-muted/50" />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium text-muted-foreground">PRIVATE KEY</span>
                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => copy(keyPair.private_key_pem, "Private key")}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
              <Textarea value={keyPair.private_key_pem} readOnly className="text-xs font-mono h-20 resize-none bg-muted/50" />
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog open={showDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" /> Delete Key Pair?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Bạn sắp xóa key pair <strong>"{keyPair.name}"</strong>. Hành động này không thể hoàn tác. Dữ liệu đã mã hóa bằng key này sẽ không thể giải mã được nữa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); onDelete(keyPair.id); }}
            >Xóa</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}