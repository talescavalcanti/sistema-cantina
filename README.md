# Cantina CESAR · versão go-horse

> FDS 2026.2 · Hackathon Relâmpago #1 · Entrega 1

Web-app para acabar com a fila da cantina da CESAR School (Imperial Padaria). O aluno faz o pedido antecipado pelo celular, paga pelo app e recebe uma **senha**. O balcão acompanha os pedidos num quadro e avisa quando a senha está pronta. Os 15 minutos do intervalo ficam para comer.

## Funcionalidades
- Cardápio real da Imperial (44 itens em 8 categorias), com busca
- Carrinho e escolha do horário de retirada
- Pagamento simulado: Pix ou cartão (com validação)
- Senha de retirada (`A-001`, `A-002`…) e posição na fila
- Tela do balcão: Recebidos → Em preparo → Prontos → Entregue
- Aviso de "pedido pronto" no celular do aluno, em tempo real

## Como rodar
```bash
npm install
npm run dev
```
Abra `http://localhost:5173` (aluno) e, **em outra aba**, `http://localhost:5173/#/balcao` (balcão). As abas se sincronizam sozinhas.

## Decisões de stack
- **React + TypeScript + Vite**: setup em segundos, e o TypeScript deixa tipos e (na v2) interfaces explícitos.
- **Sem backend e sem banco**, como o enunciado permite: os pedidos ficam no `localStorage`, e o evento `storage` sincroniza as abas do aluno e do balcão.
- **Cardápio em JSON** (`src/cardapio.json`), transcrito das fotos do cardápio físico.

## Integrantes
| Nome | Papel |
|---|---|
| _preencher_ | _preencher_ |

## Princípios do cap. 5: onde estamos
Esta é a versão **go-horse de propósito**: quase tudo está em `src/App.tsx` (521 linhas, um único componente). Ela é a linha de base para o "antes e depois" da PoC final.

**O que já aparece:**
- **Separação dados × código**: o cardápio fica em `src/cardapio.json`. Trocar um preço não exige mexer em código.
- **Integridade conceitual (início)**: há um vocabulário único do domínio (`Pedido`, senha, status, balcão) usado em todas as telas.

**Dívidas de projeto conhecidas (o que a v2 resolve):**

| Onde | Princípio violado | Problema |
|---|---|---|
| `App.tsx:19` | Responsabilidade Única · Coesão (LCOM alto) | Um componente faz cardápio, carrinho, pagamento, senha, balcão e persistência |
| `App.tsx:36` | Ocultamento de informação · Inversão de Dependências | A tela lê e grava direto no `localStorage` |
| `App.tsx:70` | Aberto/Fechado | Nova categoria exige editar um `if/else` |
| `App.tsx:85` | Demeter · SRP | O total é calculado na tela, percorrendo a estrutura do cardápio |
| `App.tsx:118` | Aberto/Fechado · SRP · complexidade ciclomática | Validação, pagamento, senha e persistência num só método. Novo meio de pagamento = mais um `else if` |
| `App.tsx:185` | Ocultamento de informação | Qualquer código muda o status do pedido para qualquer valor, sem regra de transição |

Na PoC final: domínio em classes TypeScript puras, pagamento como Strategy (novo meio = nova classe), repositório atrás de interface injetada, testes de contrato (Liskov) e métricas (LOC, CBO, LCOM, complexidade ciclomática) comparando as duas versões.
