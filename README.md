# Calebe 2027 — Sistema de Acompanhamento

Aplicação web para acompanhar as equipes do **Calebe 2027**: pastores e líderes cadastram suas equipes e preenchem cada etapa; o administrador acompanha tudo consolidado automaticamente.

## Como executar

Requer apenas **Node.js 18+** (sem dependências externas).

```bash
npm start          # http://localhost:3000
npm test           # testes da API
```

Variáveis opcionais: `PORT` (padrão `3000`) e `DATA_DIR` (padrão `./data`). Localmente, os dados ficam em `data/db.json`. Faça backup desse arquivo.

## Publicação no Vercel

No Vercel o disco não guarda arquivos, por isso os dados ficam num banco **Upstash Redis** (há plano gratuito).

1. No painel do Vercel, abra o projeto e vá em **Storage** (ou **Integrations → Marketplace**).
2. Escolha **Upstash → Redis**, crie o banco e conecte-o a este projeto (todos os ambientes).
   Isso cria automaticamente as variáveis `KV_REST_API_URL` e `KV_REST_API_TOKEN`
   (ou `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN`; as duas formas funcionam).
3. Em **Deployments**, faça um **Redeploy** para aplicar as variáveis.

Sem o banco configurado, o site abre normalmente, mas mostra o aviso "Banco de dados não configurado" e não salva cadastros.

O `vercel.json` já define `public/` como pasta do site e envia todas as rotas `/api/*` para a função `api/index.js`.

## Funcionalidades

**Acesso (sem senha nesta fase)**
- Pastor ou líder cria o cadastro (nome, telefone, igreja, distrito) e entra informando o telefone.
- Botão "Área do Administrador" na tela inicial.

**Etapas do Calebe (por equipe)**
1. **Equipe**: participantes com nome e telefone, com contagem automática de Calebes inscritos. Aviso do prazo de cadastro **até 31/10/2026**, com contagem regressiva.
2. **Responsáveis**: visitação, pregador, louvor, crianças, sonoplastia, recepção, mídia, apoio, brindes e lanche.
3. **Treinamento**: outubro, novembro e dezembro, cada um com "realizado" e data.
4. **Local**: campo de texto livre.
5. **Divulgação**: faixa, convites, carro de som e redes sociais, cada um com data.
6. **Alvos**: alvo de batismo e quantidade de estudos bíblicos.
7. **Ações**: Sopão (outubro), Mutirão de Visitas (novembro) e Feira de Saúde (janeiro), com validação do mês.

As alterações são salvas automaticamente. O progresso de cada etapa aparece em tempo real.

**Área do Administrador**
- **Visão geral**: equipes cadastradas, Calebes inscritos, alvo total de batismos, alvo de estudantes da Bíblia, equipes e Calebes por distrito, andamento, treinamentos e meios de divulgação.
- **Equipes**: tabela com totais. Clique em uma equipe para ver todos os detalhes.
- **Evangelismo**: totais, médias, batismos e estudos por equipe e por distrito.
- **Estrutura**: treinamentos (com datas), locais e responsáveis de cada equipe.
- **Divulgação**: quantidade de equipes por meio de divulgação e agenda de datas.
- **Ações**: linha do tempo de Sopões, Mutirões e Feiras de Saúde, com alerta para datas fora do mês previsto.
- Filtro por distrito, busca e **exportação para planilha (CSV)**.

## Estrutura

```
server.js          Servidor local (npm start)
api/index.js       Função serverless do Vercel
lib/api.js         Rotas da API (compartilhadas entre local e Vercel)
lib/storage.js     Armazenamento: Upstash Redis ou arquivo JSON local
vercel.json        Configuração do Vercel
public/            Interface (HTML, CSS e JavaScript sem framework)
test/              Testes da API (node --test)
```

> Observação: como o acesso é sem senha, a Área do Administrador fica aberta a quem acessar o sistema. Antes de publicar, adicione autenticação.
