import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Plus,
  Archive,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Objetivo {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: "boolean" | "numerico";
  status: string;
  valor_atual?: number;
  valor_meta?: number;
  unidade?: string;
  concluido: boolean;
  ordem: number;
}

interface Meta {
  id: string;
  titulo: string;
  descricao?: string;
  progresso: number;
  cor: string;
  status: string;
  data_inicio: string;
  data_fim?: string;
  objetivos?: Objetivo[];
}

export function MetaCard({
  meta,
  onUpdate,
  onAddObjetivo,
}: {
  meta: Meta;
  onUpdate: () => void;
  onAddObjetivo: (metaId: string) => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const [editandoValor, setEditandoValor] = useState<string | null>(null);
  const [valorTemp, setValorTemp] = useState("");

  const atualizarObjetivoBoolean = async (objetivoId: string, concluido: boolean) => {
    try {
      const { error } = await supabase
        .from("objetivos")
        .update({ concluido })
        .eq("id", objetivoId);

      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error("Erro ao atualizar resultado chave:", error);
      toast.error("Erro ao atualizar resultado chave");
    }
  };

  const atualizarObjetivoNumerico = async (objetivoId: string, valorAtual: number) => {
    try {
      const { error } = await supabase
        .from("objetivos")
        .update({ valor_atual: valorAtual })
        .eq("id", objetivoId);

      if (error) throw error;
      toast.success("Resultado chave atualizado!");
      onUpdate();
    } catch (error) {
      console.error("Erro ao atualizar resultado chave:", error);
      toast.error("Erro ao atualizar resultado chave");
    }
  };

  const arquivarMeta = async () => {
    try {
      const { error } = await supabase
        .from("metas")
        .update({ status: "arquivada" })
        .eq("id", meta.id);

      if (error) throw error;
      toast.success("Meta arquivada!");
      onUpdate();
    } catch (error) {
      console.error("Erro ao arquivar meta:", error);
      toast.error("Erro ao arquivar meta");
    }
  };

  const concluirMeta = async () => {
    try {
      const { error } = await supabase
        .from("metas")
        .update({ status: "concluida" })
        .eq("id", meta.id);

      if (error) throw error;
      toast.success("Meta concluída! 🎉");
      onUpdate();
    } catch (error) {
      console.error("Erro ao concluir meta:", error);
      toast.error("Erro ao concluir meta");
    }
  };

  const iniciarEdicaoValor = (objetivoId: string, valorAtual?: number) => {
    setEditandoValor(objetivoId);
    setValorTemp(valorAtual?.toString() || "0");
  };

  const finalizarEdicaoValor = (objetivoId: string) => {
    const valor = parseFloat(valorTemp);
    if (!isNaN(valor)) {
      atualizarObjetivoNumerico(objetivoId, valor);
    }
    setEditandoValor(null);
  };

  return (
    <Card className="relative overflow-hidden">
      <div
        className="absolute top-0 left-0 right-0 h-2"
        style={{ backgroundColor: meta.cor }}
      />
      <CardHeader className="pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">{meta.titulo}</CardTitle>
            {meta.descricao && (
              <p className="text-sm text-muted-foreground">{meta.descricao}</p>
            )}
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <span>
                {format(new Date(meta.data_inicio), "dd MMM yyyy", { locale: ptBR })}
              </span>
              {meta.data_fim && (
                <>
                  <span>→</span>
                  <span>
                    {format(new Date(meta.data_fim), "dd MMM yyyy", { locale: ptBR })}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: meta.cor }}>
                {meta.progresso}%
              </div>
              <div className="text-xs text-muted-foreground">progresso</div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAddObjetivo(meta.id)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Resultado Chave (KR)
                </DropdownMenuItem>
                {meta.status === "ativa" && (
                  <DropdownMenuItem onClick={concluirMeta}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Marcar como Concluída
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={arquivarMeta}>
                  <Archive className="h-4 w-4 mr-2" />
                  Arquivar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <Progress value={meta.progresso} className="mt-4" />
      </CardHeader>

      {meta.objetivos && meta.objetivos.length > 0 && (
        <CardContent>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandido(!expandido)}
            className="w-full justify-start mb-2"
          >
            {expandido ? (
              <ChevronDown className="h-4 w-4 mr-2" />
            ) : (
              <ChevronRight className="h-4 w-4 mr-2" />
            )}
            <span className="font-semibold">
              Resultados Chave ({meta.objetivos.length})
            </span>
          </Button>

          {expandido && (
            <div className="space-y-3 mt-4">
              {meta.objetivos
                .sort((a, b) => a.ordem - b.ordem)
                .map((objetivo) => (
                  <div
                    key={objetivo.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-muted/50"
                  >
                    {objetivo.tipo === "boolean" ? (
                      <>
                        <Checkbox
                          checked={objetivo.concluido}
                          onCheckedChange={(checked) =>
                            atualizarObjetivoBoolean(objetivo.id, checked as boolean)
                          }
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div
                            className={`font-medium text-sm ${
                              objetivo.concluido
                                ? "line-through text-muted-foreground"
                                : ""
                            }`}
                          >
                            {objetivo.titulo}
                          </div>
                          {objetivo.descricao && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {objetivo.descricao}
                            </div>
                          )}
                        </div>
                      </>
                    ) : (
                      <div className="flex-1">
                        <div className="font-medium text-sm mb-2">
                          {objetivo.titulo}
                        </div>
                        {objetivo.descricao && (
                          <div className="text-xs text-muted-foreground mb-2">
                            {objetivo.descricao}
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          {editandoValor === objetivo.id ? (
                            <Input
                              type="number"
                              value={valorTemp}
                              onChange={(e) => setValorTemp(e.target.value)}
                              onBlur={() => finalizarEdicaoValor(objetivo.id)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  finalizarEdicaoValor(objetivo.id);
                                if (e.key === "Escape") setEditandoValor(null);
                              }}
                              className="w-24 h-8 text-sm"
                              autoFocus
                            />
                          ) : (
                            <button
                              onClick={() =>
                                iniciarEdicaoValor(objetivo.id, objetivo.valor_atual)
                              }
                              className="px-3 py-1 bg-background border rounded-md text-sm font-semibold hover:bg-muted transition-colors"
                            >
                              {objetivo.valor_atual || 0}
                            </button>
                          )}
                          <span className="text-sm text-muted-foreground">/</span>
                          <span className="text-sm font-semibold">
                            {objetivo.valor_meta}
                          </span>
                          {objetivo.unidade && (
                            <span className="text-sm text-muted-foreground">
                              {objetivo.unidade}
                            </span>
                          )}
                          <div className="flex-1 ml-4">
                            <Progress
                              value={
                                objetivo.valor_meta
                                  ? ((objetivo.valor_atual || 0) /
                                      objetivo.valor_meta) *
                                    100
                                  : 0
                              }
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
