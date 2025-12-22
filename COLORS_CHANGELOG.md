# Changelog de Cores - Unificação do Sistema Visual

**Data:** 2025-12-22

## Resumo

Unificação das cores secundárias do sistema BORA Acelerar para azul petróleo, com criação de sistema de variáveis CSS centralizadas para facilitar testes futuros com outras cores.

---

## Arquivos Modificados

### 1. `src/index.css`

**Alterações:** Adição de variantes da cor secundária

| Variável | Valor (Dark Mode) | Valor (Light Mode) |
|----------|-------------------|-------------------|
| `--secondary-light` | `195 50% 35%` | `195 40% 80%` |
| `--secondary-subtle` | `195 65% 45% / 0.1` | `195 65% 40% / 0.1` |
| `--secondary-hover` | `195 65% 45% / 0.15` | `195 65% 40% / 0.15` |

### 2. `tailwind.config.ts`

**Alterações:** Extensão do tema secondary com novas variantes

```typescript
secondary: {
  DEFAULT: "hsl(var(--secondary))",
  foreground: "hsl(var(--secondary-foreground))",
  light: "hsl(var(--secondary-light))",      // NOVO
  subtle: "hsl(var(--secondary-subtle))",    // NOVO
  hover: "hsl(var(--secondary-hover))",      // NOVO
},
```

### 3. `src/constants/faixas.ts` (NOVO)

**Descrição:** Arquivo centralizado com definições das faixas de premiação

**Exportações:**
- `FaixaPremiacao` - Interface TypeScript
- `FAIXAS_PREMIACAO` - Array de faixas
- `determinarFaixa()` - Função helper

**Cores das faixas:**
| Faixa | Cor Antiga | Cor Nova | Justificativa |
|-------|-----------|----------|---------------|
| Bronze | `bg-amber-700` | `bg-amber-700` | Mantida (cor semântica) |
| Prata | `bg-slate-400` | `bg-slate-400` | Mantida |
| Ouro | `bg-secondary` | `bg-secondary` | Já usava variável |
| Platina | `bg-cyan-400` | `bg-primary` | **Corrigida para usar tema** |
| Diamante | `bg-blue-600` | `bg-blue-600` | Mantida (cor distintiva) |

### 4. `src/components/ResultadosAdmin.tsx`

**Alterações:**
- Adicionado import: `import { FAIXAS_PREMIACAO, determinarFaixa } from "@/constants/faixas"`
- Removida definição local do array `faixas` (14 linhas)
- Removida função local `determinarFaixa` (4 linhas)
- Substituída referência `faixas` → `FAIXAS_PREMIACAO` (1 ocorrência)

**Substituições de cor:** 1
- Platina: `bg-cyan-400` → `bg-primary`

### 5. `src/pages/Resultados.tsx`

**Alterações:**
- Adicionado import: `import { FAIXAS_PREMIACAO, FaixaPremiacao } from "@/constants/faixas"`
- Removida interface local `FaixaPremiacao` (7 linhas)
- Removida definição local do array `faixas` (7 linhas)
- Substituídas referências `faixas` → `FAIXAS_PREMIACAO` (4 ocorrências)

**Substituições de cor:** 1
- Platina: `bg-cyan-400` → `bg-primary`

---

## Cores Mantidas (por decisão do usuário)

As seguintes cores amarelas foram mantidas por terem propósito semântico:

1. **`#f59e0b`** em `src/components/NovaMetaDialog.tsx`
   - Contexto: Paleta de cores para o usuário escolher a cor de suas metas
   - Motivo: Opção de escolha do usuário, não é cor do sistema

2. **`bg-amber-700`** para faixa Bronze
   - Contexto: Badge de premiação para faixa Bronze
   - Motivo: Significado semântico (bronze = cor acobreada)

---

## Como Testar Outras Cores

Para alterar a cor secundária do sistema inteiro, edite `src/index.css`:

```css
:root {
  /* Alterar estes valores para nova cor */
  --primary: 195 65% 45%;           /* HSL da nova cor principal */
  --primary-glow: 195 65% 55%;      /* Variante mais clara para glow */
  --secondary: 195 40% 20%;         /* Variante mais escura */
  --secondary-light: 195 50% 35%;   /* Variante intermediária */
  --secondary-subtle: 195 65% 45% / 0.1;   /* Com transparência */
  --secondary-hover: 195 65% 45% / 0.15;   /* Para estados hover */
}
```

**Dica:** Mantenha o mesmo matiz (H) e ajuste apenas saturação (S) e luminosidade (L) para manter harmonia visual.

---

## Estatísticas

| Métrica | Quantidade |
|---------|------------|
| Arquivos modificados | 4 |
| Arquivos criados | 2 |
| Linhas de código removidas (duplicação) | ~32 |
| Substituições de cor | 2 |
| Novas variáveis CSS | 6 (3 dark + 3 light) |
