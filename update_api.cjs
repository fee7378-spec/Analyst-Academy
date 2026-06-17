const fs = require('fs');
let content = fs.readFileSync('src/lib/api.ts', 'utf-8');

// Insert getPath helper
const getPathDef = `
export const getPath = (basePath: string) => {
  if (typeof window !== 'undefined') {
    const segment = localStorage.getItem('segment') || 'PJ';
    if (
      basePath === 'users' || basePath.startsWith('users/') ||
      basePath === 'templates' || basePath.startsWith('templates/')
    ) {
      return basePath;
    }
    if (basePath === 'counters/users' || basePath === 'counters/templates') {
      return basePath;
    }
    return segment === 'PF' ? \`pf_\${basePath}\` : basePath;
  }
  return basePath;
};
`;

content = content.replace("export const api = {", getPathDef + "\nexport const api = {");

// Replace ref(db, '...') with ref(db, getPath('...'))
// and ref(db, `...`) with ref(db, getPath(`...`))
content = content.replace(/ref\(db,\s*(['`].*?['`])\)/g, "ref(db, getPath($1))");
// Handle ref(logsDb, 'logs')
content = content.replace(/ref\(logsDb, 'logs'\)/g, "ref(logsDb, getPath('logs'))");

fs.writeFileSync('src/lib/api.ts', content);
console.log('Done');
