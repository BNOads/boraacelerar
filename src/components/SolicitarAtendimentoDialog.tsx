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
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SolicitarAtendimentoDialogProps {
  navegadorId?: string;
}

export function SolicitarAtendimentoDialog({ navegadorId }: SolicitarAtendimentoDialogProps) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    navegador_id: navegadorId || "",
    data: "",
    hora: "",
    tipo_atendimento: "",
    canal: "",
    assunto: "",
    observacoes: "",
  });

  // Buscar mentorado_id do usuário
  const { data: mentorado } = useQuery({
    queryKey: ["mentorado-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("mentorados")
        .select("id")
        .eq("user_id", user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Buscar navegadores ativos
  const { data: navegadores } = useQuery({
    queryKey: ["navegadores-ativos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("navegadores")
        .select("id, nome, cargo, profiles(nome_completo)")
        .eq("ativo", true);
      if (error) throw error;
      return data;
    },
    enabled: open && !navegadorId,
  });

  const solicitarMutation = useMutation({
    mutationFn: async () => {
      if (!mentorado?.id) throw new Error("Mentorado não encontrado");
      
      const dataHora = new Date(`${formData.data}T${formData.hora}`);
      
      const solicitacao: TablesInsert<"solicitacoes_agendamento"> = {
        mentorado_id: mentorado.id,
        navegador_id: formData.navegador_id,
        data_hora: dataHora.toISOString(),
        tipo_atendimento: formData.tipo_atendimento,
        canal: formData.canal as any,
        assunto: formData.assunto || null,
        observacoes: formData.observacoes || null,
        status: "pendente",
      } as const;

      const { error } = await supabase
        .from("solicitacoes_agendamento")
        .insert([solicitacao]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["solicitacoes"] });
      toast.success("Solicitação enviada com sucesso! O navegador entrará em contato em breve.");
      setOpen(false);
      setFormData({
        navegador_id: navegadorId || "",
        data: "",
        hora: "",
        tipo_atendimento: "",
        canal: "",
        assunto: "",
        observacoes: "",
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Erro ao enviar solicitação");
    },
  });

  const minDate = format(new Date(), "yyyy-MM-dd");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full bg-accent hover:bg-accent/90">
          <CalendarIcon className="mr-2 h-4 w-4" />
          Solicitar Atendimento
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Solicitar Atendimento</DialogTitle>
          <DialogDescription>
            Preencha os detalhes para agendar um atendimento com um navegador
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {!navegadorId && (
            <div className="space-y-2">
              <Label htmlFor="navegador">Navegador *</Label>
              <Select value={formData.navegador_id} onValueChange={(value) => setFormData({ ...formData, navegador_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um navegador" />
                </SelectTrigger>
                <SelectContent>
                  {navegadores?.map((nav) => (
                    <SelectItem key={nav.id} value={nav.id}>
                      {nav.nome || nav.profiles?.nome_completo} - {nav.cargo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="data">Data *</Label>
              <Input
                id="data"
                type="date"
                min={minDate}
                value={formData.data}
                onChange={(e) => setFormData({ ...formData, data: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora">Hora *</Label>
              <Input
                id="hora"
                type="time"
                value={formData.hora}
                onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Atendimento *</Label>
            <Select value={formData.tipo_atendimento} onValueChange={(value) => setFormData({ ...formData, tipo_atendimento: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Consultoria">Consultoria</SelectItem>
                <SelectItem value="Dúvida Específica">Dúvida Específica</SelectItem>
                <SelectItem value="Revisão de Material">Revisão de Material</SelectItem>
                <SelectItem value="Acompanhamento">Acompanhamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="canal">Canal de Atendimento *</Label>
            <Select value={formData.canal} onValueChange={(value) => setFormData({ ...formData, canal: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o canal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                <SelectItem value="Ligação">Ligação</SelectItem>
                <SelectItem value="Email">Email</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="assunto">Assunto</Label>
            <Input
              id="assunto"
              value={formData.assunto}
              onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
              placeholder="Ex: Dúvidas sobre estratégia de marketing"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              value={formData.observacoes}
              onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              placeholder="Adicione detalhes que possam ajudar o navegador..."
              rows={4}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1 bg-primary hover:bg-primary/90"
            onClick={() => solicitarMutation.mutate()}
            disabled={
              !formData.navegador_id ||
              !formData.data ||
              !formData.hora ||
              !formData.tipo_atendimento ||
              !formData.canal ||
              solicitarMutation.isPending
            }
          >
            {solicitarMutation.isPending ? "Enviando..." : "Enviar Solicitação"}
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
