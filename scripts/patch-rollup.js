const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'node_modules', 'rollup', 'dist', 'native.js');

if (fs.existsSync(targetFile)) {
  let content = fs.readFileSync(targetFile, 'utf8');
  if (!content.includes('@rollup/wasm-node')) {
    const oldSnippet = 'const requireWithFriendlyError = id => {\n\ttry {\n\t\treturn require(id);\n\t} catch (error) {';
    const newSnippet = 'const requireWithFriendlyError = id => {\n\ttry {\n\t\treturn require(id);\n\t} catch (error) {\n\t\ttry {\n\t\t\treturn require(\'@rollup/wasm-node/dist/native.js\');\n\t\t} catch (wasmErr) {}';
    if (content.includes(oldSnippet)) {
      content = content.replace(oldSnippet, newSnippet);
      fs.writeFileSync(targetFile, content, 'utf8');
      console.log('[PostInstall] Rollup WASM fallback parchado exitosamente.');
    }
  } else {
    console.log('[PostInstall] Rollup ya tiene el fallback de WASM configurado.');
  }
}