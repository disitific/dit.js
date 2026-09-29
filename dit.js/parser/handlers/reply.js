const { compileFileContent } = require('../compiler');

function parseStringLiteral(str) {
  if (!str) return '';
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }
  return str;
}

function handleReply(trimmedLine, inlineFunctionsMap) {
  const isEphemeral = trimmedLine.startsWith('ephemeral reply');
  const keyword = isEphemeral ? 'ephemeral reply' : 'reply';
  const val = trimmedLine.replace(keyword, '').trim();
  const rawContent = val ? parseStringLiteral(val) : null;

  return {
    type: 'reply',
    ephemeral: isEphemeral,
    renderContent: compileFileContent(rawContent || '', inlineFunctionsMap),
    embed: null
  };
}

module.exports = { handleReply };