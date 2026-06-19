# Redesign da tela de Rastreamento — "Imersivo claro"

Data: 2026-06-11
Status: aprovado pelo usuário (direção "Imersivo claro" escolhida entre 3 opções)

## Objetivo

Reestilizar `src/app/features/rastreamento/` para um layout imersivo: o mapa ocupa
toda a área útil e os controles viram camadas flutuantes. Nenhuma mudança de
comportamento, dados ou API.

## Layout

- **Mapa full-bleed**: ocupa toda a área de conteúdo da rota (sem cards em volta).
  Tiles CartoDB Positron (`https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`),
  com atribuição CARTO/OSM.
- **Topo esquerdo (overlay)**: título compacto + chips de KPI flutuantes
  (ativas, online, atrasados, sem posição, velocidade média). Clicar em
  online/atrasados/sem-posição aplica o filtro correspondente (substitui o
  select "Situação"); clicar de novo volta para "todos".
- **Topo direito (overlay)**: botões Atualizar e Sincronizar Sascar + indicador
  compacto da integração (ponto colorido; tooltip com intervalo, última sync e
  mensagem). Substitui a faixa `tracking-status` de 4 cards.
- **Painel direito flutuante (glass)**: branco translúcido com `backdrop-filter: blur`,
  cantos arredondados, sombra suave. Conteúdo: busca no topo, lista rolável de
  caminhões, detalhe da viagem selecionada expandido no rodapé do painel.
  Botão de recolher/expandir o painel.
- **Erro**: toast flutuante no topo central do mapa.

## Cards da lista

Placa em destaque (mono), motorista, rota origem → destino, localização e idade
da posição. Borda lateral de 3px colorida pelo estado (online verde, atrasado
âmbar, sem posição vermelho). Card selecionado com anel/borda accent.

## Marcadores

Pílula com placa + ponto de status, sombra; anel accent no selecionado; pulso
sutil (CSS) nos online. Trilhas: selecionada accent forte, demais suaves.

## Responsivo

≤1100px: painel vira folha inferior (bottom sheet) recolhível sobre o mapa.

## Escopo técnico

Somente `rastreamento.component.{html,scss,ts}` (tiles, ícones de marcador,
estilos globais dos marcadores se hoje estiverem em `styles.scss`) e nada de
mudança em serviços/API. Funcionalidades preservadas: busca, filtros, seleção,
fly-to, auto-refresh 120s, sync manual, estados loading/erro/vazio.
