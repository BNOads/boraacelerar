import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Video, Download, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  webViewLink: string;
  thumbnailLink?: string;
}

export const AdminImportarGravacoesDialog = () => {
  const [open, setOpen] = useState(false);
  const [selectedMentorado, setSelectedMentorado] = useState<string>("");
  const [importing, setImporting] = useState<string | null>(null);
  const [autoImporting, setAutoImporting] = useState(false);

  const { data: mentorados } = useQuery({
    queryKey: ["mentorados-for-import"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorados")
        .select("id, user_id, profiles(nome_completo, apelido)")
        .eq("status", "ativo")
        .order("profiles(nome_completo)");

      if (error) throw error;
      return data;
    },
  });

  // Buscar arquivos do Google Drive
  const { data: driveFiles, isLoading: loadingFiles, refetch } = useQuery({
    queryKey: ["drive-files"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("google-drive-import", {
        body: { action: "list" },
      });
      if (error) throw error;
      return (data.files || []) as DriveFile[];
    },
    enabled: open,
  });

  const handleAutoImport = async () => {
    setAutoImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("google-drive-import", {
        body: { action: "auto-import" },
      });

      if (error) throw error;

      const results = data as { imported: number; skipped: number; errors: string[] };
      
      if (results.imported > 0) {
        toast.success(`${results.imported} gravações importadas com sucesso!`);
      }
      
      if (results.skipped > 0) {
        toast.info(`${results.skipped} gravações já existiam no sistema`);
      }
      
      if (results.errors.length > 0) {
        console.error("Import errors:", results.errors);
        toast.error(`${results.errors.length} erros durante importação`);
      }

      refetch();
    } catch (error) {
      console.error("Error auto-importing:", error);
      toast.error("Erro ao importar gravações automaticamente");
    } finally {
      setAutoImporting(false);
    }
  };

  const handleImport = async (fileId: string) => {
    if (!selectedMentorado) {
      toast.error("Selecione um mentorado primeiro");
      return;
    }

    setImporting(fileId);
    try {
      const { data, error } = await supabase.functions.invoke("google-drive-import", {
        body: {
          action: "import",
          fileId,
          mentoradoId: selectedMentorado,
        },
      });

      if (error) throw error;

      toast.success("Gravação importada com sucesso!");
      refetch();
    } catch (error) {
      console.error("Error importing:", error);
      toast.error("Erro ao importar gravação");
    } finally {
      setImporting(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Video className="mr-2 h-4 w-4" />
          Importar do Google Drive
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Importar Gravações do Google Drive</DialogTitle>
          <DialogDescription>
            Importe automaticamente ou selecione manualmente por mentorado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              onClick={handleAutoImport}
              disabled={autoImporting || loadingFiles}
              className="flex-1"
            >
              {autoImporting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Importar Tudo Automaticamente
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Ou importar manualmente
              </span>
            </div>
          </div>

          <Select value={selectedMentorado} onValueChange={setSelectedMentorado}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o mentorado" />
            </SelectTrigger>
            <SelectContent>
              {mentorados?.map((m: any) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.profiles?.apelido || m.profiles?.nome_completo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {loadingFiles ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <ScrollArea className="h-[400px] border rounded-md p-4">
              <div className="space-y-2">
                {driveFiles?.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent"
                  >
                    <div className="flex items-center gap-3">
                      {file.thumbnailLink ? (
                        <img
                          src={file.thumbnailLink}
                          alt={file.name}
                          className="w-16 h-12 object-cover rounded"
                        />
                      ) : (
                        <Video className="h-12 w-12 text-muted-foreground" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(file.createdTime).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleImport(file.id)}
                      disabled={!selectedMentorado || importing === file.id}
                    >
                      {importing === file.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Download className="mr-2 h-4 w-4" />
                          Importar
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
