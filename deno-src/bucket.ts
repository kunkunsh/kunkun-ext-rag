import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OpenAIEmbeddings } from "@langchain/openai";
import * as v from "valibot";
import * as path from "jsr:@std/path";
import { existsSync } from "node:fs";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import {
  JSONLoader,
  JSONLinesLoader,
} from "langchain/document_loaders/fs/json";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { computeSha256FromText } from "./crypto.ts";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";

export const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
});

export const MetadataSchema = v.object({
  filesSha256: v.array(v.string()),
});
export type Metadata = v.InferOutput<typeof MetadataSchema>;

export async function getDocsFromDirectory(
  directoryPath: string
): Promise<Document[]> {
  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });

  const loader = new DirectoryLoader(directoryPath, {
    ".json": (path) => new JSONLoader(path, "/texts"),
    ".jsonl": (path) => new JSONLinesLoader(path, "/html"),
    ".txt": (path) => new TextLoader(path),
    ".md": (path) => new TextLoader(path),
    ".mdx": (path) => new TextLoader(path),
  });
  const docs = await loader.load();
  const allSplits = await splitter.splitDocuments(docs);
  return allSplits;
}

export class Bucket {
  private readonly bucketPath: string;
  private readonly faissStorePath: string;
  private readonly metadataPath: string;
  private _vectorStore: FaissStore | null = null;
  filesSha256: Set<string> = new Set();

  constructor(
    private readonly bucketDir: string,
    private readonly bucketName: string
  ) {
    this.bucketPath = path.join(this.bucketDir, this.bucketName);
    this.faissStorePath = path.join(this.bucketPath, "faiss-store");
    this.metadataPath = path.join(this.bucketPath, "metadata.json");
  }

  async init() {
    if (!existsSync(this.bucketPath)) {
      Deno.mkdirSync(this.bucketPath, { recursive: true });
    }
    if (existsSync(this.metadataPath)) {
      const metadata = JSON.parse(Deno.readTextFileSync(this.metadataPath));
      const parsedMetadata = v.safeParse(MetadataSchema, metadata);
      if (parsedMetadata.success) {
        this.filesSha256 = new Set(parsedMetadata.output.filesSha256);
      } else {
        throw new Error("Invalid metadata");
      }
    }
    this.updateMetadata();
    this._vectorStore = await this.getVectorStore();
    // if (this._vectorStore) {
    //   await this._vectorStore.save(this.faissStorePath);
    // }
  }

  updateMetadata() {
    const metadata: Metadata = {
      filesSha256: Array.from(this.filesSha256),
    };
    Deno.writeTextFileSync(this.metadataPath, JSON.stringify(metadata));
  }

  async getVectorStore() {
    if (
      existsSync(this.faissStorePath) &&
      existsSync(path.join(this.faissStorePath, "docstore.json"))
    ) {
      const vectorStore = await FaissStore.load(
        this.faissStorePath,
        embeddings
      );
      return vectorStore;
    }
    // const vectorStore = await FaissStore.fromDocuments(docs, embeddings);
    const vectorStore = new FaissStore(embeddings, {});
    // await vectorStore.save(this.faissStorePath);
    return vectorStore;
  }

  get vectorStore() {
    if (this._vectorStore === null) {
      throw new Error("Vector store not initialized");
    }
    return this._vectorStore;
  }

  private async addDocuments(documents: Document[]) {
    await this.vectorStore.addDocuments(documents);
    await this.vectorStore.save(this.faissStorePath);
  }

  private fillSha256(documents: Document[]) {
    for (const doc of documents) {
      const sha256 = computeSha256FromText(doc.pageContent);
      doc.metadata.sha256 = sha256;
    }
  }

  private getFilteredDocs(documents: Document[]) {
    return documents.filter(
      (doc) => !this.filesSha256.has(doc.metadata.sha256)
    );
  }

  private updateSha256(docs: Document[]) {
    for (const doc of docs) {
      this.filesSha256.add(doc.metadata.sha256 as string);
    }
    this.updateMetadata();
  }

  async addDirectory(directoryPath: string) {
    if (!existsSync(directoryPath)) {
      throw new Error("Directory does not exist");
    }
    // check if path is a directory or file
    const stats = Deno.statSync(directoryPath);
    if (stats.isFile) {
      throw new Error("Path is a file");
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
      chunkOverlap: 200,
    });
    const allSplits = await splitter.splitDocuments(fileteredDocs);
    await this.addDocuments(allSplits);
  }

  async addTextFile(filePath: string) {
    const loader = new TextLoader(filePath);
    const docs = await loader.load();
    this.fillSha256(docs);
    const fileteredDocs = this.getFilteredDocs(docs);
    this.updateSha256(docs);
    await this.addDocuments(fileteredDocs);
  }

  async addPDF(filePath: string) {
    const loader = new PDFLoader(filePath);
    const docs = await loader.load();
    this.fillSha256(docs);
    const fileteredDocs = this.getFilteredDocs(docs);
    this.updateSha256(docs);
    await this.addDocuments(fileteredDocs);
  }
}
