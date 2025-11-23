import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { addWeeks, addDays, addMonths } from "date-fns";

const tiposMentoria = ["Mentoria", "Imersão", "Live Especial"] as const;
const tiposRecorrencia = [
  { value: "nenhuma", label: "Não repetir" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal (a cada 2 semanas)" },
  { value: "mensal", label: "Mensal" },
] as const;

export function AdminAgendaDialog() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    tipo: "" as (typeof tiposMentoria)[number] | "",
    data_hora: "",
    link_zoom: "",
    recorrencia: "nenhuma" as "nenhuma" | "semanal" | "quinzenal" | "mensal",
    data_fim_recorrencia: "",
  });

  const calcularEventosRecorrentes = (dataInicial: string, dataFim: string, recorrencia: string) => {
    if (recorrencia === "nenhuma") return [];
    
    const datas: string[] = [];
    let dataAtual = new Date(dataInicial);
    const dataLimite = new Date(dataFim);
    
    // Adicionar até 100 ocorrências (limite de segurança)
    let contador = 0;
    const MAX_OCORRENCIAS = 100;
    
    while (dataAtual <= dataLimite && contador < MAX_OCORRENCIAS) {
      switch (recorrencia) {
        case "semanal":
          dataAtual = addWeeks(dataAtual, 1);
          break;
        case "quinzenal":
          dataAtual = addWeeks(dataAtual, 2);
          break;
        case "mensal":
          dataAtual = addMonths(dataAtual, 1);
          break;
      }
      
      if (dataAtual <= dataLimite) {
        datas.push(dataAtual.toISOString());
      }
      contador++;
    }
    
    return datas;
  };

  const addMentoriaMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      // Inserir evento principal
      const insertDataPrincipal: TablesInsert<"agenda_mentoria"> = {
        titulo: data.titulo,
        descricao: data.descricao,
        tipo: data.tipo as (typeof tiposMentoria)[number],
        data_hora: data.data_hora,
        link_zoom: data.link_zoom,
        recorrencia: data.recorrencia,
        data_fim_recorrencia: data.recorrencia !== "nenhuma" ? data.data_fim_recorrencia : null,
        evento_pai_id: null,
      };
      
      const { data: eventoPrincipal, error: erroPrincipal } = await supabase
        .from("agenda_mentoria")
        .insert([insertDataPrincipal])
        .select()
        .single();
      
      if (erroPrincipal) throw erroPrincipal;
      
      // Se houver recorrência, criar eventos filhos
      if (data.recorrencia !== "nenhuma" && data.data_fim_recorrencia) {
        const datasRecorrentes = calcularEventosRecorrentes(
          data.data_hora,
          data.data_fim_recorrencia,
          data.recorrencia
        );
        
        if (datasRecorrentes.length > 0) {
          const eventosRecorrentes = datasRecorrentes.map(dataHora => ({
            titulo: data.titulo,
            descricao: data.descricao,
            tipo: data.tipo as (typeof tiposMentoria)[number],
            data_hora: dataHora,
            link_zoom: data.link_zoom,
            recorrencia: data.recorrencia,
            data_fim_recorrencia: data.data_fim_recorrencia,
            evento_pai_id: eventoPrincipal.id,
          }));
          
          const { error: erroRecorrentes } = await supabase
            .from("agenda_mentoria")
            .insert(eventosRecorrentes);
          
          if (erroRecorrentes) throw erroRecorrentes;
          
          return { total: datasRecorrentes.length + 1 };
        }
      }
      
      return { total: 1 };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["agenda"] });
      if (data.total > 1) {
        toast.success(`${data.total} eventos agendados com sucesso!`);
      } else {
        toast.success("Evento agendado com sucesso!");
      }
      setOpen(false);
      setFormData({
        titulo: "",
        descricao: "",
        tipo: "",
        data_hora: "",
        link_zoom: "",
        recorrencia: "nenhuma",
        data_fim_recorrencia: "",
      });
    },
    onError: (error) => {
      console.error("Erro ao agendar:", error);
      toast.error("Erro ao agendar evento");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-primary hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Agendar Mentoria
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agendar Nova Mentoria</DialogTitle>
          <DialogDescription>
            Adicione um novo encontro à agenda de mentorias
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
              placeholder="Título da mentoria"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo *</Label>
            <Select value={formData.tipo || undefined} onValueChange={(value) => setFormData({ ...formData, tipo: value as typeof formData.tipo })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                {tiposMentoria.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              placeholder="Descrição da mentoria"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data_hora">Data e Hora *</Label>
            <Input
              id="data_hora"
              type="datetime-local"
              value={formData.data_hora}
              onChange={(e) => setFormData({ ...formData, data_hora: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link_zoom">Link do Zoom</Label>
            <Input
              id="link_zoom"
              type="url"
              value={formData.link_zoom}
              onChange={(e) => setFormData({ ...formData, link_zoom: e.target.value })}
              placeholder="https://zoom.us/..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recorrencia">Recorrência</Label>
            <Select 
              value={formData.recorrencia} 
              onValueChange={(value) => setFormData({ 
                ...formData, 
                recorrencia: value as typeof formData.recorrencia,
                data_fim_recorrencia: value === "nenhuma" ? "" : formData.data_fim_recorrencia
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a recorrência" />
              </SelectTrigger>
              <SelectContent>
                {tiposRecorrencia.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.recorrencia !== "nenhuma" && (
            <div className="space-y-2">
              <Label htmlFor="data_fim_recorrencia">Repetir até</Label>
              <Input
                id="data_fim_recorrencia"
                type="date"
                value={formData.data_fim_recorrencia}
                onChange={(e) => setFormData({ ...formData, data_fim_recorrencia: e.target.value })}
                min={formData.data_hora ? formData.data_hora.split('T')[0] : undefined}
              />
              <p className="text-xs text-muted-foreground">
                Os eventos serão criados automaticamente até esta data
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => addMentoriaMutation.mutate(formData)}
            disabled={
              !formData.titulo || 
              !formData.tipo || 
              !formData.data_hora || 
              (formData.recorrencia !== "nenhuma" && !formData.data_fim_recorrencia) ||
              addMentoriaMutation.isPending
            }
          >
            {addMentoriaMutation.isPending ? "Agendando..." : "Agendar"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
