function parseStringLiteral(str) {
  if (!str) return '';
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }
  return str;
}

function handleEmbedBlock(lines, currentIndex) {
  const embed = {
    title: null,
    description: null,
    footer: null,
    timestamp: false
  };

  let i = currentIndex;
  while (i < lines.length) {
    let rawLine = lines[i];

    const commentIndex = rawLine.indexOf('//');
    if (commentIndex !== -1) {
      rawLine = rawLine.substring(0, commentIndex);
    }

    const trimmed = rawLine.trim();
    if (!trimmed) {
      i++;
      continue;
    }

    const indent = rawLine.search(/\S/);
    if (indent <= 2) {
      break;
    }

    if (trimmed.startsWith('set ')) {
      const propLine = trimmed.replace('set ', '').trim();
      const spaceIdx = propLine.indexOf(' ');
      if (spaceIdx !== -1) {
        const prop = propLine.substring(0, spaceIdx);
        const val = propLine.substring(spaceIdx + 1).trim();
        if (['title', 'description', 'footer'].includes(prop)) {
          embed[prop] = parseStringLiteral(val);
        }
      }
    } else if (trimmed === 'timestamp') {
      embed.timestamp = true;
    }

    i++;
  }

  return { embed, nextIndex: i };
}

module.exports = { handleEmbedBlock };