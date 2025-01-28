import { FaissStore } from '@langchain/community/vectorstores/faiss';
import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import * as v from 'valibot';
import * as path from 'jsr:@std/path';
import { existsSync, readdirSync } from 'node:fs';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { TextLoader } from 'langchain/document_loaders/fs/text';
import { computeSha256FromText } from './crypto.ts';
import { PDFLoader } from '@langchain/community/document_loaders/fs/pdf';
import { DenoAPI } from '../src/api.types.ts';
import { txtExts } from './constants.ts';
import { AIMessageChunk } from '@langchain/core/messages';

export const embeddings = new OpenAIEmbeddings({
	// configuration: {
	// 	baseURL: 'https://api.deepseek.com'
	// },
	model: 'text-embedding-3-large'
});

export const MetadataSchema = v.object({
	filesSha256: v.array(v.string())
});
export type Metadata = v.InferOutput<typeof MetadataSchema>;

export async function getDocsFromDirectory(directoryPath: string): Promise<Document[]> {
	const splitter = new RecursiveCharacterTextSplitter({
		chunkSize: 1000,
		chunkOverlap: 200
	});

	const loader = new DirectoryLoader(directoryPath, {
		// '.json': (path) => new JSONLoader(path, '/texts'),
		// '.jsonl': (path) => new JSONLinesLoader(path, '/html'),
		'.txt': (path) => new TextLoader(path),
		'.md': (path) => new TextLoader(path),
		'.mdx': (path) => new TextLoader(path)
	});
	const docs = await loader.load();
	const allSplits = await splitter.splitDocuments(docs);
	return allSplits;
}

export class Bucket implements DenoAPI {
	bucketPath: string = '';
	faissStorePath: string = '';
	metadataPath: string = '';
	bucketDir: string = '';
	bucketName: string = '';
	private _vectorStore: FaissStore | null = null;
	filesSha256: Set<string> = new Set();

	async init(bucketDir: string, bucketName: string) {
		this.bucketDir = bucketDir;
		this.bucketName = bucketName;
		this.bucketPath = path.join(this.bucketDir, this.bucketName);
		this.faissStorePath = path.join(this.bucketPath, 'faiss-store');
		this.metadataPath = path.join(this.bucketPath, 'metadata.json');

		if (!existsSync(this.bucketPath)) {
			Deno.mkdirSync(this.bucketPath, { recursive: true });
		}
		if (existsSync(this.metadataPath)) {
			const metadata = JSON.parse(Deno.readTextFileSync(this.metadataPath));
			const parsedMetadata = v.safeParse(MetadataSchema, metadata);
			if (parsedMetadata.success) {
				this.filesSha256 = new Set(parsedMetadata.output.filesSha256);
			} else {
				throw new Error('Invalid metadata');
			}
		}
		this.updateMetadata();
		this._vectorStore = await this.getVectorStore();
	}

	updateMetadata() {
		const metadata: Metadata = {
			filesSha256: Array.from(this.filesSha256)
		};
		Deno.writeTextFileSync(this.metadataPath, JSON.stringify(metadata));
	}

	async getVectorStore() {
		if (
			existsSync(this.faissStorePath) &&
			existsSync(path.join(this.faissStorePath, 'docstore.json'))
		) {
			const vectorStore = await FaissStore.load(this.faissStorePath, embeddings);
			return vectorStore;
		}
		// const vectorStore = await FaissStore.fromDocuments(docs, embeddings);
		const vectorStore = new FaissStore(embeddings, {});
		// await vectorStore.save(this.faissStorePath);
		return vectorStore;
	}

	get vectorStore() {
		if (this._vectorStore === null) {
			throw new Error('Vector store not initialized');
		}
		return this._vectorStore;
	}

	private async addDocuments(documents: Document[]) {
		await this.vectorStore.addDocuments(documents);
		// await this.vectorStore.save(this.faissStorePath);
	}

	private fillSha256(documents: Document[]) {
		for (const doc of documents) {
			const sha256 = computeSha256FromText(doc.pageContent);
			doc.metadata.sha256 = sha256;
		}
	}

	private getFilteredDocs(documents: Document[]) {
		return documents.filter((doc) => !this.filesSha256.has(doc.metadata.sha256));
	}

	private updateSha256(docs: Document[]) {
		for (const doc of docs) {
			this.filesSha256.add(doc.metadata.sha256 as string);
		}
		this.updateMetadata();
	}

	async addDirectory(directoryPath: string) {
		if (!existsSync(directoryPath)) {
			throw new Error('Directory does not exist');
		}
		// check if path is a directory or file
		const stats = Deno.statSync(directoryPath);
		if (stats.isFile) {
			throw new Error('Path is a file');
		}

		const docs = await getDocsFromDirectory(directoryPath);
		this.fillSha256(docs);
		const fileteredDocs = this.getFilteredDocs(docs);
		for (const doc of fileteredDocs) {
			this.filesSha256.add(doc.metadata.sha256 as string);
		}
		this.updateMetadata();
		const splitter = new RecursiveCharacterTextSplitter({
			chunkSize: 1000,
			chunkOverlap: 200
		});
		const allSplits = await splitter.splitDocuments(fileteredDocs);
		await this.addDocuments(allSplits);
	}

	async addTextFile(filePath: string) {
		const loader = new TextLoader(filePath);
		const docs = await loader.load();
		console.error('Loaded docs', docs.length);
		this.fillSha256(docs);
		const fileteredDocs = this.getFilteredDocs(docs);
		console.error('Filtered docs', fileteredDocs.length);
		this.updateSha256(docs);
		console.error('Updated sha256', this.filesSha256.size);
		// await this.addDocuments(fileteredDocs);
		await this.vectorStore.addDocuments(fileteredDocs).catch((err) => {
			console.error('Error adding documents', err);
		});
	}

	async save() {
		console.error('Save Bucket', this.vectorStore.docstore._docs.size);
		if (existsSync(this.faissStorePath) && readdirSync(this.faissStorePath).length === 0) {
			Deno.removeSync(this.bucketPath, { recursive: true });
		}
		if (this.vectorStore.docstore._docs.size === 0) {
			throw new Error('No documents to save');
		}
		await this.vectorStore.save(this.faissStorePath);
	}

	async addPDF(filePath: string) {
		const loader = new PDFLoader(filePath);
		const docs = await loader.load();
		this.fillSha256(docs);
		const fileteredDocs = this.getFilteredDocs(docs);
		this.updateSha256(docs);
		await this.addDocuments(fileteredDocs);
	}

	async retrieve(query: string) {
		const retriever = this.vectorStore.asRetriever();
		const docs = await retriever.invoke(query);
		const docsText = docs.map((d) => d.pageContent).join('');
		return docsText;
	}

	async query(question: string) {
		const docsText = await this.retrieve(question);
		const systemPrompt = `You are an assistant for question-answering tasks.
Use the following pieces of retrieved context to answer the question.
If you don't know the answer, just say that you don't know.
Use three sentences maximum and keep the answer concise.
Context: {context}:`;

		// Populate the system prompt with the retrieved context
		const systemPromptFmt = systemPrompt.replace('{context}', docsText);

		// Create a model
		const model = new ChatOpenAI({
			model: 'gpt-4o',
			temperature: 0
		});

		// Generate a response
		const ans: AIMessageChunk = await model.invoke([
			{
				role: 'system',
				content: systemPromptFmt
			},
			{
				role: 'user',
				content: question
			}
		]);
		return ans.content.toString();
	}

	async indexFiles(files: string[]) {
		console.error('Indexing files', files);
		for (const file of files) {
			if (!existsSync(file)) {
				throw new Error(`File ${file} does not exist`);
			}
			// check if file is directory
			const stats = Deno.statSync(file);
			console.error('Indexing file', file, 'stats.isFile', stats.isFile);
			if (stats.isFile) {
				const ext = path.extname(file);
				if (txtExts.includes(ext)) {
					console.error('Adding text file 1', file);
					await this.addTextFile(file);
					console.error('Finished adding text file', file);
				} else if (ext === '.pdf') {
					console.error('Adding pdf file', file);
					await this.addPDF(file);
				} else {
					throw new Error(`Unsupported file type: ${ext}`);
				}
			} else {
				console.error('Adding directory', file);
				await this.addDirectory(file);
			}
		}
	}
}
