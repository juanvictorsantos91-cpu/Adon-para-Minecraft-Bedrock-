# Estado lógico e ciclo de vida dos territórios

O módulo `src/ai/territory-state.js` mantém o estado lógico de um território sem depender da API do Minecraft Bedrock.

## Operações disponíveis
- `createTerritory`: cria um território com proprietário, espécie, centro, raio, estado e histórico.
- `transferTerritory`: transfere a propriedade somente quando uma camada externa já confirmou o resultado da disputa.
- `abandonTerritory`: marca o território como abandonado sem apagar o histórico.
- `relocateTemporaryTerritory`: move territórios temporários sem trocar seu ID ou proprietário.
- `InMemoryTerritoryRepository`: repositório em memória para testes e simulações.

## Limites deliberados
- O módulo não decide se uma invasão venceu.
- O módulo não inicia combate e não captura blocos ou regiões do mundo.
- O repositório em memória não sobrevive ao encerramento do processo.
- A gravação persistente no mundo Bedrock exige um adaptador próprio e validação posterior no jogo.
- Uma migração de Dragão de Terra deve atualizar a localização do território temporário; não deve criar uma transferência de propriedade.

## Próxima integração
A camada de decisão territorial poderá solicitar uma operação, mas somente o sistema que confirmar o evento de conquista poderá chamar `transferTerritory`. A implementação Bedrock futura deverá persistir os registros e recuperar o estado ao carregar o mundo.
