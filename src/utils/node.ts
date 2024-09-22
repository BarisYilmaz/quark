import fs from 'fs';
import { resolve } from 'path';

export function isPackageInstalled(packageName: string): boolean {
	try {
		const packagePath = resolve(require.resolve(packageName));
		return fs.existsSync(packagePath);
	} catch (error) {
		return false;
	}
}

export function isValidURL(url: string): boolean {
	try {
		new URL(url);
		return true;
	} catch (error) {
		return false;
	}
}

