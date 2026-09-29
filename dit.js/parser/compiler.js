function compileFileContent(fileContent, inlineFunctionsMap) {
  if (typeof fileContent !== 'string') return '';
  return evaluateString(fileContent, null, null, [], inlineFunctionsMap);
}

function evaluateString(str, client, context, args, inlineFunctionsMap) {
  if (typeof str !== 'string') return '';
  let result = '';
  let i = 0;

  while (i < str.length) {
    if (str[i] === '$') {
      const funcStart = i + 1;
      let nameEnd = funcStart;
      while (nameEnd < str.length && /[a-zA-Z0-9_]/.test(str[nameEnd])) {
        nameEnd++;
      }

      const funcName = str.substring(funcStart, nameEnd);

      if (nameEnd < str.length && str[nameEnd] === '(') {
        let parenDepth = 0;
        let argStart = nameEnd;
        let argEnd = nameEnd;

        for (let j = nameEnd; j < str.length; j++) {
          if (str[j] === '(') parenDepth++;
          else if (str[j] === ')') {
            parenDepth--;
            if (parenDepth === 0) {
              argEnd = j;
              break;
            }
          }
        }

        if (parenDepth === 0) {
          const innerArgsStr = str.substring(argStart + 1, argEnd);
          const evaluatedInnerArgsStr = evaluateString(innerArgsStr, client, context, args, inlineFunctionsMap);
          
          const parsedArgs = evaluatedInnerArgsStr ? splitArguments(evaluatedInnerArgsStr).map(arg => {
            arg = arg.trim();
            if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
              return arg.slice(1, -1);
            }
            return arg;
          }) : [];

          const fn = inlineFunctionsMap ? inlineFunctionsMap.get(funcName) : null;
          let evaluatedValue = `$${funcName}(${innerArgsStr})`;

          if (fn) {
            try {
              const res = fn(client, context, parsedArgs, args);
              evaluatedValue = res !== undefined && res !== null ? String(res) : '';
            } catch (err) {
              evaluatedValue = `$${funcName}(${innerArgsStr})`;
            }
          }

          result += evaluatedValue;
          i = argEnd + 1;
          continue;
        }
      } else {
        const fn = inlineFunctionsMap ? inlineFunctionsMap.get(funcName) : null;
        if (fn) {
          try {
            const res = fn(client, context, [], args);
            result += res !== undefined && res !== null ? String(res) : '';
            i = nameEnd;
            continue;
          } catch (err) {
            // keep literal if error
          }
        }
      }
    }

    result += str[i];
    i++;
  }

  return result;
}

function splitArguments(str) {
  const args = [];
  let current = '';
  let parenDepth = 0;
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < str.length; i++) {
    const char = str[i];

    if ((char === '"' || char === "'") && (i === 0 || str[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = char;
      } else if (quoteChar === char) {
        inQuotes = false;
      }
    }

    if (!inQuotes) {
      if (char === '(') parenDepth++;
      else if (char === ')') parenDepth--;
      else if (char === ',' && parenDepth === 0) {
        args.push(current);
        current = '';
        continue;
      }
    }

    current += char;
  }

  if (current) args.push(current);
  return args;
}

module.exports = { compileFileContent, evaluateString };