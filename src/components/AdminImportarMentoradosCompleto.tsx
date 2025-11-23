import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, AlertCircle, Download, Upload } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import Papa from "papaparse";

interface CSVRow {
  email: string;
  nome_completo: string;
  apelido?: string;
  whatsapp?: string;
  instagram?: string;
  turma?: string;
  data_ingresso?: string;
  status?: string;
  meta_clientes?: string;
  mes_ano: string;
  faturamento_mensal?: string;
  meta_mensal?: string;
  contratos_fechados?: string;
  qtd_propostas?: string;
  clientes_mes?: string;
  seguidores_instagram?: string;
  seguidores_tiktok?: string;
  seguidores_youtube?: string;
  qtd_colaboradores?: string;
}

interface ImportResult {
  email: string;
  status: "success" | "error" | "warning";
  message: string;
  action?: string;
}

export function AdminImportarMentoradosCompleto() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [previewData, setPreviewData] = useState<CSVRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setResults([]);
      setPreviewData([]);
      setShowPreview(false);
      setCurrentPage(1);
      
      // Parse CSV para preview
      Papa.parse<CSVRow>(selectedFile, {
        header: true,
        skipEmptyLines: true,
        complete: (parseResult) => {
          setPreviewData(parseResult.data);
          setShowPreview(true);
        },
      });
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
    setProgress(0);
    setResults([]);

    try {
      // Parse CSV
      Papa.parse<CSVRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: async (parseResult) => {
          const rows = parseResult.data;
          
          // Agrupar linhas por email
          const mentoradosMap = new Map<string, CSVRow[]>();
          rows.forEach((row) => {
            if (!row.email) return;
            const existing = mentoradosMap.get(row.email) || [];
            existing.push(row);
            mentoradosMap.set(row.email, existing);
          });

          const totalMentorados = mentoradosMap.size;
          let processedMentorados = 0;
          const importResults: ImportResult[] = [];

          // Processar cada mentorado
          for (const [email, mentoradoRows] of mentoradosMap.entries()) {
            try {
              const firstRow = mentoradoRows[0];
              
              // Validar email
              const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
              if (!email || !emailRegex.test(email)) {
                importResults.push({
                  email: email || "(vazio)",
                  status: "error",
                  message: "Email inválido ou não informado",
                });
                processedMentorados++;
                setProgress((processedMentorados / totalMentorados) * 100);
                continue;
              }
              
              // Validar dados obrigatórios (apenas nome)
              if (!firstRow.nome_completo) {
                importResults.push({
                  email,
                  status: "error",
                  message: "Nome completo obrigatório",
                });
                processedMentorados++;
                setProgress((processedMentorados / totalMentorados) * 100);
                continue;
              }

              // Verificar se mentorado já existe
              const { data: existingMentorado } = await supabase
                .from("mentorados")
                .select("id, user_id")
                .eq("email", email)
                .maybeSingle();

              let mentoradoId = existingMentorado?.id;
              let action = "";

              if (!existingMentorado) {
                // Criar novo mentorado com login
                const { data: createData, error: createError } = await supabase.functions.invoke(
                  "criar-usuario",
                  {
                    body: {
                      email: email,
                      password: email, // Senha = email
                      nome_completo: firstRow.nome_completo,
                      apelido: firstRow.apelido || "",
                      role: "mentorado",
                      turma: firstRow.turma || "",
                      whatsapp: firstRow.whatsapp || "",
                      instagram: firstRow.instagram || "",
                      meta_clientes: parseInt(firstRow.meta_clientes || "0"),
                    },
                  }
                );

                if (createError) {
                  throw new Error(`Erro ao criar usuário: ${createError.message}`);
                }

                // Buscar o mentorado criado
                const { data: newMentorado } = await supabase
                  .from("mentorados")
                  .select("id")
                  .eq("email", email)
                  .single();

                mentoradoId = newMentorado?.id;
                action = "✓ Login criado (senha = email)";
              } else {
                action = "⚠️ Usuário já existe";
              }

              if (!mentoradoId) {
                throw new Error("Não foi possível obter ID do mentorado");
              }

              // Importar dados mensais
              let monthsImported = 0;
              for (const row of mentoradoRows) {
                if (!row.mes_ano) continue;

                // Desempenho mensal
                const { error: desempenhoError } = await supabase
                  .from("desempenho_mensal")
                  .upsert({
                    mentorado_id: mentoradoId,
                    mes_ano: row.mes_ano,
                    faturamento_mensal: parseFloat(row.faturamento_mensal || "0"),
                    meta_mensal: parseFloat(row.meta_mensal || "0"),
                    contratos_fechados: parseInt(row.contratos_fechados || "0"),
                    qtd_propostas: parseInt(row.qtd_propostas || "0"),
                    clientes_mes: parseInt(row.clientes_mes || "0"),
                  }, {
                    onConflict: "mentorado_id,mes_ano",
                  });

                if (desempenhoError) {
                  console.error("Erro ao inserir desempenho:", desempenhoError);
                }

                // Métricas mensais
                const { error: metricasError } = await supabase
                  .from("metricas_mensais")
                  .upsert({
                    mentorado_id: mentoradoId,
                    mes_ano: row.mes_ano,
                    seguidores_instagram: parseInt(row.seguidores_instagram || "0"),
                    seguidores_tiktok: parseInt(row.seguidores_tiktok || "0"),
                    seguidores_youtube: parseInt(row.seguidores_youtube || "0"),
                    qtd_colaboradores: parseInt(row.qtd_colaboradores || "0"),
                  }, {
                    onConflict: "mentorado_id,mes_ano",
                  });

                if (metricasError) {
                  console.error("Erro ao inserir métricas:", metricasError);
                }

                monthsImported++;
              }

              importResults.push({
                email,
                status: existingMentorado ? "warning" : "success",
                message: `${monthsImported} mês(es) de dados importados`,
                action,
              });
            } catch (error: any) {
              importResults.push({
                email,
                status: "error",
                message: error.message || "Erro desconhecido",
              });
            }

            processedMentorados++;
            setProgress((processedMentorados / totalMentorados) * 100);
          }

          setResults(importResults);
          setIsImporting(false);
          
          queryClient.invalidateQueries({ queryKey: ["all-mentorados"] });
          
          const successCount = importResults.filter(r => r.status === "success").length;
          toast({
            title: "Importação concluída!",
            description: `${successCount} mentorado(s) processado(s) com sucesso.`,
          });
        },
      });
    } catch (error) {
      console.error("Erro na importação:", error);
      toast({
        title: "Erro",
        description: "Erro ao processar o arquivo.",
        variant: "destructive",
      });
      setIsImporting(false);
    }
  };

  const resetDialog = () => {
    setFile(null);
    setResults([]);
    setProgress(0);
    setPreviewData([]);
    setShowPreview(false);
    setCurrentPage(1);
    setOpen(false);
  };

  // Calcular estatísticas do preview
  const previewStats = previewData.length > 0 ? {
    totalLinhas: previewData.length,
    mentoradosUnicos: new Set(previewData.map(row => row.email)).size,
    primeiraData: previewData[0]?.mes_ano,
    ultimaData: previewData[previewData.length - 1]?.mes_ano,
    emailsInvalidos: previewData.filter(row => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return !row.email || !emailRegex.test(row.email);
    }).length,
  } : null;

  // Paginação
  const totalPages = Math.ceil(previewData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentPageData = previewData.slice(startIndex, endIndex);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2">
          <Database className="h-4 w-4" />
          Importação Completa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importação Completa de Mentorados</DialogTitle>
          <DialogDescription>
            Importe mentorados com todo o histórico de desempenho em um único arquivo
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="space-y-2">
              <p className="font-semibold">⚠️ IMPORTANTE:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>Um <strong>login será criado automaticamente</strong> para cada novo mentorado</li>
                <li><strong>Email = Senha</strong> (o mentorado deve alterar no primeiro acesso)</li>
                <li>O CSV deve ter <strong>uma linha por mês</strong> de cada mentorado</li>
                <li>Mentorados existentes não terão novo login criado</li>
              </ul>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              asChild
            >
              <a 
                href="/templates/template-mentorados-completo.csv" 
                download="template-mentorados-completo.csv"
              >
                <Download className="h-4 w-4" />
                Baixar Template CSV
              </a>
            </Button>
          </div>

          <div className="space-y-2">
            <label htmlFor="csv-file" className="text-sm font-medium">
              Selecionar arquivo CSV
            </label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={isImporting}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                📁 {file.name}
              </p>
            )}
          </div>

          {showPreview && previewStats && !results.length && (
            <div className="space-y-4 border rounded-lg p-4 bg-muted/50">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">📊 Resumo do Arquivo</h4>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total de Linhas</p>
                  <p className="text-2xl font-bold text-primary">{previewStats.totalLinhas}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Mentorados Únicos</p>
                  <p className="text-2xl font-bold text-primary">{previewStats.mentoradosUnicos}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Primeiro Período</p>
                  <p className="text-lg font-semibold">{previewStats.primeiraData}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Último Período</p>
                  <p className="text-lg font-semibold">{previewStats.ultimaData}</p>
                </div>
              </div>

              {previewStats.emailsInvalidos > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>{previewStats.emailsInvalidos} email(s) inválido(s)</strong> encontrado(s) no arquivo. 
                    Estes registros serão ignorados na importação.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium">
                    Preview dos Dados (mostrando {startIndex + 1}-{Math.min(endIndex, previewData.length)} de {previewData.length})
                  </h5>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      Página {currentPage} de {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs">Email</TableHead>
                        <TableHead className="text-xs">Nome</TableHead>
                        <TableHead className="text-xs">Turma</TableHead>
                        <TableHead className="text-xs">Mês/Ano</TableHead>
                        <TableHead className="text-xs">Faturamento</TableHead>
                        <TableHead className="text-xs">Meta</TableHead>
                        <TableHead className="text-xs">Contratos</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentPageData.map((row, index) => {
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        const isInvalidEmail = !row.email || !emailRegex.test(row.email);
                        
                        return (
                          <TableRow key={startIndex + index} className={isInvalidEmail ? "bg-destructive/10" : ""}>
                            <TableCell className="text-xs font-mono">
                              {row.email || "(vazio)"}
                              {isInvalidEmail && <span className="ml-2 text-destructive">⚠️</span>}
                            </TableCell>
                            <TableCell className="text-xs">{row.nome_completo}</TableCell>
                            <TableCell className="text-xs">{row.turma || "-"}</TableCell>
                            <TableCell className="text-xs">{row.mes_ano}</TableCell>
                            <TableCell className="text-xs">
                              {row.faturamento_mensal ? `R$ ${parseFloat(row.faturamento_mensal).toLocaleString('pt-BR')}` : "-"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {row.meta_mensal ? `R$ ${parseFloat(row.meta_mensal).toLocaleString('pt-BR')}` : "-"}
                            </TableCell>
                            <TableCell className="text-xs">
                              {row.contratos_fechados || "-"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
          )}

          {isImporting && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processando...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold">Resultados da Importação:</h4>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {results.map((result, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-sm">
                          {result.email}
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              result.status === "success"
                                ? "text-green-600"
                                : result.status === "warning"
                                ? "text-yellow-600"
                                : "text-red-600"
                            }
                          >
                            {result.status === "success" ? "✓" : result.status === "warning" ? "⚠" : "✗"}
                          </span>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="space-y-1">
                            {result.action && (
                              <div className="text-muted-foreground">{result.action}</div>
                            )}
                            <div>{result.message}</div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleImport}
              disabled={!file || isImporting}
              className="flex-1 gap-2"
            >
              <Upload className="h-4 w-4" />
              {isImporting ? "Importando..." : "Importar"}
            </Button>
            <Button variant="outline" onClick={resetDialog} disabled={isImporting}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
