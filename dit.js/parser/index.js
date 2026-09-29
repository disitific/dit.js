function parseStringLiteral(str) {
  if (!str) return '';
  if ((str.startsWith('"') && str.endsWith('"')) || (str.startsWith("'") && str.endsWith("'"))) {
    return str.slice(1, -1);
  }
  return str;
}

function parseDitFile(fileContent) {
  const lines = fileContent.split(/\r?\n/);
  const commands = [];
  let currentCmd = null;

  function parseActionBlock(startIndex, parentIndent) {
    const actions = [];
    let i = startIndex;

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
      if (indent <= parentIndent) {
        break;
      }

      // Handle 'if' conditional blocks
      if (trimmed.startsWith('if ')) {
        const conditionExpr = trimmed.replace('if ', '').trim();
        const ifAction = {
          type: 'if',
          condition: conditionExpr,
          actions: [],
          elseIfs: [],
          elseActions: []
        };

        // Parse nested actions inside the 'if' body
        const parsedIfBlock = parseActionBlock(i + 1, indent);
        ifAction.actions = parsedIfBlock.actions;
        i = parsedIfBlock.nextIndex;

        // Check for subsequent 'else if' or 'else' blocks
        while (i < lines.length) {
          let nextRaw = lines[i];
          const cIdx = nextRaw.indexOf('//');
          if (cIdx !== -1) nextRaw = nextRaw.substring(0, cIdx);
          const nextTrimmed = nextRaw.trim();

          if (nextTrimmed.startsWith('else if ')) {
            const elseIfCondition = nextTrimmed.replace('else if ', '').trim();
            const parsedElseIfBlock = parseActionBlock(i + 1, indent);
            ifAction.elseIfs.push({
              condition: elseIfCondition,
              actions: parsedElseIfBlock.actions
            });
            i = parsedElseIfBlock.nextIndex;
          } else if (nextTrimmed === 'else') {
            const parsedElseBlock = parseActionBlock(i + 1, indent);
            ifAction.elseActions = parsedElseBlock.actions;
            i = parsedElseBlock.nextIndex;
            break;
          } else {
            break;
          }
        }

        actions.push(ifAction);
        continue;
      }

      // Handle reply actions
      if (trimmed.startsWith('reply')) {
        let remainder = trimmed.replace('reply', '').trim();
        let isEphemeral = false;

        if (remainder.startsWith('ephemeral')) {
          isEphemeral = true;
          remainder = remainder.replace('ephemeral', '').trim();
        }

        const replyAction = {
          type: 'reply',
          ephemeral: isEphemeral,
          content: remainder ? parseStringLiteral(remainder) : null,
          embed: null
        };

        if (i + 1 < lines.length && lines[i + 1].trim().startsWith('new Embed')) {
          i += 2;
          const embedIndent = lines[i - 1].search(/\S/);
          const embedData = { title: null, description: null, footer: null, timestamp: false };

          while (i < lines.length) {
            let embedLine = lines[i];
            const cIdx = embedLine.indexOf('//');
            if (cIdx !== -1) embedLine = embedLine.substring(0, cIdx);
            
            const eTrimmed = embedLine.trim();
            if (!eTrimmed) { i++; continue; }

            if (embedLine.search(/\S/) <= embedIndent) {
              i--;
              break;
            }

            if (eTrimmed.startsWith('set ')) {
              const propLine = eTrimmed.replace('set ', '').trim();
              const spaceIdx = propLine.indexOf(' ');
              if (spaceIdx !== -1) {
                const prop = propLine.substring(0, spaceIdx);
                const propVal = propLine.substring(spaceIdx + 1).trim();
                if (['title', 'description', 'footer'].includes(prop)) {
                  embedData[prop] = parseStringLiteral(propVal);
                }
              }
            } else if (eTrimmed === 'timestamp') {
              embedData.timestamp = true;
            }
            i++;
          }
          replyAction.embed = embedData;
        }

        actions.push(replyAction);
        i++;
        continue;
      }

      // Handle reaction actions
      if (trimmed.startsWith('add reaction')) {
        const val = trimmed.replace('add reaction', '').trim();
        actions.push({
          type: 'reaction',
          emoji: parseStringLiteral(val)
        });
        i++;
        continue;
      }

      i++;
    }

    return { actions, nextIndex: i };
  }

  for (let i = 0; i < lines.length; i++) {
    let rawLine = lines[i];
    const commentIndex = rawLine.indexOf('//');
    if (commentIndex !== -1) {
      rawLine = rawLine.substring(0, commentIndex);
    }

    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('new command') || trimmed.startsWith('new slashcommand')) {
      if (currentCmd) commands.push(currentCmd);

      const isSlash = trimmed.startsWith('new slashcommand');
      const prefixToRemove = isSlash ? 'new slashcommand' : 'new command';
      const headerContent = trimmed.replace(prefixToRemove, '').trim();
      const parts = headerContent.split(',').map(p => parseStringLiteral(p.trim())).filter(Boolean);

      currentCmd = {
        name: parts[0] || '',
        aliases: parts.slice(1),
        isSlash,
        actions: []
      };

      const parsedBlock = parseActionBlock(i + 1, 0);
      currentCmd.actions = parsedBlock.actions;
      i = parsedBlock.nextIndex - 1;
    }
  }

  if (currentCmd) commands.push(currentCmd);
  return commands;
}

module.exports = parseDitFile;