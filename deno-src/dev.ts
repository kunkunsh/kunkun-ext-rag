import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { Bucket, embeddings, getDocsFromDirectory } from "./bucket.ts";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import {
  JSONLoader,
  JSONLinesLoader,
} from "langchain/document_loaders/fs/json";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { OpenAIEmbeddings } from "@langchain/openai";

const bucket = new Bucket(
  "/Users/hk/Dev/kunkun-extension-repos/kunkun-ext-rag/deno-src/buckets",
  "dev"
);
await bucket.init();
// await bucket.addDirectory(
//   "/Users/hk/Dev/kunkun-docs/src/content/docs/guides/Extensions/Publish"
// );
// await bucket.addPDF("/Users/hk/Downloads/WACV_2025_Caroline_Huakun__Copy_.pdf");
