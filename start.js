const { spawn } = require('child_process');
const path = require('path');

console.log('=== Starting Digital Signage System ===');

// Helper to spawn and pipe outputs
const runProcess = (name, command, args, cwd) => {
  const p = spawn(command, args, { cwd, shell: true });

  p.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line) console.log(`[${name}] ${line}`);
    });
  });

  p.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line) console.error(`[${name}] ERROR: ${line}`);
    });
  });

  p.on('close', (code) => {
    console.log(`[${name}] process exited with code ${code}`);
  });

  return p;
};

const backendDir = path.join(__dirname, 'backend');
const frontendDir = path.join(__dirname, 'frontend');

const backend = runProcess('Backend', 'npm', ['start'], backendDir);
const frontend = runProcess('Frontend', 'npm', ['run', 'dev'], frontendDir);

// Handle process termination cleanly
const handleTermination = () => {
  console.log('\nShutting down backend and frontend processes...');
  try {
    backend.kill('SIGINT');
  } catch (e) {}
  try {
    frontend.kill('SIGINT');
  } catch (e) {}
  process.exit();
};

process.on('SIGINT', handleTermination);
process.on('SIGTERM', handleTermination);
