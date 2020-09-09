exports.normalize = text => {
  const stripped = text.replace(/(?:^\n+|(?:\n\s*)+$)/g, '');
  const lines = stripped.split(/\n/);

  const leadingWhitespace = lines[0].match(/^\s+/);
  if (!leadingWhitespace || !lines.every(line => line.indexOf(leadingWhitespace[0]) === 0)) {
    return lines.join('\n');
  }

  return lines.map(line => line.slice(leadingWhitespace[0].length)).join('\n');
};
