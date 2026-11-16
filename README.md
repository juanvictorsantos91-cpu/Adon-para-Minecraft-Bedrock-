# IA de Regras para Mobs — Minecraft Bedrock

Projeto experimental para desenvolver uma inteligência artificial baseada em regras para entidades (mobs) do Minecraft Bedrock, com foco em dispositivos móveis.

## Objetivo da primeira etapa

Criar um pequeno "cérebro" de mob em JavaScript. Ele recebe um retrato do estado do mob e escolhe uma ação com base em regras e prioridades. Nesta etapa, o motor é independente da API do Minecraft, para podermos testar a lógica antes de conectá-la ao jogo.

## Estrutura

- `src/ai/rule-engine.js`: motor genérico que avalia regras por prioridade.
- `src/brains/zombie-brain.js`: regras iniciais de decisão para um zumbi.
- `examples/simulate-zombie.js`: exemplo de simulação fora do Minecraft.

## Regras iniciais do zumbi

1. Se a vida estiver baixa, recuar.
2. Se houver alvo ao alcance de ataque, atacar.
3. Se houver alvo visível, aproximar-se.
4. Se não houver ameaça, vagar.

A prioridade é: recuar > atacar > aproximar > vagar.

## Como testar

O código usa módulos JavaScript (ESM). Com Node.js instalado:

```bash
node examples/simulate-zombie.js
```

## Próximas etapas

1. Testar e ajustar as regras.
2. Conectar as decisões aos eventos e componentes da Script API do Minecraft Bedrock.
3. Criar o Behavior Pack e testar no Minecraft para celular.
4. Adicionar outros comportamentos e tipos de mob.

> Estado atual: protótipo da lógica de decisão. Ainda não é um Add-On instalável e não controla mobs dentro do Minecraft.
