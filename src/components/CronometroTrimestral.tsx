import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Calendar } from "lucide-react";

interface AvaliacaoPilar {
  id?: string;
  pilar: string;
  trimestre: string;
  nota: number;
}

const PILARES = [
  { value: "eu_empreendedor", label: "EU - EMPREENDEDOR" },
  { value: "estruturacao_empresa", label: "ESTRUTURAÇÃO DA EMPRESA" },
  { value: "processos", label: "PROCESSOS" },
  { value: "posicionamento", label: "POSICIONAMENTO" },
  { value: "marketing", label: "MARKETING" },
  { value: "vendas", label: "VENDAS" },
  { value: "construcao_equipe", label: "CONSTRUÇÃO DA EQUIPE" },
  { value: "gestao_equipe", label: "GESTÃO DA EQUIPE" },
  { value: "experiencia_cliente", label: "EXPERIÊNCIA DO CLIENTE" },
];

const getCorNota = (nota: number) => {
  if (nota >= 90) return "bg-green-100 text-green-800 border-green-300";
  if (nota >= 70) return "bg-blue-100 text-blue-800 border-blue-300";
  if (nota >= 50) return "bg-secondary/20 text-secondary border-secondary/30";
  if (nota >= 30) return "bg-orange-100 text-orange-800 border-orange-300";
  return "bg-red-100 text-red-800 border-red-300";
};

export function CronometroTrimestral({ mentoradoId }: { mentoradoId: string }) {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoPilar[]>([]);
  const [anoSelecionado, setAnoSelecionado] = useState(new Date().getFullYear());
  const [editando, setEditando] = useState<{ trimestre: string; pilar: string } | null>(null);
  const [valorTemp, setValorTemp] = useState("");
  const [loading, setLoading] = useState(true);

  const trimestres = [
    `${anoSelecionado}-Q1`,
    `${anoSelecionado}-Q2`,
    `${anoSelecionado}-Q3`,
    `${anoSelecionado}-Q4`,
  ];

  useEffect(() => {
    carregarAvaliacoes();
  }, [mentoradoId, anoSelecionado]);

  const carregarAvaliacoes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("avaliacoes_pilares")
        .select("*")
        .eq("mentorado_id", mentoradoId)
        .like("trimestre", `${anoSelecionado}-%`);

      if (error) throw error;
      setAvaliacoes(data || []);
    } catch (error) {
      console.error("Erro ao carregar avaliações:", error);
      toast.error("Erro ao carregar avaliações");
    } finally {
      setLoading(false);
    }
  };

  const getNota = (pilar: string, trimestre: string) => {
    const avaliacao = avaliacoes.find(
      (a) => a.pilar === pilar && a.trimestre === trimestre
    );
    return avaliacao?.nota;
  };

  const salvarNota = async (pilar: string, trimestre: string, nota: number) => {
    if (nota < 0 || nota > 100) {
      toast.error("A nota deve estar entre 0 e 100");
      return;
    }

    try {
      const { error } = await supabase.from("avaliacoes_pilares").upsert(
        {
          mentorado_id: mentoradoId,
          pilar: pilar as any,
          trimestre,
          nota,
        },
        {
          onConflict: "mentorado_id,trimestre,pilar",
        }
      );

      if (error) throw error;

      toast.success("Avaliação salva com sucesso!");
      carregarAvaliacoes();
    } catch (error) {
      console.error("Erro ao salvar avaliação:", error);
      toast.error("Erro ao salvar avaliação");
    }
  };

  const iniciarEdicao = (pilar: string, trimestre: string) => {
    const nota = getNota(pilar, trimestre);
    setEditando({ pilar, trimestre });
    setValorTemp(nota?.toString() || "");
  };

  const finalizarEdicao = () => {
    if (editando && valorTemp) {
      const nota = parseInt(valorTemp);
      salvarNota(editando.pilar, editando.trimestre, nota);
    }
    setEditando(null);
    setValorTemp("");
  };

  const anos = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Cronômetro Trimestral
            </CardTitle>
            <CardDescription>
              Avalie seu desempenho em cada pilar (0-100) por trimestre
            </CardDescription>
          </div>
          <Select
            value={anoSelecionado.toString()}
            onValueChange={(value) => setAnoSelecionado(parseInt(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {anos.map((ano) => (
                <SelectItem key={ano} value={ano.toString()}>
                  {ano}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            Carregando avaliações...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left p-3 bg-muted font-semibold text-sm">
                    Pilar
                  </th>
                  {trimestres.map((trimestre) => (
                    <th
                      key={trimestre}
                      className="text-center p-3 bg-muted font-semibold text-sm"
                    >
                      Trimestre {trimestre.split("-")[1].replace("Q", "")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PILARES.map(({ value, label }) => (
                  <tr key={value} className="border-b">
                    <td className="p-3 font-medium text-sm">{label}</td>
                    {trimestres.map((trimestre) => {
                      const nota = getNota(value, trimestre);
                      const isEditando =
                        editando?.pilar === value &&
                        editando?.trimestre === trimestre;

                      return (
                        <td key={trimestre} className="p-2 text-center">
                          {isEditando ? (
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              value={valorTemp}
                              onChange={(e) => setValorTemp(e.target.value)}
                              onBlur={finalizarEdicao}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") finalizarEdicao();
                                if (e.key === "Escape") {
                                  setEditando(null);
                                  setValorTemp("");
                                }
                              }}
                              autoFocus
                              className="w-16 text-center mx-auto"
                            />
                          ) : (
                            <button
                              onClick={() => iniciarEdicao(value, trimestre)}
                              className={`w-16 h-10 rounded-md border-2 font-semibold transition-colors ${
                                nota !== undefined
                                  ? getCorNota(nota)
                                  : "bg-muted hover:bg-muted/80 text-muted-foreground border-border"
                              }`}
                            >
                              {nota !== undefined ? nota : "-"}
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-4 text-xs text-muted-foreground flex gap-4">
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded" />
            90-100: Excelente
          </span>
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 bg-blue-100 border-2 border-blue-300 rounded" />
            70-90: Muito bom
          </span>
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 bg-secondary/20 border-2 border-secondary rounded" />
            50-70: Mediano
          </span>
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 bg-orange-100 border-2 border-orange-300 rounded" />
            30-50: Precisa melhorar
          </span>
          <span className="flex items-center gap-1">
            <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded" />
            0-30: Atenção
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
