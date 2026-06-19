# Resumo do Sistema PAVI

O PAVI e um sistema de gestao de transporte e frota com frontend em Angular e backend em Spring Boot. A plataforma centraliza o controle operacional das viagens, o cadastro dos principais ativos da operacao e a integracao com API segura por JWT.

## 1. O que o sistema ja tem implementado

### 1.1. Acesso e seguranca
- Tela de login dedicada.
- Autenticacao via JWT.
- Protecao de rotas no frontend.
- API protegida com Spring Security no backend.

### 1.2. Painel de viagens
- Tela principal de viagens.
- KPIs operacionais: total, em andamento, agendadas, concluidas e receita.
- Busca textual, filtros por status e periodo.
- Ordenacao de colunas.
- Cadastro de novas viagens.
- Edicao detalhada por modal.
- Relatorio/exportacao para PDF via impressao.

### 1.3. Painel de motoristas
- Listagem de motoristas.
- Indicadores rapidos da base.
- Cadastro, edicao e exclusao.
- Dados completos como CNH, validade, sexo, data de nascimento e cidade.

### 1.4. Painel de veiculos
- Gestao de cavalos e carretas.
- Listagem com indicadores da frota.
- Cadastro, edicao e exclusao.
- Controle de placa, chassi, renavam, ano de fabricacao, ano modelo e modelo do veiculo.

### 1.5. Painel de embarcadores
- Cadastro e consulta de empresas parceiras.
- Controle de CNPJ e endereco completo.
- Vinculo com cidade e estado.
- Operacoes de criar, editar e excluir.

### 1.6. Base de apoio operacional
- Cadastro e consumo de estados e cidades.
- Cadastro de fabricantes.
- Cadastro de modelos de veiculos.
- Servico central de sincronizacao entre frontend e backend.

## 2. Estrutura tecnica do sistema

### 2.1. Frontend
- Angular com standalone components.
- Estado reativo com Signals.
- Componentes reutilizaveis para formularios, icones, cabecalhos e status.
- Layout com sidebar, topbar e navegacao autenticada.

### 2.2. Backend
- API REST em Java com Spring Boot.
- CRUDs para viagens, motoristas, veiculos, empresas, estados, cidades, fabricantes e modelos.
- Banco PostgreSQL com entidades relacionais para operacao logistica.
- Testes automatizados de smoke e integracao de seguranca.

## 3. Itens ja previstos na navegacao, mas nao concluidos no codigo atual

- Frotas
- Manutencoes
- Financeiro
- Destinos
- Usuarios
- Configuracoes

Esses itens aparecem na navegacao do frontend, mas nao possuem telas/rotas completas implementadas no estado atual do projeto.

## 4. Itens que devem entrar no escopo do sistema

### 4.1. Painel de manutencao
- Controle de manutencoes preventivas e corretivas.
- Agenda por veiculo.
- Historico de servicos, pecas, custos e fornecedores.
- Alertas de vencimento por km, data ou horas de uso.

### 4.2. Painel de telemetria
- Leitura de indicadores operacionais da frota.
- Monitoramento de velocidade, ignicao, consumo, parada e desempenho.
- KPIs de utilizacao e eficiencia por veiculo e por viagem.
- Base para alertas operacionais em tempo quase real.

### 4.3. Painel de rastreamento com web service real
- Mapa com posicao atual dos veiculos.
- Integracao com web service real de rastreamento.
- Atualizacao de latitude, longitude, status e ultima comunicacao.
- Visualizacao de rota, origem, destino e progresso da viagem.
- Base para geofencing, eventos de parada e desvios de rota.

## 5. Resumo executivo

Hoje o PAVI ja cobre o nucleo de operacao logistica: autenticacao, viagens, motoristas, veiculos, embarcadores e cadastros auxiliares. A evolucao natural do produto passa por consolidar os modulos de manutencao, telemetria e rastreamento real, complementando a operacao com visibilidade tecnica da frota e monitoramento em campo.
