# Sistema de Controle de Serviços e Relatórios

Aplicação web para registrar os serviços realizados pela equipe (Instalação, Manutenção, Retenção, Retirada de Equipamentos e Pós-venda), acompanhar a produtividade dos colaboradores e gerar relatórios diários, semanais e mensais com exportação em PDF e Excel.

> **Importante:** este é um projeto separado das suas planilhas/app de Pós-Venda, Retenção e Retirada de Equipamentos. Este sistema é uma central completa com banco de dados próprio (não usa Google Sheets).

Esta versão já está estruturada para deploy na **Vercel**.

---

## 1. Estrutura do projeto

```
sistema-servicos/
├── server.js              # ponto de entrada (Express)
├── package.json
├── vercel.json             # configuração de duração da função na Vercel
├── .env.example            # modelo de configuração (copie para .env)
├── controllers/             # regras de negócio de cada módulo
├── routes/                  # rotas da API
├── utils/                   # geração de PDF e Excel
├── db/
│   ├── schema.sql           # estrutura das tabelas + dados de exemplo
│   ├── setup.js             # script que aplica o schema.sql no banco
│   └── pool.js               # conexão com o PostgreSQL
└── public/                   # frontend (servido como site estático na Vercel)
    ├── index.html             # Dashboard
    ├── servicos.html          # Lançamento de serviços
    ├── colaboradores.html     # Cadastro de colaboradores
    ├── relatorios.html        # Relatórios e exportação
    ├── css/style.css
    └── js/
```

## 2. Requisitos

- Node.js 18 ou superior
- Uma conta em um Postgres "serverless-friendly": **Neon** (neon.tech) ou **Supabase** (supabase.com) — ambos têm plano gratuito e funcionam bem com a Vercel
- Conta na Vercel (vercel.com)

> **Por que não um PostgreSQL "tradicional"?** A Vercel roda sua aplicação como função serverless: a cada chamada, uma nova execução pode subir. Um Postgres comum não aguenta bem muitas conexões simultâneas nesse modelo. Neon e Supabase resolvem isso com um modo de conexão em pool (pgbouncer), feito exatamente para esse cenário.

---

## 3. Rodando local (antes de subir pra Vercel)

```bash
npm install
cp .env.example .env
```

Edite o `.env` com a connection string do seu banco (veja a seção 4) e depois:

```bash
npm run db:setup   # cria as tabelas e os colaboradores de exemplo
npm start          # http://localhost:3000
```

## 4. Configurando o banco (Neon ou Supabase)

1. Crie um banco gratuito em [neon.tech](https://neon.tech) ou [supabase.com](https://supabase.com).
2. Copie a **connection string** que eles fornecem (algo como `postgresql://usuario:senha@host/banco?sslmode=require`).
3. Cole essa string na variável `DATABASE_URL` do seu `.env` (local) e, depois, nas variáveis de ambiente do projeto na Vercel (passo 5.3).
4. Rode `npm run db:setup` (local, apontando pro banco na nuvem) para criar as tabelas.

## 5. Deploy na Vercel

### 5.1. Subir o projeto para o GitHub

Crie um repositório no GitHub e suba esta pasta (sem o `node_modules`, que já está no `.gitignore`).

### 5.2. Importar na Vercel

1. Acesse [vercel.com/new](https://vercel.com/new) e conecte o repositório do GitHub.
2. A Vercel detecta automaticamente que é um projeto Express (zero-config) — não precisa mudar nada no "Build & Output Settings".

### 5.3. Configurar as variáveis de ambiente

No painel do projeto na Vercel → **Settings → Environment Variables**, adicione:

| Nome | Valor |
|---|---|
| `DATABASE_URL` | a connection string do Neon/Supabase (igual à do seu `.env`) |

### 5.4. Deploy

Clique em **Deploy**. Depois disso, qualquer `git push` para a branch principal gera um novo deploy automático.

### 5.5. Sobre o plano da Vercel

- O plano **Hobby (gratuito)** da Vercel é restrito a uso pessoal/não-comercial pelas políticas deles. Como este sistema é para uso da empresa, o recomendado é o plano **Pro** (a partir de US$ 20/mês por usuário).
- O plano Pro também aumenta o tempo máximo de execução das funções (útil para relatórios maiores) e o limite de CPU ativa por mês.

---

## 6. Telas do sistema

| Tela | O que faz |
|---|---|
| **Dashboard** | Indicadores do dia/semana/mês, ranking de produtividade, gráfico de barras por colaborador, gráfico de pizza por categoria e gráfico de evolução (diário/semanal/mensal) |
| **Lançar Serviço** | Formulário único que se adapta ao tipo de serviço escolhido (Instalação, Manutenção, Retenção, Retirada, Pós-venda) |
| **Colaboradores** | Cadastro, edição, ativação/inativação e remoção da equipe |
| **Relatórios** | Geração de relatório diário (lista de atendimentos) e semanal/mensal (consolidado por colaborador), com exportação em PDF e Excel |

## 7. Principais rotas da API

```
GET    /api/colaboradores
POST   /api/colaboradores
PUT    /api/colaboradores/:id
DELETE /api/colaboradores/:id

GET    /api/servicos?tipo=&colaborador_id=&data_inicio=&data_fim=
POST   /api/servicos
PUT    /api/servicos/:id
DELETE /api/servicos/:id

GET    /api/dashboard/resumo
GET    /api/dashboard/produtividade
GET    /api/dashboard/distribuicao
GET    /api/dashboard/evolucao?periodo=diario|semanal|mensal

GET    /api/relatorios/diario?data=YYYY-MM-DD
GET    /api/relatorios/semanal?data_inicio=&data_fim=
GET    /api/relatorios/mensal?mes=&ano=
GET    /api/relatorios/exportar/pdf?formato=diario|semanal|mensal&...
GET    /api/relatorios/exportar/excel?formato=diario|semanal|mensal&...
```

## 8. O que falta configurar antes de usar com a equipe

- [ ] Criar o banco no Neon ou Supabase e colocar a `DATABASE_URL` no `.env` e na Vercel
- [ ] Revisar a lista de colaboradores de exemplo (Colaboradores → Editar/Remover)
- [ ] Decidir o plano da Vercel (Hobby x Pro — ver seção 5.5)
- [ ] Se quiser tela de login, isso ainda não está incluído (o sistema atual não tem autenticação)

## 9. Próximos passos possíveis

- Autenticação por usuário/senha (cada colaborador loga com seu próprio acesso)
- Edição de serviços já lançados direto na lista de "Últimos Lançamentos"
- Filtros avançados na tela de Relatórios (por colaborador e tipo de serviço)
