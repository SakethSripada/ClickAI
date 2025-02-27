#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const archiver = require('archiver');

// Create a readline interface for prompting the user.
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function that zips a folder using archiver.
function zipFolder(folderPath, outputPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    
    output.on('close', () => resolve(archive.pointer()));
    archive.on('error', (err) => reject(err));
    
    archive.pipe(output);
    archive.directory(folderPath, false);
    archive.finalize();
  });
}

const distFolder = path.join(__dirname, 'dist');
const zippedDir = path.join(__dirname, 'zipped_prod_builds');

// Verify that the dist folder exists.
if (!fs.existsSync(distFolder)) {
  console.error('Error: "dist" folder does not exist in this directory.');
  process.exit(1);
}

// Ensure the zipped_prod_builds directory exists, or create it.
if (!fs.existsSync(zippedDir)) {
  fs.mkdirSync(zippedDir);
}

// Prompt the user for the zip file title.
rl.question('Enter the title for the zip file: ', async (zipTitle) => {
  if (!zipTitle.trim()) {
    console.error('No title provided. Exiting.');
    rl.close();
    return;
  }

  const outputZipPath = path.join(zippedDir, `${zipTitle.trim()}.zip`);
  try {
    const bytes = await zipFolder(distFolder, outputZipPath);
    console.log(`Successfully zipped ${bytes} total bytes to ${outputZipPath}`);
  } catch (err) {
    console.error('Error zipping folder:', err);
  }
  rl.close();
});
