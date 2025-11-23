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

interface CSVRow {
  email: string;
  senha: string;
  nome_completo: string;
  apelido?: string;
  role: "mentorado" | "navegador" | "admin";
  turma?: string;
  whatsapp?: string;
  instagram?: string;
  meta_clientes?: string;
}

interface ImportResult {
  email: string;
  status: "success" | "error";
  message: string;
}

export function AdminImportarUsuariosDialog() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const { toast } = useToast();

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
            const email = row.email?.trim() || "";
            const senha = row.senha?.trim() || "";

            // Validar dados obrigatórios
            if (!email || !senha || !row.nome_completo || !row.role) {
              importResults.push({
                email: email || `Linha ${i + 1}`,
                status: "error",
                message: "Dados obrigatórios faltando (email, senha, nome_completo, role)",
              });
              continue;
            }

            // Validar formato do email
            const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
            if (!emailRegex.test(email)) {
              importResults.push({
                email,
                status: "error",
                message: "Email inválido. Verifique o endereço no CSV.",
              });
              continue;
            }

            // Validar força mínima da senha
            if (senha.length < 6) {
              importResults.push({
                email,
                status: "error",
                message: "Senha muito curta (mínimo 6 caracteres).",
              });
              continue;
            }

            // Validar role
            if (!["mentorado", "navegador", "admin"].includes(row.role)) {
              importResults.push({
                email,
                status: "error",
                message: "Role inválido. Use: mentorado, navegador ou admin",
              });
              continue;
            }

            // Preparar dados para criar usuário
            const userData: any = {
              email,
              password: senha,
              nome_completo: row.nome_completo.trim(),
              apelido: row.apelido?.trim(),
              role: row.role,
            };

            // Adicionar dados específicos de mentorado
            if (row.role === "mentorado") {
              userData.turma = row.turma?.trim();
              userData.whatsapp = row.whatsapp?.trim();
              userData.instagram = row.instagram?.trim();
              userData.meta_clientes = row.meta_clientes ? parseInt(row.meta_clientes) : undefined;
            }

            // Chamar edge function para criar usuário
            const { data, error } = await supabase.functions.invoke("criar-usuario", {
              body: userData,
            });

            const functionError = (data as any)?.error as string | undefined;

            if (error || functionError) {
              importResults.push({
                email,
                status: "error",
                message: functionError || error?.message || "Erro ao criar usuário",
              });
            } else {
              importResults.push({
                email,
                status: "success",
                message: "Usuário criado com sucesso",
              });
            }
          } catch (error: any) {
            importResults.push({
              email: row.email,
              status: "error",
              message: error.message || "Erro inesperado",
            });
          }

          // Atualizar progresso
          setProgress(((i + 1) / rows.length) * 100);
          setResults([...importResults]);
        }

        setIsImporting(false);
        
        const successCount = importResults.filter(r => r.status === "success").length;
        const errorCount = importResults.filter(r => r.status === "error").length;
        
        toast({
          title: "Importação concluída",
          description: `${successCount} usuários criados, ${errorCount} erros`,
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
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Importar CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importar Usuários via CSV</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              O arquivo CSV deve conter as colunas: <strong>email, senha, nome_completo, role</strong> (obrigatórias)
              <br />
              Opcionais: apelido, turma, whatsapp, instagram, meta_clientes (para mentorados)
              <br />
              Roles válidos: mentorado, navegador, admin
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
                <span>Importando usuários...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-3">
              <h4 className="font-semibold text-sm">Resultados da Importação:</h4>
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 text-sm py-1 border-b last:border-0"
                >
                  {result.status === "success" ? (
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{result.email}</p>
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
            <Button
              onClick={handleImport}
              disabled={!file || isImporting}
            >
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
