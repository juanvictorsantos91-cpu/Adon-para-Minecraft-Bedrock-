/**
 * Motor simples de decisão por regras.
 * Cada regra tem prioridade numérica: menor número = avaliada primeiro.
 */

export function chooseAction(state, rules, fallback = "idle") {
  const orderedRules = [...rules].sort((a, b) => a.priority - b.priority);

  for (const rule of orderedRules) {
    if (rule.when(state)) {
      return {
        action: rule.action,
        reason: rule.reason,
        rule: rule.name
      };
    }
  }

  return {
    action: fallback,
    reason: "Nenhuma regra foi acionada.",
    rule: "fallback"
  };
}
