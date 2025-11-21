import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TablesInsert } from "@/integrations/supabase/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus } from "lucide-react";

const tiposConteudo = ["Vídeo", "PDF", "Link", "Checklist"] as const;
const pilares = ["Empreendedor", "Estruturação", "Marketing", "Vendas", "Gestão", "Finanças"] as const;

export function AdminMembrosDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    tipo: "" as (typeof tiposConteudo)[number] | "",
    pilar: "" as (typeof pilares)[number] | "",
    url: "",
    data_publicacao: new Date().toISOString().split('T')[0],
    ativo: true,
  });

  // Buscar mentorados para atribuição
  const { data: mentorados } = useQuery({
    queryKey: ["mentorados-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mentorados")
        .select("id, profiles(nome_completo, apelido)")
        .eq("status", "ativo");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const [selectedMentorado, setSelectedMentorado] = useState("todos");

  const addConteudoMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Criar o conteúdo
      const insertData: TablesInsert<"conteudo_direcionado"> = {
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo as (typeof tiposConteudo)[number],
        pilar: data.pilar ? (data.pilar as (typeof pilares)[number]) : null,
        url: data.url,
        data_publicacao: data.data_publicacao,
        ativo: data.ativo,
      };
      const { data: conteudo, error: conteudoError } = await supabase
        .from("conteudo_direcionado")
        .insert([insertData])
        .select()
        .single();
      
      if (conteudoError) throw conteudoError;

      // Se mentorado selecionado (não "todos"), criar atribuição
      if (selectedMentorado && selectedMentorado !== "todos" && conteudo) {
        const atribData: TablesInsert<"atribuicoes_conteudo"> = {
          conteudo_id: conteudo.id,
          audience_type: "mentorado",
          mentorado_id: selectedMentorado,
        };
        const { error: atribError } = await supabase
          .from("atribuicoes_conteudo")
          .insert([atribData]);
        
        if (atribError) throw atribError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conteudo-direcionado"] });
      toast.success("Conteúdo adicionado com sucesso!");
      setOpen(false);
      setFormData({
        titulo: "",
        descricao: "",
        tipo: "",
        pilar: "",
        url: "",
        data_publicacao: new Date().toISOString().split('T')[0],
        ativo: true,
      });
      setSelectedMentorado("todos");
    },
    onError: () => {
      toast.error("Erro ao adicionar conteúdo");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Conteúdo
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Adicionar Conteúdo para Membros</DialogTitle>
          <DialogDescription>
            Adicione um novo conteúdo direcionado aos membros
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Título do conteúdo"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo *</Label>
              <Select value={formData.tipo || undefined} onValueChange={(value) => setFormData({ ...formData, tipo: value as typeof formData.tipo })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposConteudo.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>
                      {tipo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pilar">Pilar</Label>
              <Select value={formData.pilar || undefined} onValueChange={(value) => setFormData({ ...formData, pilar: value as typeof formData.pilar })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o pilar" />
                </SelectTrigger>
                <SelectContent>
                  {pilares.map((pilar) => (
                    <SelectItem key={pilar} value={pilar}>
                      {pilar}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição do conteúdo"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="url">URL do Conteúdo</Label>
            <Input
              id="url"
              type="url"
              value={formData.url}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mentorado">Atribuir a Mentorado (opcional)</Label>
            <Select value={selectedMentorado} onValueChange={setSelectedMentorado}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os membros" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os membros</SelectItem>
                {mentorados?.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.profiles?.nome_completo || m.profiles?.apelido}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => addConteudoMutation.mutate(formData)}
            disabled={!formData.titulo || !formData.tipo || addConteudoMutation.isPending}
          >
            {addConteudoMutation.isPending ? "Adicionando..." : "Adicionar"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
