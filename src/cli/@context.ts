import {stat} from 'fs/promises';
import {dirname, join} from 'path';

export type PackageMangerName = 'npm' | 'yarn' | 'pnpm';

const LOCK_FILE_DICT: Record<PackageMangerName, string> = {
  npm: 'package-lock.json',
  yarn: 'yarn.lock',
  pnpm: 'pnpm-lock.yaml',
};

const PACKAGE_MANAGER_NAMES = Object.keys(
  LOCK_FILE_DICT,
) as PackageMangerName[];

export async function detectPackageManger(
  cwd: string,
  defaultPackageManager: PackageMangerName = 'npm',
): Promise<[PackageMangerName, string]> {
  let candidate = cwd;

  let current = cwd;

  while (true) {
    if (await exists(join(current, 'package.json'))) {
      candidate = current;

      for (const name of PACKAGE_MANAGER_NAMES) {
        if (await exists(join(current, LOCK_FILE_DICT[name]))) {
          return [name, candidate];
        }
      }
    }

    const parent = dirname(current);

    if (current === parent) {
      return [defaultPackageManager, candidate];
    }

    current = parent;
  }
}

async function exists(path: string): Promise<boolean> {
  return stat(path).then(
    () => true,
    () => false,
  );
}
