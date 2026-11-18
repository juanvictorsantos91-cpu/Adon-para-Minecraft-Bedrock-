# Contrato de estado MIS ↔ Bedrock

Este documento define os dados que o adaptador Bedrock entrega ao núcleo do MIS.
Os valores abaixo são lidos como estado observado; a existência do leitor não
significa que todos os produtores de tags já estejam implementados.

## Escalas numéricas

- `ds:energy:<0-100>`: energia percentual.
- `ds:hunger:<0-100>`: saciedade percentual (100 = alimentado).
- `ds:aggression:<0-1>`: ajuste individual opcional de agressividade. Se ausente,
  o MIS usa a agressividade do perfil oficial da espécie.
- A saúde é obtida do componente `minecraft:health` e convertida para percentual
  usando `effectiveMax` (ou `defaultValue` como alternativa). O núcleo recebe
  sempre uma escala de 0 a 100, independentemente do HP máximo da entidade.

## Identidade e território

- `ds:species:<species>`: identificação obrigatória da espécie.
- `ds:territory:<id>`: identificador do território atribuído ao dragão.
- `ds:tamed`: dragão domesticado.
- `ds:owned` ou `ds:owner:<id>`: dragão pertencente a um jogador.
- Dragões domesticados ou pertencentes a jogadores são visitantes amigáveis por
  padrão e não podem ser escolhidos como alvo de invasão.

## Condição e relações

- `ds:has_young`: o indivíduo tem filhotes sob seus cuidados.
- `ds:injury:minor`, `ds:injury:moderate`, `ds:injury:severe`: gravidade do ferimento.
- `ds:immediate_danger`: perigo imediato percebido.
- `ds:migration_due`: ciclo de migração devido.
- `ds:known:<entity-id>`: relação reconhecida pelo indivíduo.
- `ds:hostile:<entity-id>`: relação hostil declarada.
- `ds:near_nest`: indivíduo próximo de um ninho.

## Regras de invasão consumidas pelo MIS

- Água, Plasma e Lava não iniciam invasões.
- Fogo mantém a maior probabilidade-base.
- Outras espécies só se tornam elegíveis se a agressividade individual atingir o
  limiar especial definido pelo sistema.
- O invasor precisa estar saudável, com energia e fome suficientes, sem ferimento
  grave, perigo imediato ou filhotes que exijam proteção.
- O alvo precisa ter território identificado, ser de outra espécie, estar dentro
  do raio territorial correspondente e não ser domesticado nem pertencer a jogador.
- Entre vários alvos elegíveis, o sistema seleciona o mais próximo.
- A avaliação apenas produz uma intenção. Não transfere território nem inicia
  combate automaticamente.

## Limites desta etapa

O adaptador já lê os campos descritos quando as tags estão presentes. A criação
persistente de territórios, a atribuição automática de propriedade/domesticação
e a conquista física continuam sendo tarefas separadas. Elas não são consideradas
concluídas por esta alteração e exigirão validação posterior no Minecraft.


## Sinais de rotina e personalidade

O snapshot também lê os seguintes sinais quando fornecidos pelo adaptador ou por tags:
- `ds:sleep_requested`
- `ds:play_opportunity`
- `ds:exploration_opportunity`
- `ds:quiet_observation`
- `ds:temperature:too_hot` ou `ds:temperature:too_cold`
- `ds:trait:curiosity:<0..1>`
- `ds:trait:sociability:<0..1>`
- `ds:trait:independence:<0..1>`
- `ds:trait:playfulness:<0..1>`

Essas tags são sinais de entrada, não produtores automáticos. Os quatro traços individuais são curiosidade, sociabilidade, independência e vontade de brincar. Medo, estresse e coragem não são traços de personalidade; higiene e banho não fazem parte das rotinas. Valores ausentes permanecem ausentes no snapshot; o MIS usa o perfil da espécie ou padrões conservadores como fallback. As atividades dependem de condições seguras e nunca substituem as prioridades de sobrevivência.


## Gravação dos traços individuais
O adaptador `src/adapters/bedrock/personality-writer.js` fornece `initializeDragonPersonality`, que gera e grava as quatro tags de personalidade em uma entidade Bedrock. O fluxo real de nascimento/spawn ainda precisa chamar essa função. A presença do adaptador não significa que os traços já sejam atribuídos automaticamente no mundo.


## Memória social individual
- `ds:known:<entity-id>`: indivíduo reconhecido pelo dragão que carrega a tag.
- `ds:relation:<entity-id>:trust:<0-3>`: confiança social limitada.
- `ds:hostile:<entity-id>`: hostilidade anteriormente observada.

Os identificadores são codificados com URL encoding ao gerar tags pelo módulo social. O snapshot aceita tags legadas sem codificação. A memória é limitada a 32 indivíduos recentes no núcleo. O ciclo principal do MIS atualiza essa memória a cada decisão quando recebe `currentTick`, reconhece dragões observados e devolve `socialMemory` e `socialMemoryTags` no resultado, inclusive quando uma necessidade vital domina a ação. Confiança e hostilidade só mudam quando o adaptador fornece eventos pontuais em `socialObservations` com `interaction: "peaceful"`, `"protective"` ou `"hostile"`. Esses eventos devem ser consumidos uma única vez pelo chamador, não reenviados em todos os ticks.

A gravação efetiva das tags na entidade e a persistência entre reinicializações ainda dependem do adaptador Bedrock e do armazenamento do mundo; a integração lógica do MIS não equivale a persistência automática.
