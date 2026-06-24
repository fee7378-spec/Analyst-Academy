const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('./src', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    // Fix messed up button classes
    content = content.replace(/bg-blue-500 hover:bg-slate-800 dark:bg-slate-900 border border-slate-700/g, 'bg-slate-800 hover:bg-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-700');
    content = content.replace(/bg-slate-800 dark:bg-slate-900 border border-slate-700 text-white/g, 'bg-slate-800 dark:bg-slate-900 border border-slate-700 text-white'); // Leave as is if normal
    content = content.replace(/hover:bg-slate-800 dark:bg-slate-900 border border-slate-700/g, 'hover:bg-slate-700 dark:hover:bg-slate-800 border border-slate-700');
    content = content.replace(/bg-blue-500/g, 'bg-slate-800 dark:bg-slate-900 border border-slate-700');

    // Remove duplicates
    content = content.replace(/border border-slate-700 border border-slate-700/g, 'border border-slate-700');
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log('Updated', filePath);
    }
  }
});
