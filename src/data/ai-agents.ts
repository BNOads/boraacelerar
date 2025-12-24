export interface AIAgent {
    id: string;
    category: string;
    title: string;
    url: string;
    order: number;
}

export const INITIAL_AI_AGENTS: AIAgent[] = [
    // Metas
    {
        id: "1",
        category: "Metas",
        title: "Metas pessoais",
        url: "https://chatgpt.com/g/g-693d3dfde064819191ec396762e96ee8-mba-metas-pessoais-2026",
        order: 1,
    },
    {
        id: "2",
        category: "Metas",
        title: "Metas do negócio",
        url: "https://chatgpt.com/g/g-693d7baae68c8191a4ab4ed1639edd65-mba-metas-para-escritorios-e-construtora",
        order: 2,
    },
    // Precificação
    {
        id: "3",
        category: "Precificação",
        title: "Calculadora de custo/hora do escritório",
        url: "https://chatgpt.com/g/g-68753f363fb0819183e161707647d548-boranaobra-calculadora-da-hora-do-escritorio",
        order: 3,
    },
    {
        id: "4",
        category: "Precificação",
        title: "Calculadora de valor de Projeto",
        url: "https://chatgpt.com/g/g-68754d3406ac81918d8d55840722d725-boranaobra-precificacao-de-projeto",
        order: 4,
    },
    {
        id: "5",
        category: "Precificação",
        title: "Calculadora de valor de EVF",
        url: "https://chatgpt.com/g/g-68754de919808191a4dca447e904b99f-mba-precificador-evf",
        order: 5,
    },
    {
        id: "6",
        category: "Precificação",
        title: "Calculadora de valor fixo mensal de Obra",
        url: "https://chatgpt.com/g/g-687552be41a08191993b9ad7a0ed2705-mba-precificador-de-custo-fixo-de-obra",
        order: 6,
    },
    // Posicionamento
    {
        id: "7",
        category: "Posicionamento",
        title: "Posicionamento pessoal",
        url: "https://chatgpt.com/g/g-686451db18a48191b82471c2e12b423c-mba-posicionamento-estrategico",
        order: 7,
    },
    {
        id: "8",
        category: "Posicionamento",
        title: "Agente de posicionamento de estratégia da empresa",
        url: "https://chatgpt.com/g/g-6891ed5302a0819181dd2eef80557650-mba-posicionamento-empresarial",
        order: 8,
    },
    // Marketing
    {
        id: "9",
        category: "Marketing",
        title: "Organizador de perfil profissional (bio e posts fixados)",
        url: "https://chatgpt.com/g/g-6864770bdb0c819193664fc8e6dbec06-mba-organizador-de-perfil-profissional",
        order: 9,
    },
    {
        id: "10",
        category: "Marketing",
        title: "Produção de Conteúdo",
        url: "https://chatgpt.com/g/g-6839cc7005f88191aa6b98d1c0f95a11-ace-agente-de-producao-de-conteudo",
        order: 10,
    },
    {
        id: "11",
        category: "Marketing",
        title: "Produção de conteúdo (c1, c2, c3)",
        url: "https://chatgpt.com/g/g-68be3d13a8ec8191ae908402c4e7cdaa-mba-producao-de-conteudo-c1-c2-e-c3",
        order: 11,
    },
    // Vendas
    {
        id: "12",
        category: "Vendas",
        title: "Criação da Jornada do Cliente",
        url: "https://chatgpt.com/g/g-6875a39fea8c819181846aca5aea3057-mba-construtor-de-jornada-do-cliente",
        order: 12,
    },
    {
        id: "13",
        category: "Vendas",
        title: "Estruturação de Campanhas de Vendas",
        url: "https://chatgpt.com/g/g-684d572390cc8191a7362c85d163e0da-ace-criacao-de-campanhas-de-vendas-conteudo",
        order: 13,
    },
    {
        id: "14",
        category: "Vendas",
        title: "Estratégia de Caixa Rápido",
        url: "https://chatgpt.com/g/g-68759980cf488191bdc3adb7c3af7688-mba-assistente-de-caixa-rapido",
        order: 14,
    },
    {
        id: "15",
        category: "Vendas",
        title: "Criação da Proposta Irresistível",
        url: "https://chatgpt.com/g/g-6874fca635348191a595871bb3e11ffd-mba-assistente-de-proposta-irresistivel",
        order: 15,
    },
    // Projetos
    {
        id: "16",
        category: "Projetos",
        title: "Renderizador de projetos",
        url: "https://chatgpt.com/g/g-68408938b23481918104237904e496ba-boranaobra-renderizador-de-projetos",
        order: 16,
    },
    // Obras
    {
        id: "17",
        category: "Obras",
        title: "Agente profissional de campo",
        url: "https://chatgpt.com/g/g-xfw2K2cNJ-agente-profissional-de-campo",
        order: 17,
    },
    {
        id: "18",
        category: "Obras",
        title: "Agente de planejamento de obra",
        url: "https://chatgpt.com/g/g-6734b4dd282c81908061652f23285871-agente-de-planejamento-de-obra/",
        order: 18,
    },
];
