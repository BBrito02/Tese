PROJETO: Dashboard Designer
DATA: 24/11/2025
AUTOR: Bernardo Geada de Brito

---

## RESUMO

A ferramenta permite desenhar e prototipar Dashboards de Visualização de Informação. O objetivo é facilitar a criação de layouts, a definição da gramática visual dos gráficos e a modelação da interatividade entre os vários componentes.

---

## FUNCIONALIDADES PRINCIPAIS

1. Gestão de Layout e Composição

   - Drag-and-Drop: Construção do dashboard arrastando componentes do menu lateral diretamente para o canvas.
   - Criação de Hierarquias: Possibilidade de colocar componentes dentro de outros (ex: Gráficos dentro de Visualizações) para organizar o layout.
   - Métodos de Composição: A hierarquia pode ser criada de duas formas:
     a) Arrastando um componente do meu lateral diretamente para cima de outro no canvas;
     b) Utilizando o menu contextual ("Actions") de um componente existente para adicionar filhos.

2. Configuração de Dados e Visualização

   - Definição de Dados: Interface para adicionar e listar atributos de dados (Data Items) associados a cada componente.
   - Gramática Visual: Seleção do tipo de gráfico (Bar, Line, Scatter, etc.) e mapeamento de atributos de dados para variáveis visuais (Cor, Tamanho, Forma, Texto).
   - Imagens de Referência: Funcionalidade para carregar screenshots reais de gráficos já existentes (ex: do Tableau ou PowerBI) para substituir o ícone padrão, permitindo um protótipo visualmente fiel ao resultado final.

3. Modelação de Interatividade

   - Criação de Fluxos: Sistema visual de criação de ligações para ligar componentes e definir dependências.
   - Especificação de Interações: Configuração detalhada da ação ("Click" ou "Hover") e do resultado no sistema (ex: Filtragem, Highlight, Dashboard, Link).
   - Tooltips Dinâmicos: Criação de componentes de Tooltip e associação visual direta a gráficos específicos.

4. Persistência e Portabilidade
   - Guardar/Carregar: O sistema exporta o projeto num formato (.dashboard).
   - Bundle Autocontido: O ficheiro guardado contém não só a estrutura lógica, mas também todas as imagens carregadas pelo utilizador, permitindo abrir e editar o projeto em qualquer computador sem dependências externas ou perda de dados.

---

## COMO EXECUTAR O PROJETO

**Requisitos:** Node.js instalado (versão LTS recomendada).

Para garantir a compatibilidade entre diferentes computadores (Windows, macOS, Linux) e evitar erros de permissões (ex: _permission denied_), utilize o comando de "instalação limpa" em vez da instalação normal.

1. Abrir o terminal na pasta raiz do projeto.
2. Executar o seguinte comando para reinstalar dependências e iniciar a aplicação:
   ```bash
   npm ci && npm run dev
   ```
3. Abrir o link fornecido no browser (habitualmente http://localhost:5173).
