function parseStringLiteral(str) {
  if (!str) return '';
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }
  return str;
}

function handleReaction(trimmedLine) {
  const val = trimmedLine.replace('add reaction', '').trim();
  return {
    type: 'reaction',
    emoji: parseStringLiteral(val)
  };
}

module.exports = { handleReaction };