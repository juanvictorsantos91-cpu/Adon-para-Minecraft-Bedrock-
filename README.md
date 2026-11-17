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

Os valores desta etapa são parâmetros experimentais para simulação, não balanceamento final.

## Estrutura principal

- `src/ai/rule-engine.js`: motor genérico de regras.
- `src/ai/survival-decisions.js`: prioridades de sobrevivência do MIS.
- `src/survival/`: energia, fome, saúde, ferimentos e metabolismo.
- `src/species/profiles/`: perfis metabólicos das seis espécies.
- `src/species/diets/species-diets.js`: dietas e preferências alimentares.
- `src/species/behavior-profiles.js`: personalidade e tendências por espécie.
- `src/ai/dragon-behavior.js`: decisões comportamentais integradas ao MIS.
- `tests/dragon-behavior.test.js`: testes do sistema de comportamentos.
- `examples/simulate-all-dragons.js`: simulação comparativa das seis espécies.
- `examples/simulate-electric-dragon.js`: simulação fora do Minecraft.
- `tests/survival.test.js`: testes automatizados do núcleo.

## Como testar

Com Node.js instalado:

```bash
npm test
npm run simulate:electric
npm run simulate:all
```

O DBS é uma camada de decisão: os adaptadores que percebem entidades/ambiente e executam ações reais ainda precisam ser implementados.

O núcleo ainda não está conectado à Script API e não é um Add-On instalável. A integração com o Minecraft Bedrock será uma etapa posterior, após confirmar a versão do jogo e a API disponível.
