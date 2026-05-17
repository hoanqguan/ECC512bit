import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { HistoryStore } from "@/lib/historyStore";
import { useT } from "@/lib/i18n";
import { History, Trash2, Lock, Unlock, PenLine, ShieldCheck, Key, AlertTriangle } from "lucide-react";

const TYPE_CONFIG = {
  encrypt:   { label: "Encrypt",     icon: Lock,        color: "bg-blue-50 text-blue-700 border-blue-200" },
  decrypt:   { label: "Decrypt",     icon: Unlock,      color: "bg-purple-50 text-purple-700 border-purple-200" },
  sign:      { label: "Sign",        icon: PenLine,     color: "bg-amber-50 text-amber-700 border-amber-200" },
  verify:    { label: "Verify",      icon: ShieldCheck, color: "bg-green-50 text-green-700 border-green-200" },
  keygen:    { label: "Key Created", icon: Key,         color: "bg-primary/5 text-primary border-primary/20" },
  keyimport: { label: "Key Imported",icon: Key,         color: "bg-primary/5 text-primary border-primary/20" },
};

const FILTERS = ["all", "encrypt", "decrypt", "sign", "verify", "keygen", "keyimport"];

function ConfirmDialog({ open, title, description, onConfirm, onCancel }) {
  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" /> {title}
          </AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Hủy</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={onConfirm}>Xóa</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function HistoryPanel({ refreshTrigger }) {
  const t = useT();
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("all");
  const [confirmDelete, setConfirmDelete] = useState(null); // { id } or "all"

  const load = () => setItems(HistoryStore.list());

  useEffect(() => { load(); }, [refreshTrigger]);

  const TYPE_CONFIG = {
    encrypt:   { label: t('encrypt'),     icon: Lock,        color: "bg-blue-50 text-blue-700 border-blue-200" },
    decrypt:   { label: t('decrypt'),     icon: Unlock,      color: "bg-purple-50 text-purple-700 border-purple-200" },
    sign:      { label: t('sign'),        icon: PenLine,     color: "bg-amber-50 text-amber-700 border-amber-200" },
    verify:    { label: t('verify'),      icon: ShieldCheck, color: "bg-green-50 text-green-700 border-green-200" },
    keygen:    { label: t('newKey'), icon: Key,         color: "bg-primary/5 text-primary border-primary/20" },
    keyimport: { label: t('newKey'),icon: Key,         color: "bg-primary/5 text-primary border-primary/20" },
  };

  const filtered = filter === "all" ? items : items.filter((h) => h.type === filter);

  const handleDelete = (id) => {
    HistoryStore.delete(id);
    load();
    setConfirmDelete(null);
  };

  const handleClearAll = () => {
    HistoryStore.clear();
    load();
    setConfirmDelete(null);
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="w-4 h-4" />
          {t('operationHistory')}
          <Badge variant="secondary" className="ml-1 text-xs">{items.length}</Badge>
          {items.length > 0 && (
              <Button
              size="sm" variant="destructive"
              className="ml-auto h-7 px-3 text-xs gap-1"
              onClick={() => setConfirmDelete("all")}
            >
              <Trash2 className="w-3 h-3" /> {t('deleteAll')}
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Filter chips */}
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? "default" : "outline"}
              className="h-6 px-2 text-xs capitalize"
              onClick={() => setFilter(f)}
            >
              {f === "all" ? t('filterAll') : TYPE_CONFIG[f]?.label ?? f}
            </Button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground italic text-center py-8">{t('noHistory')}</p>
        ) : (
          <div className="space-y-2">
            {filtered.map((h) => {
              const cfg = TYPE_CONFIG[h.type] ?? { label: h.type, icon: History, color: "bg-muted" };
              const Icon = cfg.icon;
              return (
                <div key={h.id} className={`flex items-start gap-3 p-3 rounded-lg border ${cfg.color}`}>
                  <Icon className="w-4 h-4 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold">{cfg.label}</span>
                      {h.keyName && <span className="text-xs opacity-70">· {h.keyName}</span>}
                      {h.mode && <Badge variant="outline" className="text-[10px] h-4 px-1">{h.mode}</Badge>}
                    </div>
                    {h.source && <p className="text-xs opacity-80 truncate mt-0.5">📄 {h.source}</p>}
                    {h.detail && <p className="text-xs opacity-70 mt-0.5">{h.detail}</p>}
                    <p className="text-[10px] opacity-50 mt-1">{new Date(h.timestamp).toLocaleString()}</p>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    className="h-6 w-6 shrink-0 opacity-60 hover:opacity-100 hover:text-destructive"
                    onClick={() => setConfirmDelete({ id: h.id, label: `${cfg.label}${h.source ? " · " + h.source : ""}` })}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      {/* Delete single */}
      <ConfirmDialog
        open={!!confirmDelete && confirmDelete !== "all"}
        title="Xóa mục này?"
        description={`Bạn sắp xóa bản ghi: "${confirmDelete?.label}". Hành động này không thể hoàn tác.`}
        onConfirm={() => handleDelete(confirmDelete?.id)}
        onCancel={() => setConfirmDelete(null)}
      />
      {/* Delete all */}
      <ConfirmDialog
        open={confirmDelete === "all"}
        title="Xóa toàn bộ history?"
        description="Tất cả lịch sử thao tác sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác."
        onConfirm={handleClearAll}
        onCancel={() => setConfirmDelete(null)}
      />
    </Card>
  );
}