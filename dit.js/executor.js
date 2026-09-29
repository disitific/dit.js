const { EmbedBuilder } = require('discord.js');
const { evaluateString } = require('./parser/compiler');

function evaluateCondition(conditionExpr, client, context, args, inlineFunctionsMap) {
  // Evaluates macros across the entire expression first (e.g. "$message(1)")
  const evaluatedExpr = evaluateString(conditionExpr, client, context, args, inlineFunctionsMap);
  
  // Support compound conditions split explicitly by "and"
  const clauses = evaluatedExpr.split(/\s+and\s+/i);

  for (const clause of clauses) {
    const trimmedClause = clause.trim();

    // 1. Match numeric comparisons: e.g. "$message(1) > 5" or "10 < $message(2)" or double-quoted numbers
    let numMatch = trimmedClause.match(/^(?:"|')?(.*?)(?:"|')?\s*(>=|<=|>|<)\s*(?:"|')?(.*?)(?:"|')?$/i);
    
    // Check if it's a valid numeric comparison (and not an equality operator like 'is' or 'isnt')
    if (numMatch && !['is', 'isnt'].includes(numMatch[2].toLowerCase())) {
      const leftVal = Number(numMatch[1]);
      const op = numMatch[2];
      const rightVal = Number(numMatch[3]);

      if (!isNaN(leftVal) && !isNaN(rightVal)) {
        let passes = false;
        if (op === '>') passes = leftVal > rightVal;
        else if (op === '<') passes = leftVal < rightVal;
        else if (op === '>=') passes = leftVal >= rightVal;
        else if (op === '<=') passes = leftVal <= rightVal;

        if (!passes) return false;
        continue;
      }
    }

    // 2. Match text equality/inequality: e.g. "$message(1)" is "embed"
    let match = trimmedClause.match(/^"(.*?)"\s+(is|isnt)\s+"(.*?)"$/i);
    if (!match) {
      match = trimmedClause.match(/^'(.*?)'\s+(is|isnt)\s+'(.*?)'$/i);
    }

    if (match) {
      const left = match[1];
      const op = match[2].toLowerCase();
      const right = match[3];

      const passes = op === 'is' ? left === right : left !== right;
      if (!passes) return false;
    } else {
      // Fallback truthy check
      if (!trimmedClause || trimmedClause.toLowerCase() === 'false' || trimmedClause === '0') return false;
    }
  }

  return true;
}

async function executeActionList(actions, client, context, args, inlineFunctionsMap) {
  for (const action of actions) {
    if (action.type === 'if') {
      let executed = false;

      // Check primary 'if' condition
      if (evaluateCondition(action.condition, client, context, args, inlineFunctionsMap)) {
        await executeActionList(action.actions, client, context, args, inlineFunctionsMap);
        executed = true;
      } 
      // Check 'else if' chain branches
      else if (action.elseIfs && action.elseIfs.length > 0) {
        for (const elseIfBlock of action.elseIfs) {
          if (evaluateCondition(elseIfBlock.condition, client, context, args, inlineFunctionsMap)) {
            await executeActionList(elseIfBlock.actions, client, context, args, inlineFunctionsMap);
            executed = true;
            break;
          }
        }
      }

      // Fallback to 'else' if no branch matched
      if (!executed && action.elseActions && action.elseActions.length > 0) {
        await executeActionList(action.elseActions, client, context, args, inlineFunctionsMap);
      }
    } 
    else if (action.type === 'reply') {
      const rawContent = action.content;
      const content = rawContent ? evaluateString(rawContent, client, context, args, inlineFunctionsMap) : null;
      let embedBuilder = null;

      if (action.embed) {
        embedBuilder = new EmbedBuilder();
        if (action.embed.title) {
          embedBuilder.setTitle(evaluateString(action.embed.title, client, context, args, inlineFunctionsMap));
        }
        if (action.embed.description) {
          embedBuilder.setDescription(evaluateString(action.embed.description, client, context, args, inlineFunctionsMap));
        }
        if (action.embed.footer) {
          embedBuilder.setFooter({ text: evaluateString(action.embed.footer, client, context, args, inlineFunctionsMap) });
        }
        if (action.embed.timestamp) {
          embedBuilder.setTimestamp();
        }
      }

      const payload = {};
      if (content && content.trim() !== '') {
        payload.content = content;
      }
      if (embedBuilder) {
        payload.embeds = [embedBuilder];
      }

      if (!payload.content && (!payload.embeds || payload.embeds.length === 0)) {
        continue;
      }

      let isEphemeral = Boolean(action.ephemeral);
      if (isEphemeral && !context.isCommand) {
        isEphemeral = false;
      }
      payload.ephemeral = isEphemeral;

      if (context.isCommand && typeof context.reply === 'function') {
        if (context.replied || context.deferred) {
          await context.followUp(payload);
        } else {
          await context.reply(payload);
        }
      } else if (typeof context.reply === 'function') {
        await context.reply(payload);
      }
    } 
    else if (action.type === 'reaction') {
      const emoji = action.emoji ? evaluateString(action.emoji, client, context, args, inlineFunctionsMap) : null;
      if (emoji && context.react && typeof context.react === 'function') {
        try {
          await context.react(emoji);
        } catch (err) {
          console.error(`[dit.js] Failed to add reaction:`, err);
        }
      }
    }
  }
}

async function executeCommand(client, command, context, args = [], inlineFunctionsMap) {
  await executeActionList(command.actions, client, context, args, inlineFunctionsMap);
}

module.exports = { executeCommand };