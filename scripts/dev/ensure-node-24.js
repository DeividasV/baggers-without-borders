const requiredMajor = 24;
const actualMajor = Number(process.versions.node.split(".")[0]);

if (Number.isNaN(actualMajor) || actualMajor !== requiredMajor) {
  console.error(
    `\nThis repo requires Node ${requiredMajor}.x (see .nvmrc / .node-version). ` +
      `You are running Node ${process.versions.node}.\n\n` +
      `Fix:\n` +
      `  nvm install ${requiredMajor}\n` +
      `  nvm use\n`,
  );
  process.exit(1);
}
