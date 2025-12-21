import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ListChecks } from "lucide-react";

export function NovoObjetivoDialog({
  open,
  onOpenChange,
  metaId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metaId: string | null;
  onSuccess: () => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<"boolean" | "numerico">("boolean");
  const [valorMeta, setValorMeta] = useState("");
  const [unidade, setUnidade] = useState("");
  const [salvando, setSalvando] = useState(false);

  const resetForm = () => {
    setTitulo("");
    setDescricao("");
    setTipo("boolean");
    setValorMeta("");
    setUnidade("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!metaId) {
      toast.error("Meta não selecionada");
      return;
    }

    if (!titulo.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    if (tipo === "numerico" && !valorMeta) {
      toast.error("Defina o valor meta para resultados chave numéricos");
      return;
    }

    try {
      setSalvando(true);

      // Buscar a maior ordem existente para esta meta
      const { data: objetivosExistentes } = await supabase
        .from("objetivos")
        .select("ordem")
        .eq("meta_id", metaId)
        .order("ordem", { ascending: false })
        .limit(1);

      const novaOrdem =
        objetivosExistentes && objetivosExistentes.length > 0
          ? objetivosExistentes[0].ordem + 1
          : 0;

      const objetivoData: any = {
        meta_id: metaId,
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        tipo,
        ordem: novaOrdem,
        status: "pendente",
        concluido: false,
      };

      if (tipo === "numerico") {
        objetivoData.valor_meta = parseFloat(valorMeta);
        objetivoData.valor_atual = 0;
        objetivoData.unidade = unidade.trim() || null;
      }

      const { error } = await supabase.from("objetivos").insert(objetivoData);

      if (error) throw error;

      toast.success("Resultado chave adicionado com sucesso!");
      resetForm();
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error("Erro ao criar resultado chave:", error);
      toast.error("Erro ao criar resultado chave");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="h-5 w-5" />
            Novo Resultado Chave (KR)
          </DialogTitle>
          <DialogDescription>
            Adicione um resultado chave para acompanhar o progresso da sua meta
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título do Resultado Chave *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Metrificar o Churn da Empresa"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva o resultado chave em mais detalhes (opcional)"
              rows={2}
            />
          </div>

          <div className="space-y-3">
            <Label>Tipo de Resultado Chave</Label>
            <RadioGroup value={tipo} onValueChange={(v) => setTipo(v as any)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="boolean" id="boolean" />
                <Label htmlFor="boolean" className="font-normal cursor-pointer">
                  Sim/Não (checkbox)
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="numerico" id="numerico" />
                <Label htmlFor="numerico" className="font-normal cursor-pointer">
                  Numérico (progresso com valores)
                </Label>
              </div>
            </RadioGroup>
          </div>

          {tipo === "numerico" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valorMeta">Valor Meta *</Label>
                <Input
                  id="valorMeta"
                  type="number"
                  step="0.01"
                  value={valorMeta}
                  onChange={(e) => setValorMeta(e.target.value)}
                  placeholder="Ex: 2000"
                  required={tipo === "numerico"}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unidade">Unidade</Label>
                <Input
                  id="unidade"
                  value={unidade}
                  onChange={(e) => setUnidade(e.target.value)}
                  placeholder="Ex: BRL, clientes"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={salvando}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Adicionando..." : "Adicionar Resultado Chave"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
