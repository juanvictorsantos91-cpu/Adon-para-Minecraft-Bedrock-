# Avaliação de formação de grupos sociais

O módulo `src/ai/social-group-formation.js` transforma observações explícitas de entidades próximas em uma proposta determinística de formação de grupo.

## Políticas usadas

- Fogo e Gelo: pares (tamanho-alvo 2).
- Água: pequenos grupos (tamanho-alvo 3).
- Terra e Lava: grupos grandes (tamanho-alvo 6); podem ser compatíveis entre si.
- Elétrico, Veneno e Plasma: permanecem solitários. O ritual de tempestade dos Elétricos continua sendo uma exceção comportamental temporária, não uma associação permanente.
- Vento e Som: seguem os tamanhos-alvo definidos nos perfis atuais.

## Critérios

Um candidato precisa ter ID e espécie cadastrados, ser da mesma espécie (ou Terra/Lava), estar dentro do raio informado, não estar indisponível e não possuir associação explícita a outro grupo. Duplicatas são descartadas.

## Limite de segurança

A função retorna uma intenção `request_group_formation_confirmation`; ela não cria IDs, não altera tags, não salva grupos e não considera proximidade como prova de amizade ou associação. O runtime Bedrock ainda precisa de um evento confiável de confirmação antes de chamar o gravador de associação. Nenhuma formação automática foi ativada no jogo nesta etapa.
