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

## Firebase

O projeto usa o Firestore do Firebase **calebempi** (`js/firebase-config.js`). As regras estão em `firestore.rules` e precisam ser publicadas em *Firestore Database → Regras* sempre que mudarem.

Coleções: `calebe_usuarios` (cadastros, com a senha de 6 números), `calebe_equipes` (equipes) e `calebe_config` (senha do administrador).

> Atenção: o acesso é controlado pelo próprio sistema (telefone + senha de 6 números), sem login do Google. Por isso o banco precisa ficar aberto às coleções do Calebe e as senhas ficam legíveis para quem tiver conhecimento técnico. Oriente as pessoas a não usarem a senha do banco ou do cartão.

## Funcionalidades

**Acesso e permissões**
- Pastor ou líder cria o próprio cadastro com uma **senha de 6 números** e entra com o telefone e a senha.
- Todos podem trocar a senha em **Minha conta**. Quem esquecer a senha fala com o administrador.
- O **administrador** cria a própria senha de 6 números no primeiro acesso à "Área do Administrador" e pode alterá-la depois.
- Na aba **Usuários**, o administrador vê a senha de todos (inclusive a sua) e pode alterá-las.
- O **pastor** informa nome, telefone e distrito (ele é o líder geral do distrito, sem igreja). O **líder** informa também a sua igreja.
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
- **Equipes**: tabela com totais. Clique em uma equipe para ver a ficha completa e baixar o **relatório da equipe em PDF**. Datas já passadas aparecem como *realizado* e as futuras como *agendado*.
- **Evangelismo**: totais, médias, batismos e estudos por equipe e por distrito.
- **Estrutura**: treinamentos (com datas), locais e responsáveis de cada equipe.
- **Divulgação**: quantidade de equipes por meio de divulgação e agenda de datas.
- **Ações**: linha do tempo de Sopões, Mutirões e Feiras de Saúde, com alerta para datas fora do mês previsto.
- **Relatórios**: lista completa de participantes (com a função de cada um) e equipes com seus líderes, em **Excel e PDF**, além de uma planilha completa com as abas Distritos, Equipes, Participantes e Etapas. Resumo por distrito com o pastor de cada um.
- Filtro por distrito e busca (os relatórios seguem o filtro).

