import { writeFileSync } from 'fs';
import { promisify } from 'util';
import * as child from 'child_process';
const exec = promisify(child.exec);
const args = process.argv.slice(2);

async function createVersionsFile(filename) {
  const fullRevision = (await exec('git rev-parse HEAD')).stdout.toString().trim();
  const revision = (await exec('git rev-parse --short HEAD')).stdout.toString().trim();
  const branch = (await exec('git rev-parse --abbrev-ref HEAD')).stdout.toString().trim();

  console.log(`version: '${process.env['npm_package_version']}', revision: '${revision}', branch: '${branch}'`);

  const content =
    `// this file is automatically generated by git-version.mjs script
export const versions = {
  version: '${process.env['npm_package_version']}',
  revision: '${revision}',
  commitHash: '${fullRevision}',
  branch: '${branch}',
  date: '${new Date().toISOString()}',
};
`;

  writeFileSync(filename, content, {encoding: 'utf8'});
}

createVersionsFile(args[0] + '/src/environments/version.ts');
