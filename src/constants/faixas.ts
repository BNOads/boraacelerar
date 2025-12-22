/**
 * Definições das faixas de premiação do sistema BORA Acelerar
 *
 * As cores seguem o sistema de design:
 * - Bronze: bg-amber-700 (cor semântica - mantida para representar bronze)
 * - Prata: bg-slate-400 (cor semântica)
 * - Ouro: bg-secondary (usa variável do tema)
 * - Platina: bg-primary (usa variável do tema - azul petróleo)
 * - Diamante: bg-blue-600 (cor distintiva)
 */

export interface FaixaPremiacao {
  nome: string;
  min: number;
  max: number | null;
  cor: string;
  emoji: string;
}

export const FAIXAS_PREMIACAO: FaixaPremiacao[] = [
  { nome: "Bronze", min: 10000, max: 24999, cor: "bg-amber-700", emoji: "🥉" },
  { nome: "Prata", min: 25000, max: 49999, cor: "bg-slate-400", emoji: "🥈" },
  { nome: "Ouro", min: 50000, max: 99999, cor: "bg-secondary", emoji: "🥇" },
  { nome: "Platina", min: 100000, max: 249999, cor: "bg-primary", emoji: "💎" },
  { nome: "Diamante", min: 250000, max: null, cor: "bg-blue-600", emoji: "💠" },
];

/**
 * Determina a faixa de premiação baseada no faturamento médio mensal
 */
export const determinarFaixa = (faturamentoMedio: number): FaixaPremiacao => {
  return FAIXAS_PREMIACAO.find(f =>
    faturamentoMedio >= f.min && (f.max === null || faturamentoMedio <= f.max)
  ) || FAIXAS_PREMIACAO[0];
};
