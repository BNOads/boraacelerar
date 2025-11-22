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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Target } from "lucide-react";

const CORES_SUGERIDAS = [
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#ec4899", // pink
  "#06b6d4", // cyan
  "#f97316", // orange
];

export function NovaMetaDialog({
  open,
  onOpenChange,
  mentoradoId,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mentoradoId: string;
  onSuccess: (metaId: string) => void;
}) {
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataInicio, setDataInicio] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dataFim, setDataFim] = useState("");
  const [corSelecionada, setCorSelecionada] = useState(CORES_SUGERIDAS[0]);
  const [salvando, setSalvando] = useState(false);

  const resetForm = () => {
    setTitulo("");
    setDescricao("");
    setDataInicio(new Date().toISOString().split("T")[0]);
    setDataFim("");
    setCorSelecionada(CORES_SUGERIDAS[0]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titulo.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    try {
      setSalvando(true);

      const { data, error } = await supabase
        .from("metas")
        .insert({
          mentorado_id: mentoradoId,
          titulo: titulo.trim(),
          descricao: descricao.trim() || null,
          data_inicio: dataInicio,
          data_fim: dataFim || null,
          cor: corSelecionada,
          status: "ativa",
        })
        .select()
        .single();

      if (error) throw error;

      toast.success("Meta criada com sucesso!");
      resetForm();
      onOpenChange(false);
      onSuccess(data.id);
    } catch (error) {
      console.error("Erro ao criar meta:", error);
      toast.error("Erro ao criar meta");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Nova Meta (OKR)
          </DialogTitle>
          <DialogDescription>
            Defina uma nova meta para acompanhar seu progresso
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título da Meta *</Label>
            <Input
              id="titulo"
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Aumentar satisfação dos clientes"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Descreva sua meta em mais detalhes (opcional)"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dataInicio">Data de Início *</Label>
              <Input
                id="dataInicio"
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dataFim">Data de Fim</Label>
              <Input
                id="dataFim"
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Cor da Meta</Label>
            <div className="flex gap-2">
              {CORES_SUGERIDAS.map((cor) => (
                <button
                  key={cor}
                  type="button"
                  onClick={() => setCorSelecionada(cor)}
                  className={`w-10 h-10 rounded-full transition-transform ${
                    corSelecionada === cor
                      ? "scale-110 ring-2 ring-offset-2 ring-primary"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: cor }}
                  title={cor}
                />
              ))}
              <Input
                type="color"
                value={corSelecionada}
                onChange={(e) => setCorSelecionada(e.target.value)}
                className="w-10 h-10 p-1 cursor-pointer"
                title="Escolher cor personalizada"
              />
            </div>
          </div>

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
              {salvando ? "Criando..." : "Criar Meta"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
