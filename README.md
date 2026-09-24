# Calebe 2027 — Sistema de Acompanhamento

Site para acompanhar as equipes do **Calebe 2027**: pastores e líderes cadastram suas equipes e preenchem cada etapa; o administrador acompanha tudo consolidado automaticamente.

Site estático (HTML, CSS e JavaScript) com banco de dados **Firebase Firestore**, publicado no **Vercel**.

## Estrutura

```
index.html              Página do sistema
css/styles.css          Visual
js/app.js               Telas e regras do sistema
js/firebase-config.js   Configuração do projeto Firebase
assets/                 Logo, ícones e bibliotecas de Excel/PDF (assets/vendor)
firestore.rules         Regras do banco (Firestore)
firebase.json           Configuração do Firebase
vercel.json             Configuração do Vercel
```

## Configurar o Firebase (uma vez)

1. Em https://console.firebase.google.com crie o projeto (ex.: `calebe-2027`).
2. **Firestore Database → Criar banco de dados** (modo produção, região `southamerica-east1`).
3. **Firestore → Regras**: cole o conteúdo de `firestore.rules` e publique.
4. **Configurações do projeto → Seus apps → Web (`</>`)**: registre o app e copie o `firebaseConfig`.
5. Cole esses valores em `js/firebase-config.js`.

Enquanto o arquivo não for preenchido, o site funciona em **modo local**: os dados ficam salvos apenas no navegador de quem está usando (útil para testar). Depois de preencher, o site passa a usar o Firestore automaticamente.

## Funcionalidades

**Acesso e permissões (sem senha nesta fase)**
- Pastor ou líder cria o cadastro (nome, telefone, distrito e igreja) e entra informando o telefone.
- 24 distritos fixos. **Cada distrito tem um único pastor** e pode ter vários líderes e várias equipes.
- **Pastor e líder veem apenas o próprio distrito** (Calebes inscritos, alvos, equipes e todas as abas de acompanhamento).
- O pastor edita todas as equipes do distrito; o líder edita as equipes que cadastrou e vê as demais em modo de consulta.
- Cada pessoa da equipe é marcada como **participante** ou **líder**.
- Somente o **administrador** vê o geral de todos os distritos.

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
- **Relatórios**: lista completa de participantes (com a função de cada um) e equipes com seus líderes, em **Excel e PDF**, além de uma planilha completa com as abas Distritos, Equipes, Participantes e Etapas. Resumo por distrito com o pastor de cada um.
- Filtro por distrito e busca (os relatórios seguem o filtro).

> Observação: como o acesso é sem senha, as regras do Firestore permitem leitura e escrita nas coleções do Calebe e a Área do Administrador fica aberta a quem acessar o site. Antes de divulgar amplamente, adicione autenticação.
