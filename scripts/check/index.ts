// Runs every repository policy check with developer environment loading disabled.
export {};
for (const script of ['docs', 'imports', 'names', 'logs', 'comments']) {
  const child = Bun.spawn([process.execPath, '--no-env-file', 'run', `scripts/check/${script}.ts`], {
    stdout: 'inherit',
    stderr: 'inherit',
  });
  const exitCode = await child.exited;
  if (exitCode !== 0) {
    process.exitCode = exitCode;
  }
}
