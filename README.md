# IA de Regras para Mobs — Minecraft Bedrock

Projeto experimental para desenvolver uma inteligência baseada em regras para entidades (mobs) do Minecraft Bedrock, com foco em dispositivos móveis.

## Núcleo de sobrevivência Dragon Survival

A ramificação `feature/dragon-survival-core` adiciona uma primeira base independente da Script API para testar os sistemas de sobrevivência dos dragões:

- Energia, fome e saúde como indicadores separados.
- Ferimento simplificado, com no máximo um estado ativo.
- Metabolismo configurável por espécie.
- Decisões do MIS considerando os três indicadores e perigo imediato.
- Alimentação que recupera fome e energia com limite por refeição.
- Perfis experimentais das seis espécies: Elétrico, Água, Gelo, Fogo, Terra e Lava.
- Dietas e preferências alimentares por espécie.
- Personalidades distintas e tendências comportamentais para as seis espécies.
- Sistema DBS integrado às prioridades do MIS: proteção de filhotes/ninhos, resposta a ameaças, vínculo com o dono, socialização, descanso, exploração e comandos treinados.
- Padrões sociais naturais: Água em pequenos grupos; Fogo e Gelo em duplas; Elétrico solitário; Terra e Lava em grandes grupos, inclusive grupos mistos Terra-Lava.
- Interações entre espécies: cooperação, exploração conjunta, convivência perto de água/calor e sinais sociais pacíficos; respostas agressivas apenas diante de ataque ou conflito territorial, com recuo quando ferido ou com pouca energia.
- Ritual de comunicação dos Dragões Elétricos: três ou mais adultos saudáveis podem voar acima das nuvens e gerar uma tempestade de raios; respeita segurança, energia, saúde e intervalo mínimo de sete dias Minecraft (168.000 ticks).
- Migração de longo ciclo para o Dragão Elétrico: ciclo configurável, com referência inicial de 14 dias Minecraft (336.000 ticks), condicionada à segurança da rota.
- Planejamento social explícito: Água (3), Fogo (2), Gelo (2), Terra (6), Lava (6); Elétrico mantém padrão solitário. Os tamanhos são metas experimentais de grupo.
- Reconhecimento de relações entre pais, filhotes, irmãos, parceiros e indivíduos da mesma espécie.
- Formação de casal apenas entre adultos da mesma espécie, compatíveis, em boas condições e sem parentesco próximo conhecido.
- Cuidado parental prioriza proteção, alimentação e aquecimento dos filhotes conforme a necessidade.

Os valores desta etapa são parâmetros experimentais para simulação, não balanceamento final.

## Estrutura principal

- `src/ai/rule-engine.js`: motor genérico de regras.
- `src/ai/survival-decisions.js`: prioridades de sobrevivência do MIS.
- `src/survival/`: energia, fome, saúde, ferimentos e metabolismo.
- `src/species/profiles/`: perfis metabólicos das seis espécies.
- `src/species/diets/species-diets.js`: dietas e preferências alimentares.
- `src/species/behavior-profiles.js`: personalidade e tendências por espécie.
- `src/ai/dragon-behavior.js`: decisões comportamentais integradas ao MIS.
- `src/ai/social-groups.js`: planejamento do tamanho e da coesão dos grupos por espécie, incluindo bandos mistos de Terra e Lava.
- `src/ai/social-interactions.js`: possibilidades de interações pacíficas e respostas defensivas/agressivas condicionais entre espécies.
- `src/ai/dragon-relationships.js`: reconhecimento de parentesco, parceiros e compatibilidade para formação de casais.
- `src/ai/electric-storm-ritual.js`: condições, participantes e intervalo do ritual coletivo de tempestade elétrica.
- `src/ai/migration-cycle.js`: agenda de migração de longo ciclo do Dragão Elétrico, medida em ticks do mundo.
- `tests/dragon-behavior.test.js`: testes do sistema de comportamentos.
- `examples/simulate-all-dragons.js`: simulação comparativa das seis espécies.
- `examples/simulate-social-life.js`: simulação de grupos, parentesco e cuidado parental.
- `examples/simulate-electric-dragon.js`: simulação fora do Minecraft.
- `tests/survival.test.js`: testes automatizados do núcleo.

## Como testar

Com Node.js instalado:

```bash
npm test
npm run simulate:electric
npm run simulate:all
npm run simulate:social
```

O DBS é uma camada de decisão: os adaptadores que percebem entidades/ambiente e executam ações reais ainda precisam ser implementados.

O núcleo ainda não está conectado à Script API e não é um Add-On instalável. A integração com o Minecraft Bedrock será uma etapa posterior, após confirmar a versão do jogo e a API disponível.


## Sistemas de mundo e ciclo de vida

A nova camada de planejamento adiciona quatro avaliações independentes, integradas ao MIS/DBS:

- **Percepção ambiental** (`src/ai/environment-awareness.js`): reconhece tags de bioma/terreno, recursos úteis e perigos; calcula adequação de habitat, segurança e locais candidatos.
- **Território e ninhos** (`src/ai/territory.js`): detecta invasores próximos, avalia ameaça ao ninho e pontua locais candidatos para construção. A proteção física do território ainda depende do adaptador Bedrock.
- **Caça** (`src/ai/hunting.js`): filtra presas pela dieta da espécie, distância e risco; exclui animais domesticados, de fazenda ou protegidos pelo jogador; pode sugerir caça cooperativa. A captura e o compartilhamento real ainda dependem do adaptador.
- **Ciclo de vida** (`src/ai/life-cycle.js`): calcula ovo, filhote, jovem e adulto a partir da idade em ticks, avalia cuidado parental, incubação, eclosão e condições para tentativa de reprodução. Envelhecimento adulto é um marcador experimental, sem morte automática.

Os prazos iniciais de crescimento e envelhecimento são parâmetros experimentais e configuráveis no código; precisam de simulação e balanceamento. Quando o adaptador não informar idade, a fase permanece "unknown" em vez de presumir que todo dragão é filhote.

Para simular as quatro camadas integradas:

```bash
npm run simulate:world
```

As funções produzem avaliações e intenções. Elas não criam blocos, entidades, animações, sons, ovos ou ataques dentro do Minecraft; isso pertence à futura integração com a Script API Bedrock.
