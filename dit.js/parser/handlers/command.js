function parseStringLiteral(str) {
  if (!str) return '';
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }
  return str;
}

function handleCommand(trimmedLine) {
  const isSlash = trimmedLine.startsWith('new slashcommand');
  const prefixToRemove = isSlash ? 'new slashcommand' : 'new command';
  const headerContent = trimmedLine.replace(prefixToRemove, '').trim();
  
  const parts = headerContent.split(',').map(p => parseStringLiteral(p.trim())).filter(Boolean);
  
  return {
    name: parts[0] || '',
    aliases: parts.slice(1),
    isSlash,
    actions: []
  };
}

module.exports = { handleCommand };