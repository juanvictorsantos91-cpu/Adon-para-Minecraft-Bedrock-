# Expansão simples de comportamento e personalidade

## Objetivo
Fazer cada dragão parecer um animal com hábitos e preferências próprios, sem criar uma IA separada por espécie ou aumentar demais o custo de processamento.

O MIS continua sendo baseado em regras. As decisões combinam:
1. Necessidades vitais (saúde, fome, energia).
2. Segurança e ameaças.
3. Perfil comportamental da espécie.
4. Traços individuais estáveis.
5. Contexto recente (horário, clima, relações e acontecimentos lembrados).

## Comportamentos propostos

### 1. Rotina natural
Alternar entre procurar alimento, explorar, patrulhar, descansar, dormir e observar. A rotina é flexível: necessidades e perigos sempre podem interrompê-la.

### 2. Autocuidado
Ações curtas de limpeza, banho, aquecimento, busca por sombra e abrigo. Cada espécie recebe preferências compatíveis com seu habitat e fisiologia.

### 3. Brincadeira e curiosidade
Filhotes brincam e investigam com maior frequência. Adultos também podem explorar objetos ou locais, desde que estejam seguros e sem necessidades urgentes.

### 4. Comunicação
Sinais simples por postura, aproximação, afastamento, vocalização e alerta. O significado depende da espécie e do relacionamento entre os indivíduos.

### 5. Medo e estresse
Ameaças recentes podem aumentar temporariamente a cautela. O dragão pode procurar abrigo, evitar a origem do perigo e recuperar a tranquilidade gradualmente.

### 6. Vínculos e memória
Reconhecer indivíduos conhecidos, lembrar ameaças recentes e demonstrar preferência por membros do grupo, parceiro ou treinador. Memórias devem ser limitadas e expirar quando deixam de ser úteis.

## Traços individuais
Gerar no nascimento cinco tendências estáveis, em escala de 0 a 1:
- curiosidade;
- coragem;
- sociabilidade;
- independência;
- brincadeira.

Os valores individuais complementam, mas não substituem, o perfil da espécie. Dois dragões da mesma espécie podem agir de modo diferente sem perder seu comportamento natural.

## Regras de prioridade
- Saúde, fome, energia crítica e perigo imediato têm prioridade máxima.
- Proteção de filhotes, ninho e vínculos importantes vem em seguida, conforme o contexto.
- Rotina, autocuidado, socialização e brincadeiras só ocorrem quando são seguros.
- Uma ação ambiental não deve ser repetida continuamente: cada comportamento precisa de intervalo ou condição de encerramento.

## Implementação por etapas
1. Rotina e autocuidado, usando os dados já percebidos pelo adaptador.
2. Traços individuais e pequenas variações de decisão.
3. Estresse temporário e recuperação.
4. Comunicação e memória social simplificada.

## Limites
Este documento registra uma direção de design, não uma implementação concluída. As ações físicas no Minecraft precisam de adaptadores próprios e validação posterior no jogo. Não introduzir dezenas de novas variáveis persistentes antes de confirmar quais são realmente necessárias.
