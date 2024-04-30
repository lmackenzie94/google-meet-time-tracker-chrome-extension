const fs = require('fs');
const archiver = require('archiver');

// Create a new archive instance
const archive = archiver('zip', {
  zlib: { level: 9 } // Compression level
});

// Define the output path and filename for the zip file
const outputZipFile = fs.createWriteStream('./extension.zip');

// Listen for archive errors
archive.on('error', err => {
  console.error('Error creating zip file:', err);
});

// Pipe the output stream to the zip file
archive.pipe(outputZipFile);

// Add files from multiple sources to the archive
archive.directory('./assets');
archive.directory('./dist');
archive.directory('./fonts');
archive.directory('./popup');
archive.directory('./scripts');
archive.file('./manifest.json', { name: 'manifest.json' });

// Finalize the archive
archive.finalize();

// Log a message when the zip file is created successfully
outputZipFile.on('close', () => {
  console.log('Zip file created successfully:', outputZipFile.path);
});
