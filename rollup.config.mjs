//! DIDN'T WORK PROPERLY

import typescript from 'rollup-plugin-typescript2';

export default [
  {
    input: './popup/popup.ts',
    output: {
      file: './dist/popup.js',
      name: 'popup',
      format: 'iife'
    },
    plugins: [typescript()]
  },
  {
    input: './scripts/background.ts',
    output: {
      file: './dist/background.js',
      name: 'background',
      format: 'iife'
    },
    plugins: [typescript()]
  },
  {
    input: './scripts/content.ts',
    output: {
      file: './dist/content.js',
      name: 'content',
      format: 'iife'
    },
    plugins: [typescript()]
  }
];
