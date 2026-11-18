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
- `ds:grooming_needed`
- `ds:bathing_opportunity`
- `ds:play_opportunity`
- `ds:exploration_opportunity`
- `ds:quiet_observation`
- `ds:temperature:too_hot` ou `ds:temperature:too_cold`
- `ds:trait:curiosity:<0..1>`
- `ds:trait:courage:<0..1>`
- `ds:trait:sociability:<0..1>`
- `ds:trait:independence:<0..1>`
- `ds:trait:playfulness:<0..1>`

Essas tags são sinais de entrada, não produtores automáticos. Valores de personalidade ausentes permanecem ausentes no snapshot; o MIS usa o perfil da espécie ou padrões conservadores como fallback. As atividades dependem de condições seguras e nunca substituem as prioridades de sobrevivência.
