import { useState, useEffect, useRef } from "react";
import { KeyStore } from "@/lib/localKeyStore";
import { LocalAuth } from "@/lib/localAuth";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, KeyRound, Loader2, ShieldCheck, LogOut, Upload } from "lucide-react";
import KeyCard from "@/components/crypto/KeyCard";
import GenerateKeyModal from "@/components/crypto/GenerateKeyModal";
import SignPanel from "@/components/crypto/SignPanel";
import VerifyPanel from "@/components/crypto/VerifyPanel";
import EncryptPanel from "@/components/crypto/EncryptPanel";
import DecryptPanel from "@/components/crypto/DecryptPanel";
import HistoryPanel from "@/components/crypto/HistoryPanel";
import { HistoryStore } from "@/lib/historyStore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function CryptoToolkit() {
  const [keyPairs, setKeyPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [historyTick, setHistoryTick] = useState(0);

  const [encryptText, setEncryptText] = useState("");
  const [decryptText, setDecryptText] = useState("");
  const [signText, setSignText] = useState("");
  const [verifyText, setVerifyText] = useState("");

  const [encryptMode, setEncryptMode] = useState("text");
  const [decryptMode, setDecryptMode] = useState("text");
  const [signMode, setSignMode] = useState("text");
  const [verifyMode, setVerifyMode] = useState("text");

  const refreshHistory = () => setHistoryTick((t) => t + 1);
  const navigate = useNavigate();
  const session = LocalAuth.getSession();
  const importRef = useRef();

  const handleImportKey = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const obj = JSON.parse(ev.target.result);
        if (!obj.public_key_pem || !obj.private_key_pem) {
          toast.error("File JSON không hợp lệ (thiếu public/private key)");
          return;
        }
        KeyStore.create({
          name: obj.name || "Imported Key",
          curve: obj.curve || "brainpoolP512r1",
          public_key_pem: obj.public_key_pem,
          private_key_pem: obj.private_key_pem,
          fingerprint: obj.fingerprint || "",
          notes: obj.notes || "",
        });
        HistoryStore.add({ type: "keyimport", source: obj.name || "Imported Key", detail: obj.fingerprint ? `FP: ${obj.fingerprint.slice(0, 20)}…` : "" });
        loadKeys();
        toast.success(`Key "${obj.name || "Imported Key"}" đã được import`);
      } catch {
        toast.error("Không thể đọc file JSON");
      }
    };
    reader.readAsText(f);
    importRef.current.value = "";
  };

  const handleLogout = () => {
    LocalAuth.logout();
    navigate("/auth");
  };

  const loadKeys = () => {
    setLoading(true);
    const keys = KeyStore.list("-created_date");
    setKeyPairs(keys);
    setLoading(false);
  };

  useEffect(() => { loadKeys(); }, []);

  const handleDelete = async (id) => {
    KeyStore.delete(id);
    if (selectedKey?.id === id) setSelectedKey(null);
    setKeyPairs((prev) => prev.filter((k) => k.id !== id));
    toast.success("Key pair deleted");
  };

  const handleSelect = (key) => {
    setSelectedKey((prev) => prev?.id === key.id ? null : key);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-black text-white">
      {/* Header */}
      <div className="border-b bg-card/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">ECC Crypto Toolkit</h1>
              <p className="text-xs text-muted-foreground">Brainpool P-512 · ECDSA · SHA-512</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {session && (
              <span className="text-sm text-muted-foreground hidden sm:inline">
                👤 {session.username}
              </span>
            )}
            <Button onClick={() => setShowGenerate(true)} size="sm" className="gap-1.5">
              <Plus className="w-4 h-4" />
              New Key Pair
            </Button>
            <Button onClick={handleLogout} size="sm" variant="outline" className="gap-1.5">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Key list */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <KeyRound className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                Saved Key Pairs
              </h2>
              <span className="text-xs text-muted-foreground">{keyPairs.length}</span>
              <label className="ml-auto cursor-pointer" title="Import key pair từ JSON">
                <Button size="icon" variant="outline" className="h-7 w-7" asChild>
                  <span><Upload className="w-3.5 h-3.5" /></span>
                </Button>
                <input ref={importRef} type="file" accept=".json" className="hidden" onChange={handleImportKey} />
              </label>
            </div>

            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : keyPairs.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed rounded-xl text-muted-foreground">
                <KeyRound className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No key pairs yet</p>
                <Button variant="link" size="sm" onClick={() => setShowGenerate(true)}>
                  Generate your first key
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {keyPairs.map((kp) => (
                  <KeyCard
                    key={kp.id}
                    keyPair={kp}
                    onDelete={handleDelete}
                    onSelect={handleSelect}
                    isSelected={selectedKey?.id === kp.id}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Operations */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="encrypt" onValueChange={(v) => { if (v === "history") refreshHistory(); }}>
              <TabsList className="mb-6 grid grid-cols-5 bg-slate-800 border border-slate-700 rounded-2xl p-1 h-auto">
                <TabsTrigger value="encrypt" className="rounded-xl data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-semibold transition-all">Encrypt</TabsTrigger>
                <TabsTrigger value="decrypt" className="rounded-xl data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-semibold transition-all">Decrypt</TabsTrigger>
                <TabsTrigger value="sign" className="rounded-xl data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-semibold transition-all">Sign</TabsTrigger>
                <TabsTrigger value="verify" className="rounded-xl data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-semibold transition-all">Verify</TabsTrigger>
                <TabsTrigger value="history" className="rounded-xl data-[state=active]:bg-cyan-500 data-[state=active]:text-black font-semibold transition-all">History</TabsTrigger>
              </TabsList>
              <TabsContent value="encrypt" className="overflow-visible">
                <EncryptPanel selectedKey={selectedKey} text={encryptText} setText={setEncryptText} mode={encryptMode} setMode={setEncryptMode} />
              </TabsContent>
              <TabsContent value="decrypt" className="overflow-visible">
                <DecryptPanel selectedKey={selectedKey} text={decryptText} setText={setDecryptText} mode={decryptMode} setMode={setDecryptMode} />
              </TabsContent>
              <TabsContent value="sign" className="overflow-visible">
                <SignPanel selectedKey={selectedKey} text={signText} setText={setSignText} mode={signMode} setMode={setSignMode} />
              </TabsContent>
              <TabsContent value="verify" className="overflow-visible">
                <VerifyPanel selectedKey={selectedKey} text={verifyText} setText={setVerifyText} mode={verifyMode} setMode={setVerifyMode} />
              </TabsContent>
              <TabsContent value="history" className="overflow-visible">
                <HistoryPanel refreshTrigger={historyTick} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      <GenerateKeyModal
        open={showGenerate}
        onClose={() => setShowGenerate(false)}
        onGenerated={loadKeys}
      />
    </div>
  );
}