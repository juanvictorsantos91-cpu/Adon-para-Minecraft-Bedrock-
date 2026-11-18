# Personalidade individual

`src/species/personality.js` gera quatro traços estáveis por indivíduo:
- curiosidade;
- sociabilidade;
- independência;
- vontade de brincar.

A geração é determinística: o mesmo identificador-semente e espécie produzem os mesmos valores. Cada traço parte da tendência da espécie e recebe uma variação pequena, limitada e configurável. Assim, dragões da mesma espécie mantêm uma identidade comportamental própria sem se afastarem demais do perfil natural.

Medo, estresse e coragem não fazem parte da personalidade individual. A reação a ameaças continua sendo definida pelas condições reais do dragão e pelo perfil comportamental da espécie. Perigos ambientais, como calor ou frio extremos, continuam sendo tratados como condições físicas, não como emoções.

O módulo apenas gera os valores. O adaptador de nascimento ainda precisa gravá-los no dragão, por exemplo com tags `ds:trait:<nome>:<valor>`. O snapshot lê curiosidade, sociabilidade, independência e vontade de brincar quando disponíveis. A persistência automática no mundo Bedrock não está implementada nem validada.
