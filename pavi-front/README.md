# PAVI Frontend

Frontend do sistema PAVI, desenvolvido com Angular 21 para gestão de viagens, motoristas, veículos e embarcadores.

## Requisitos

- Node.js 22 ou superior
- npm 11 ou superior
- Angular CLI compatível com Angular 21

## Instalação

No diretório do projeto, instale as dependências:

```bash
npm install
```

## Como rodar em desenvolvimento

### 1. Suba o backend

O frontend consome a API em `http://127.0.0.1:8080`.

Se o backend estiver rodando em outra porta ou host, ajuste a configuração em [proxy.conf.json](/C:/Users/pietr/OneDrive/Área%20de%20Trabalho/pavi/pavi/proxy.conf.json:1).

### 2. Inicie o frontend

Execute:

```bash
npm start
```

Por padrão, a aplicação sobe em:

```text
http://localhost:4200
```

### 3. Acesse no navegador

Abra:

```text
http://localhost:4200
```

## Build de produção

Para gerar a versão de produção:

```bash
npm run build
```

Os arquivos finais serão gerados em:

```text
dist/pavi-app
```

## Build em modo watch

Para acompanhar mudanças de código com rebuild automático:

```bash
npm run watch
```

## Estrutura de execução

- `npm start`: sobe o servidor de desenvolvimento Angular
- `npm run build`: gera o build de produção
- `npm run watch`: recompila automaticamente em modo desenvolvimento

## Integração com API

O projeto possui uma proxy definida em [proxy.conf.json](/C:/Users/pietr/OneDrive/Área%20de%20Trabalho/pavi/pavi/proxy.conf.json:1) para redirecionar chamadas `/api` para:

```text
http://127.0.0.1:8080
```

Se o frontend estiver configurado para chamar rotas relativas como `/api/...`, mantenha essa proxy alinhada com o backend local.

## Solução de problemas

Se a aplicação abrir, mas não carregar dados:

1. Verifique se o backend está rodando em `127.0.0.1:8080`.
2. Confirme se não há erro de CORS ou falha de proxy no terminal do Angular.
3. Revise a URL base usada pelo serviço de API em `src/app/core/services`.

Se a porta `4200` estiver ocupada, inicie o Angular em outra porta:

```bash
npx ng serve --port 4201
```
