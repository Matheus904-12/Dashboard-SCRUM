# 🏭 InovaMold - Dashboard de Logística & Rastreabilidade

Sistema Enterprise de monitoramento logístico ponta a ponta, desenvolvido para a **InovaMold Polímeros**. Este dashboard oferece visibilidade completa sobre o ciclo de vida dos pedidos, desde a criação no comercial até o envio final, integrando dados de produção, estoque e suprimentos.

![InovaMold Dashboard](https://img.shields.io/badge/Status-Produção-green)
![Supabase](https://img.shields.io/badge/Backend-Supabase-blueviolet)
![Chart.js](https://img.shields.io/badge/Charts-Chart.js-FF6384)

## 🚀 Demonstração ao Vivo
Acesse o sistema em: [https://matheus904-12.github.io/Dashboard-SCRUM/](https://matheus904-12.github.io/Dashboard-SCRUM/)

---

## ✨ Funcionalidades Principais

- **📦 CRUD Completo de Pedidos**: Interface administrativa robusta para Criar, Visualizar, Editar e Excluir pedidos em tempo real.
- **🕒 Timeline de Rastreabilidade**: Stepper horizontal dinâmico com 8 etapas (Comercial → PCP → Produção → Estoque → Expedição → Envio).
- **📊 Gráficos de Eficiência**: Monitoramento de permanência por etapa comparado à média histórica da fábrica.
- **🚨 Gestão de Risco**: Tabela automatizada que identifica gargalos e pedidos retidos na cadeia de suprimentos.
- **🚦 Semáforo de Insumos**: Indicadores visuais de saúde de estoque para matérias-primas críticas (Polímeros, Aditivos, Pigmentos).
- **🚛 Monitoramento Logístico**: Integração de dados de transportadoras e códigos de rastreio.
- **🔔 Notificações em Tempo Real**: Feedback visual via Toastify para todas as operações de banco de dados.

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5 Semântico, CSS3 (Vanilla com Variáveis), JavaScript (ES6+).
- **Banco de Dados**: PostgreSQL hospedado no **Supabase**.
- **Iconografia**: Lucide Icons (SVG).
- **Gráficos**: Chart.js.
- **Alertas**: Toastify JS.

## ⚙️ Configuração e Instalação

### 1. Requisitos do Banco de Dados
Para que o sistema funcione com seus próprios dados, você deve criar as tabelas no Supabase utilizando o script fornecido:
- Execute o conteúdo de [`init.sql`](init.sql) no **SQL Editor** do seu painel Supabase.

### 2. Variáveis de Conexão
No arquivo [`app.js`](app.js), configure as constantes de conexão:
```javascript
const SUPABASE_URL = 'SUA_URL_AQUI';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_AQUI';
```

### 3. Execução Local
Basta abrir o arquivo `index.html` em qualquer navegador moderno ou utilizar o link do GitHub Pages para a versão de produção.

## 📂 Estrutura do Projeto

- `index.html`: Estrutura principal e modais.
- `style.css`: Design System InovaMold (Enterprise Style).
- `app.js`: Lógica de negócio, integração Supabase e Charts.
- `init.sql`: Schema do banco de dados PostgreSQL.

---

Desenhado e desenvolvido para otimização de processos industriais. **InovaMold Polímeros © 2026**.
