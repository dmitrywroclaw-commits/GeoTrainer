import { writeFile } from 'node:fs/promises';

export async function writeIfChanged(file, content, original) {
  const output = original.includes('\r\n') ? content.replaceAll('\n', '\r\n') : content;
  if (output !== original) await writeFile(file, output, 'utf8');
}
