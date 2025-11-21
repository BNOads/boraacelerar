import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { useQueryClient } from "@tanstack/react-query";

interface CSVRow {
  titulo: string;
  data_hora: string;
  tipo: "Mentoria" | "Imersão" | "Live Especial";
  descricao?: string;
  link_zoom?: string;
}

interface ImportResult {
  titulo: string;
  status: "success" | "error";
  message: string;
}

export function AdminImportarAgendaDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setResults([]);
    } else {
      toast({
        title: "Erro",
        description: "Por favor, selecione um arquivo CSV válido.",
        variant: "destructive",
      });
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setIsImporting(true);
    setResults([]);
    setProgress(0);

    Papa.parse<CSVRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parseResult) => {
        const rows = parseResult.data;
        const importResults: ImportResult[] = [];
        
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          
          try {
            if (!row.titulo || !row.data_hora || !row.tipo) {
              importResults.push({
                titulo: row.titulo || `Linha ${i + 1}`,
                status: "error",
                message: "Campos obrigatórios faltando (titulo, data_hora, tipo)",
              });
              continue;
            }

            if (!["Mentoria", "Imersão", "Live Especial"].includes(row.tipo)) {
              importResults.push({
                titulo: row.titulo,
                status: "error",
                message: "Tipo inválido. Use: Mentoria, Imersão ou Live Especial",
              });
              continue;
            }

            const { error } = await supabase
              .from("agenda_mentoria")
              .insert({
                titulo: row.titulo.trim(),
                data_hora: row.data_hora.trim(),
                tipo: row.tipo,
                descricao: row.descricao?.trim(),
                link_zoom: row.link_zoom?.trim(),
              });

            if (error) {
              importResults.push({
                titulo: row.titulo,
                status: "error",
                message: error.message || "Erro ao criar evento",
              });
            } else {
              importResults.push({
                titulo: row.titulo,
                status: "success",
                message: "Evento criado com sucesso",
              });
            }
          } catch (error: any) {
            importResults.push({
              titulo: row.titulo,
              status: "error",
              message: error.message || "Erro inesperado",
            });
          }

          setProgress(((i + 1) / rows.length) * 100);
          setResults([...importResults]);
        }

        setIsImporting(false);
        queryClient.invalidateQueries({ queryKey: ["agenda-mentoria"] });
        
        const successCount = importResults.filter(r => r.status === "success").length;
        const errorCount = importResults.filter(r => r.status === "error").length;
        
        toast({
          title: "Importação concluída",
          description: `${successCount} eventos criados, ${errorCount} erros`,
        });
      },
      error: (error) => {
        toast({
          title: "Erro ao processar CSV",
          description: error.message,
          variant: "destructive",
        });
        setIsImporting(false);
      },
    });
  };

  const resetDialog = () => {
    setFile(null);
    setResults([]);
    setProgress(0);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Upload className="mr-2 h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Agenda via CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              O arquivo CSV deve conter as colunas: <strong>titulo, data_hora, tipo</strong> (obrigatórias)
              <br />
              Opcionais: descricao, link_zoom
              <br />
              Tipos válidos: Mentoria, Imersão, Live Especial
              <br />
              Formato data_hora: YYYY-MM-DD HH:MM:SS
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isImporting}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Arquivo selecionado: {file.name}
              </p>
            )}
          </div>

          {isImporting && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Importando eventos...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
              <h4 className="font-semibold text-sm">Resultados:</h4>
              {results.map((result, idx) => (
                <div key={idx} className="flex items-start gap-2 text-sm py-1 border-b last:border-0">
                  {result.status === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.titulo}</p>
                    <p className={result.status === "success" ? "text-green-600" : "text-red-600"}>
                      {result.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={resetDialog} disabled={isImporting}>
              {results.length > 0 ? "Fechar" : "Cancelar"}
            </Button>
            <Button onClick={handleImport} disabled={!file || isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importando...
                </>
              ) : (
                "Importar"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
