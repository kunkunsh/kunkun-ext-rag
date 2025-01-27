// import { FaissStore } from '@langchain/community/vectorstores/faiss';
// import { Bucket, embeddings, getDocsFromDirectory } from './bucket.ts';
// import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
// import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
// import { JSONLoader, JSONLinesLoader } from 'langchain/document_loaders/fs/json';
// import { TextLoader } from 'langchain/document_loaders/fs/text';
// import { OpenAIEmbeddings } from '@langchain/openai';
import { existsSync } from 'node:fs';
// import path from 'path';
import { txtExts } from './constants.ts';
import { Bucket } from './bucket.ts';
import path from 'node:path';

async function indexFiles(bucketName: string, files: string[]): Promise<void> {
	const bucket = new Bucket('./store', bucketName);
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
indexFiles('Kunkun Docs', ['/Users/hk/Dev/kunkun-docs/src/content/docs/developer/DX.mdx']);

// const bucket = new Bucket(
// 	'/Users/hk/Dev/kunkun-extension-repos/kunkun-ext-rag/extensions_support',
// 	'Kunkun Docs'
// );
// await bucket.init();
// const files = ['/Users/hk/Dev/kunkun-docs/src/content/docs/developer/manifest.mdx'];
// for (const file of files) {
// 	if (!existsSync(file)) {
// 		throw new Error(`File ${file} does not exist`);
// 	}
// 	console.error('file', file);
// 	// check if file is directory
// 	const stats = Deno.statSync(file);
// 	if (stats.isFile) {
// 		const ext = path.extname(file);
// 		if (txtExts.includes(ext)) {
// 			console.error('Adding text file', file);
// 			await bucket.addTextFile(file);
// 		} else if (ext === '.pdf') {
// 			console.error('Adding pdf file', file);
// 			await bucket.addPDF(file);
// 		} else if (stats.isDirectory) {
// 			console.error('Adding directory', file);
// 			await bucket.addDirectory(file);
// 		} else {
// 			throw new Error(`Unsupported file type: ${ext}`);
// 		}
// 	}
// }
// await bucket.save();
