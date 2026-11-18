# Rotina natural e autocuidado

O módulo `src/ai/natural-behavior.js` gera intenções cotidianas simples. Ele não executa animações, movimento ou interações diretamente no Minecraft.

## Atividades
- Sono em abrigo seguro.
- Busca por sombra ou abrigo aquecido conforme estresse térmico.
- Higiene e limpeza das escamas.
- Banho quando há oportunidade segura.
- Brincadeiras e prática de movimento para filhotes e juvenis.
- Exploração motivada pela curiosidade individual.
- Observação tranquila do ambiente.

## Prioridades
Ameaças, perigo ambiental e necessidades vitais críticas bloqueiam essas atividades. O sistema de sobrevivência e as regras de proteção continuam tendo precedência.

## Dados esperados do adaptador
O módulo aceita sinais contextuais como `sleepRequested`, `temperatureStress`, `groomingNeeded`, `bathingOpportunity`, `playOpportunity`, `explorationOpportunity` e `quietObservationOpportunity`. Esses sinais ainda precisam ser produzidos pelo adaptador do mundo; sua ausência não quebra o comportamento existente.

## Personalidade
Os traços individuais podem ser fornecidos em `state.personality` (por exemplo, `curiosity` e `playfulness`) com valores entre 0 e 1. Quando ausentes, o módulo usa o perfil da espécie e padrões conservadores.

## Variações por espécie
As ações de higiene e banho variam por espécie: por exemplo, Fogo remove cinzas, Água limpa as escamas na água, Gelo rola na neve e Lava repousa em pedra aquecida. Essas são intenções lógicas; animações e efeitos visuais serão implementados pelo adaptador Bedrock.
