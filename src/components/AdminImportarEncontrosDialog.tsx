import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { Video, Loader2 } from "lucide-react";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  createdTime: string;
  webViewLink: string;
  thumbnailLink?: string;
}

export function AdminImportarEncontrosDialog() {
  const [open, setOpen] = useState(false);
  const [selectedEncontro, setSelectedEncontro] = useState<string>("");
  const [importing, setImporting] = useState(false);
  const [autoImporting, setAutoImporting] = useState(false);
  const queryClient = useQueryClient();

  // Fetch encontros
  const { data: encontros } = useQuery({
    queryKey: ["encontros-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("encontros")
        .select("id, titulo, data_hora, tipo")
        .order("data_hora", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  // Fetch Google Drive files
  const { data: driveFiles, isLoading: loadingFiles } = useQuery({
    queryKey: ["drive-encontros-files"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke(
        "google-drive-import",
        {
          body: { action: "list-encontros" },
        }
      );

      if (error) throw error;
      return (data.files || []) as DriveFile[];
    },
    enabled: open,
  });

  const handleAutoImport = async () => {
    setAutoImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "google-drive-import",
        {
          body: { action: "auto-import-encontros" },
        }
      );

      if (error) throw error;

      const { imported, skipped, errors } = data;

      if (imported.length > 0) {
        toast.success(
          `${imported.length} gravações importadas com sucesso!`
        );
      }
      if (skipped.length > 0) {
        toast.info(`${skipped.length} gravações já existiam e foram puladas`);
      }
      if (errors.length > 0) {
        toast.error(`${errors.length} erros ao importar gravações`);
      }

      queryClient.invalidateQueries({ queryKey: ["gravacoes-encontros"] });
      queryClient.invalidateQueries({ queryKey: ["drive-encontros-files"] });
      queryClient.invalidateQueries({ queryKey: ["encontros-list"] });
    } catch (error) {
      console.error("Error auto-importing:", error);
      toast.error("Erro ao importar gravações automaticamente");
    } finally {
      setAutoImporting(false);
    }
  };

  const handleImport = async (fileId: string) => {
    if (!selectedEncontro) {
      toast.error("Selecione um encontro para associar a gravação");
      return;
    }

    setImporting(true);
    try {
      const { error } = await supabase.functions.invoke("google-drive-import", {
        body: {
          action: "import-encontro",
          fileId,
          encontroId: selectedEncontro,
        },
      });

      if (error) throw error;

      toast.success("Gravação importada com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["gravacoes-encontros"] });
      queryClient.invalidateQueries({ queryKey: ["drive-encontros-files"] });
    } catch (error) {
      console.error("Error importing:", error);
      toast.error("Erro ao importar gravação");
    } finally {
      setImporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Video className="h-4 w-4 mr-2" />
          Importar Encontros
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Importar Gravações de Encontros</DialogTitle>
          <DialogDescription>
            Importe gravações do Google Drive para a biblioteca de encontros
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Button
              onClick={handleAutoImport}
              disabled={autoImporting}
              className="w-full"
            >
              {autoImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importando...
                </>
              ) : (
                "Importar Tudo Automaticamente"
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              Cria encontros automaticamente e associa as gravações
            </p>
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

          <div>
            <label className="text-sm font-medium mb-2 block">
              Selecione o encontro
            </label>
            <Select value={selectedEncontro} onValueChange={setSelectedEncontro}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um encontro" />
              </SelectTrigger>
              <SelectContent>
                {encontros?.map((encontro) => (
                  <SelectItem key={encontro.id} value={encontro.id}>
                    {encontro.titulo} - {new Date(encontro.data_hora).toLocaleDateString()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Gravações disponíveis no Google Drive
            </label>
            <ScrollArea className="h-[400px] border rounded-md p-4">
              {loadingFiles ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : (
                <div className="space-y-2">
                  {driveFiles?.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-start gap-3 flex-1">
                        {file.thumbnailLink && (
                          <img
                            src={file.thumbnailLink}
                            alt={file.name}
                            className="w-16 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(file.createdTime).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleImport(file.id)}
                        disabled={importing || !selectedEncontro}
                      >
                        {importing ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Importar"
                        )}
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
