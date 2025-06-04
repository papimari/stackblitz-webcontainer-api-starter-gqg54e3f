import './style.css';
import { WebContainer } from '@webcontainer/api';
import { files } from './files';

/** @type {import('@webcontainer/api').WebContainer}  */
let webcontainerInstance;

window.addEventListener('load', async () => {
  textareaEl.value = files['index.js'].file.contents;
  textareaEl.addEventListener('input', (e) => {
    writeIndexJS(e.currentTarget.value);
  });

  // Call only once
  webcontainerInstance = await WebContainer.boot();
  await webcontainerInstance.mount(files);

  const exitCode = await installDependencies();
  if (exitCode !== 0) {
    throw new Error('Installation failed');
  }

  startDevServer();
  initializeTerminal();
});

// Terminal functionality
const terminalInput = document.getElementById('terminalInput');
const terminalOutput = document.getElementById('terminalOutput');
const clearTerminal = document.getElementById('clearTerminal');
let commandHistory = [];
let historyIndex = -1;

const terminalCommands = {
  clear: () => {
    terminalOutput.innerHTML = '';
    return '';
  },
  help: () => `
Comandos disponibles:
  clear       - Limpiar la terminal
  help        - Mostrar esta ayuda
  ls          - Listar archivos
  pwd         - Mostrar directorio actual
  echo [text] - Mostrar texto
  npm [args]  - Ejecutar comandos npm`,
  pwd: () => '/workspace'
};

function initializeTerminal() {
  clearTerminal.addEventListener('click', () => {
    terminalCommands.clear();
  });

  terminalInput.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const command = terminalInput.value.trim();
      
      if (command) {
        // Agregar comando al historial
        addToTerminal(`user@webcontainer:~$ ${command}`);
        commandHistory.push(command);
        historyIndex = commandHistory.length;
        
        // Procesar comando
        try {
          if (terminalCommands[command]) {
            const output = terminalCommands[command]();
            if (output) addToTerminal(output);
          } else {
            // Ejecutar comando en WebContainer
            const process = await webcontainerInstance.spawn('sh', ['-c', command]);
            process.output.pipeTo(new WritableStream({
              write(data) {
                addToTerminal(data);
              }
            }));
            await process.exit;
          }
        } catch (error) {
          addToTerminal(`Error: ${error.message}`);
        }
      }
      
      terminalInput.value = '';
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex > 0) {
        historyIndex--;
        terminalInput.value = commandHistory[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        historyIndex++;
        terminalInput.value = commandHistory[historyIndex];
      } else {
        historyIndex = commandHistory.length;
        terminalInput.value = '';
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      // Aquí se puede implementar el autocompletado
    }
  });

  // Mantener el foco en la terminal
  document.addEventListener('click', () => {
    terminalInput.focus();
  });
}

function addToTerminal(text) {
  const output = document.createElement('div');
  output.textContent = text;
  terminalOutput.appendChild(output);
  terminalOutput.scrollTop = terminalOutput.scrollHeight;
}

// Existing code for file operations and server setup
async function installDependencies() {
  const installProcess = await webcontainerInstance.spawn('npm', ['install']);
  installProcess.output.pipeTo(new WritableStream({
    write(data) {
      console.log(data);
    }
  }));
  return installProcess.exit;
}

async function startDevServer() {
  await webcontainerInstance.spawn('npm', ['run', 'start']);
  webcontainerInstance.on('server-ready', (port, url) => {
    iframeEl.src = url;
  });
}

async function writeIndexJS(content) {
  await webcontainerInstance.fs.writeFile('/index.js', content);
}

document.querySelector('#app').innerHTML = `
  <div class="container">
    <div class="editor">
      <textarea>I am a textarea</textarea>
    </div>
    <div class="preview">
      <iframe src="loading.html"></iframe>
    </div>
    <div class="terminal">
      <div id="terminalOutput" class="terminal-output"></div>
      <input id="terminalInput" class="terminal-input" />
      <button id="clearTerminal">Limpiar Terminal</button>
    </div>
  </div>
`;

const iframeEl = document.querySelector('iframe');
const textareaEl = document.querySelector('textarea');