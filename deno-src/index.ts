import { expose } from '@kunkun/api/runtime/deno';
import type { DenoAPI } from '../src/api.types.ts';
import { Bucket } from './bucket.ts';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { txtExts } from './constants.ts';

export const extensionSupportPath = Deno.env.get('EXTENSION_SUPPORT');
if (!extensionSupportPath) {
	throw new Error('EXTENSION_SUPPORT is not set');
}

expose({
	async indexFiles(bucketName: string, files: string[]): Promise<void> {
		const cwd = Deno.cwd();
		console.error('cwd', cwd);
		const bucket = new Bucket(extensionSupportPath, bucketName);
		// const bucket = new Bucket(extensionSupportPath, bucketName);
		console.error('bucket path', bucket.bucketPath);
		console.error('files', files);
		await bucket.init();
		for (const file of files) {
			if (!existsSync(file)) {
				throw new Error(`File ${file} does not exist`);
			}
			console.error('file', file);
			// check if file is directory
			const stats = Deno.statSync(file);
			if (stats.isFile) {
				const ext = path.extname(file);
				if (txtExts.includes(ext)) {
					console.error('Adding text file', file);
					await bucket.addTextFile(file);
					console.error('Finished adding text file', file);
				} else if (ext === '.pdf') {
					console.error('Adding pdf file', file);
					await bucket.addPDF(file);
				} else if (stats.isDirectory) {
					console.error('Adding directory', file);
					await bucket.addDirectory(file);
				} else {
					throw new Error(`Unsupported file type: ${ext}`);
				}
			}
		}
		await bucket.save();
	}
} satisfies DenoAPI);
