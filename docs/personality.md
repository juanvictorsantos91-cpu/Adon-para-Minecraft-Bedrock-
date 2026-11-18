# Personalidade individual

`src/species/personality.js` gera cinco traços estáveis por indivíduo:
- curiosidade;
- coragem;
- sociabilidade;
- independência;
- brincadeira.

A geração é determinística: o mesmo identificador-semente e espécie produzem os mesmos valores. Cada traço parte da tendência da espécie e recebe uma variação pequena, limitada e configurável. Assim, dragões da mesma espécie mantêm uma identidade comportamental própria sem se afastarem demais do perfil natural.

O módulo apenas gera os valores. O adaptador de nascimento ainda precisa gravá-los no dragão, por exemplo com tags `ds:trait:<nome>:<valor>`. O snapshot já sabe ler essas tags. A persistência automática no mundo Bedrock não está implementada nem validada.
