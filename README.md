# IA de Regras para Mobs — Minecraft Bedrock

Projeto experimental para desenvolver uma inteligência baseada em regras para entidades (mobs) do Minecraft Bedrock, com foco em dispositivos móveis.

## Núcleo de sobrevivência Dragon Survival

A ramificação `feature/dragon-survival-core` adiciona uma primeira base independente da Script API para testar os sistemas de sobrevivência dos dragões:

- Energia, fome e saúde como indicadores separados.
- Ferimento simplificado, com no máximo um estado ativo.
- Metabolismo configurável por espécie.
- Decisões do MIS considerando os três indicadores e perigo imediato.
- Alimentação que recupera fome e energia com limite por refeição.
- Perfis experimentais das espécies Elétrico, Água, Gelo, Fogo, Terra, Lava, Vento, Som e Venenoso.
- Dietas e preferências alimentares por espécie.
- Personalidades distintas e tendências comportamentais para as nove espécies.
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
- `src/species/profiles/`: perfis metabólicos das nove espécies.
- `src/species/diets/species-diets.js`: dietas e preferências alimentares.
- `src/species/behavior-profiles.js`: personalidade e tendências por espécie.
- `src/ai/dragon-behavior.js`: decisões comportamentais integradas ao MIS.
- `src/ai/social-groups.js`: planejamento do tamanho e da coesão dos grupos por espécie, incluindo bandos mistos de Terra e Lava.
- `src/ai/social-interactions.js`: possibilidades de interações pacíficas e respostas defensivas/agressivas condicionais entre espécies.
- `src/ai/dragon-relationships.js`: reconhecimento de parentesco, parceiros e compatibilidade para formação de casais.
- `src/ai/electric-storm-ritual.js`: condições, participantes e intervalo do ritual coletivo de tempestade elétrica.
- `src/ai/migration-cycle.js`: agenda de migração de longo ciclo do Dragão Elétrico, medida em ticks do mundo.
- `tests/dragon-behavior.test.js`: testes do sistema de comportamentos.
- `examples/simulate-all-dragons.js`: simulação comparativa das nove espécies.
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


## Primeira ponte com Minecraft Bedrock

A estrutura inicial do Behavior Pack está em `bedrock/behavior_pack/`:

- `manifest.json`: declara o módulo Script API estável `@minecraft/server` 2.10.0, alinhado à documentação atual do Bedrock 1.26.50.
- `scripts/main.js`: consulta dragões marcados com `ds:dragon`, coleta contexto local em intervalos de 40 ticks e envia o estado ao MIS/DBS.
- `src/adapters/bedrock/snapshot.js`: converte entidades observadas em estados que o núcleo consegue avaliar.
- `scripts/build-bedrock-pack.js`: copia o núcleo JavaScript para dentro do Behavior Pack.

### Convenção inicial de tags

Cada entidade de dragão precisa receber `ds:dragon` e uma tag `ds:species:<espécie>`, por exemplo `ds:species:electric`. Indicadores podem ser fornecidos por tags `ds:energy:0-100`, `ds:hunger:0-100` e `ds:spawn_tick:<ticks>`. Presas só entram no planejamento de caça se estiverem explicitamente marcadas com `ds:wild`; isso evita que animais de fazendas sejam tratados como selvagens por engano.

### Limite desta primeira ponte

A ponte já consulta entidades e contexto do mundo e calcula decisões do MIS/DBS. Por segurança, publica a decisão como uma tag `ds:action:<ação>` na entidade. Ela ainda não move o dragão, não aplica ataques e não cria efeitos: esses comportamentos exigem componentes e eventos correspondentes nos arquivos JSON das entidades, além de validação dentro do Minecraft.

Antes de distribuir o pacote, confirme a versão exata do Minecraft instalada no celular. A dependência declarada é a versão estável 2.10.0 da Script API, documentada para a linha Bedrock 1.26.50; se a versão instalada exigir outra dependência, o manifesto deverá ser ajustado.

Para preparar a pasta do Behavior Pack:

```bash
npm run build:bedrock
```


## Sétima espécie: Dragão de Vento

O Dragão de Vento foi adicionado ao catálogo oficial do Dragon Survival. Seu perfil experimental contempla:

- Personalidade independente, curiosa e exploradora.
- Habitat de altitude, montanhas, planícies abertas e regiões com vento.
- Pequenos grupos flexíveis, podendo também viver sozinho.
- Voo de planagem com consumo reduzido quando aproveita correntes favoráveis.
- Rajada de vento defensiva para afastar criaturas hostis próximas.
- Dieta de pequenos animais, carne e peixes; alimentos preferidos: coelho, frango e salmão.
- Montaria somente na fase adulta.

Os custos de energia e as condições de recuperação são parâmetros iniciais de balanceamento, ainda não validados dentro do Minecraft.

## Executor inicial de ações Bedrock

O adaptador agora chama `executeDragonAction` após a decisão do MIS/DBS. O executor já possui ações limitadas e seguras:

- Estabilizar/parar o movimento em descanso ou pouso.
- Aplicar impulsos pequenos para aproximação e afastamento.
- Aproximar-se de uma presa selecionada e tentar um ataque corpo a corpo quando estiver ao alcance.
- Aplicar empurrão em criaturas hostis com a rajada de vento.

A caça exige a tag `ds:wild` na presa. Animais domesticados, próprios ou marcados como fazenda/protegidos são recusados. Essa marcação explícita é intencional para evitar ataques indevidos a animais do jogador. Ações como voo completo, animações, eclosão, escavação e construção de ninho continuam dependendo dos eventos e componentes específicos das entidades.

O adaptador consulta dragões marcados com `ds:dragon`; cada dragão precisa ter também `ds:species:<espécie>`. Para solicitar a rajada defensiva do Dragão de Vento, a entidade recebe `ds:wind_gust_requested` enquanto o sistema de comando/combate não possui uma interface própria.

A pasta do Behavior Pack pode ser preparada com `npm run build:bedrock`.


## Oitava espécie: Dragão de Som (oficial; ficha em revisão)

O Dragão de Som está registrado no catálogo oficial. Sua anatomia foi definida como a de um dragão tradicional, com quatro patas, duas asas e cauda; não possui corpo serpentino nem estrutura física especial.

- **Eco Localizador:** emite pulsos sonoros e interpreta os ecos para localizar criaturas, obstáculos e espaços próximos, inclusive no escuro.
- **Onda de Impacto:** libera uma onda de pressão sonora que empurra criaturas e pode interromper ataques.
- **Rugido Desorientador:** emite uma frequência intensa que confunde temporariamente adversários e dificulta a perseguição.
- **Percepção de Vibrações:** identifica movimentos transmitidos pelo solo e pelas paredes, como passos e escavações.
- Personalidade observadora e cautelosa; tende a viver em pequenos grupos.
- Dieta experimental baseada em pequenos animais, peixes e carne.

As habilidades estão implementadas como decisões no núcleo de regras, mas seus efeitos sonoros, visuais e físicos ainda dependem do adaptador e de testes dentro do Minecraft. A ficha continua aberta a ajustes.

## Nona espécie: Dragão Venenoso (em desenvolvimento)

O Dragão Venenoso entrou no núcleo experimental com uma anatomia serpentina alada, duas patas como principal suporte de locomoção e corpo projetado para ser o mais comprido do catálogo. Seu perfil comportamental é cauteloso, solitário e especializado em emboscadas.

- **Cuspir veneno**: ataque concentrado contra uma ameaça.
- **Baforar veneno**: ataque em área à frente do dragão.
- **Nuvem de camuflagem**: bloqueia temporariamente a visão para fuga ou emboscada, mas não concede invisibilidade.
- A camuflagem só é elegível quando o contexto informado pelo adaptador confirma sombra ou escuridão (`camouflageSuitable: true`).
- O núcleo recusa a camuflagem em locais claros e exige energia suficiente.
- Metabolismo, dieta e custos de energia são parâmetros experimentais, ainda sem balanceamento.

A implementação atual cobre o perfil e o planejamento das decisões. A detecção real de iluminação/sombra, a emissão visual da nuvem e os efeitos de veneno ainda dependem do adaptador, dos componentes/eventos da entidade e de testes dentro do Minecraft.
