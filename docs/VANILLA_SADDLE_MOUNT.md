# Montaria com sela vanilla

O Dragon Survival usa o item original `minecraft:saddle`. O jogador segura a sela e interage com um dragão adulto e domesticado.

## Regras
- Exige as tags `ds:stage:adult` e `ds:tamed`.
- Bloqueia o Dragão de Lava, inclusive se receber tags de domesticado/adulto.
- Ao montar com sucesso, consome uma sela e registra `ds:saddled`, `ds:mounted` e `ds:mount:player_controlled`.
- Cada espécie recebe um assento proporcional à altura/largura configuradas no gerador de entidades.
- O item é consumido somente depois de o Bedrock aceitar o passageiro.

## Integração necessária
O sistema de domesticação (ou comandos externos) precisa adicionar `ds:tamed` quando a domesticação for concluída. O inicializador atual define `ds:stage:adult` como padrão; o sistema de crescimento deverá substituir essa tag quando houver estágios de vida reais.

## Limites desta etapa
A sela vanilla é reconhecida por interação com a entidade e habilita o passageiro. Não há ainda modelo 3D de sela renderizado no dorso, remoção/recuperação do item, comandos de montaria, nem controles personalizados de voo. Esses pontos dependem da validação da API e da integração dos comandos do Claude.
