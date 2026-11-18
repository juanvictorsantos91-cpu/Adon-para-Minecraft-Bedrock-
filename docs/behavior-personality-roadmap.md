# Expansão simples de comportamento e personalidade

## Objetivo
Fazer cada dragão parecer um animal com hábitos e preferências próprios, sem criar uma IA separada por espécie ou aumentar demais o custo de processamento.

O MIS continua sendo baseado em regras. As decisões combinam:
1. Necessidades vitais (saúde, fome, energia).
2. Segurança e ameaças reais.
3. Perfil comportamental da espécie.
4. Traços individuais estáveis.
5. Contexto recente (horário, clima, relações e acontecimentos lembrados).

## Comportamentos
- Alternar entre procurar alimento, explorar, patrulhar, descansar, dormir e observar.
- Filhotes e juvenis podem brincar e praticar movimentos quando estão seguros.
- Dragões podem se aproximar de indivíduos conhecidos conforme sua sociabilidade.
- Indivíduos mais independentes podem preferir pequenas explorações individuais.
- Comunicação por postura, aproximação, afastamento, vocalização e alertas.
- Vínculos e memória social limitada para reconhecer membros do grupo, parceiros e treinador.

## Personalidade individual
Gerar no nascimento quatro tendências estáveis, em escala de 0 a 1:
- curiosidade;
- sociabilidade;
- independência;
- vontade de brincar.

Medo, estresse e coragem não são traços de personalidade neste projeto. A resposta a ameaças continua baseada na espécie, saúde, energia e contexto real. Higiene, banho e limpeza de escamas foram retirados por não acrescentarem o suficiente à experiência de jogo.

## Regras de prioridade
- Saúde, fome, energia crítica e perigo imediato têm prioridade máxima.
- Proteção de filhotes, ninho e vínculos importantes vem em seguida, conforme o contexto.
- Rotina, socialização e brincadeiras só ocorrem quando são seguros.
- Condições físicas extremas, como calor ou frio perigosos, continuam sendo tratadas como riscos ambientais, não como emoções.
- Uma ação ambiental não deve ser repetida continuamente: cada comportamento precisa de intervalo ou condição de encerramento.

## Próximas etapas técnicas
1. Conectar o gerador de personalidade ao nascimento e persistir os quatro traços.
2. Produzir sinais de sono, exploração, brincadeira e observação no adaptador Bedrock.
3. Integrar anexação territorial à confirmação real de conquista.
4. Persistir domínios e desgaste territorial no mundo.
5. Implementar comunicação e memória social simplificada.

## Limites
As ações físicas no Minecraft precisam de adaptadores próprios e validação posterior no jogo. Não introduzir dezenas de variáveis persistentes antes de confirmar quais são realmente necessárias.
