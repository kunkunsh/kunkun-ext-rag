import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { Document } from "@langchain/core/documents";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { pull } from "langchain/hub";
import { Annotation, StateGraph } from "@langchain/langgraph";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import fs from "node:fs";
import "jsr:@std/dotenv/load";
import {
  JSONLoader,
  JSONLinesLoader,
} from "langchain/document_loaders/fs/json";
import { TextLoader } from "langchain/document_loaders/fs/text";

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large",
});
async function getVectorStore(): Promise<FaissStore> {
  // if ./FaissStore dir exists, load it
  if (fs.existsSync("./FaissStore")) {
    return FaissStore.load("./FaissStore", embeddings);
  }

  const loader = new DirectoryLoader("/Users/hk/Desktop/rag-ts/datasets", {
    ".json": (path) => new JSONLoader(path, "/texts"),
    ".jsonl": (path) => new JSONLinesLoader(path, "/html"),
    ".txt": (path) => new TextLoader(path),
    ".md": (path) => new TextLoader(path),
  });
  const docs = await loader.load();
  console.log(docs);

  const splitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1000,
    chunkOverlap: 200,
  });
  const allSplits = await splitter.splitDocuments(docs);

  const vectorStore = new FaissStore(embeddings, {});
  await vectorStore.addDocuments(allSplits);

  // Save the vector store to disk
  await vectorStore.save("./FaissStore");
  return vectorStore;
}

// Add this new function to delete documents
async function deleteDocuments(vectorStore: FaissStore, ids: string[]) {
  await vectorStore.delete({ ids });
  // Save the updated store
  await vectorStore.save("./FaissStore");
}

const vectorStore = await getVectorStore();

const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

// Define prompt for question-answering
const promptTemplate = await pull<ChatPromptTemplate>("rlm/rag-prompt");

// Define state for application
const InputStateAnnotation = Annotation.Root({
  question: Annotation<string>,
});

const StateAnnotation = Annotation.Root({
  question: Annotation<string>,
  context: Annotation<Document[]>,
  answer: Annotation<string>,
});

// Define application steps
const retrieve = async (state: typeof InputStateAnnotation.State) => {
  const retrievedDocs = await vectorStore.similaritySearch(state.question);
  return { context: retrievedDocs };
};

const generate = async (state: typeof StateAnnotation.State) => {
  const docsContent = state.context.map((doc) => doc.pageContent).join("\n");
  const messages = await promptTemplate.invoke({
    question: state.question,
    context: docsContent,
  });
  const response = await llm.invoke(messages);
  return { answer: response.content };
};

// Compile application and test
const graph = new StateGraph(StateAnnotation)
  .addNode("retrieve", retrieve)
  .addNode("generate", generate)
  .addEdge("__start__", "retrieve")
  .addEdge("retrieve", "generate")
  .addEdge("generate", "__end__")
  .compile();

let inputs = { question: "What is Task Decomposition?" };

while (true) {
  const question = prompt("Enter your question (or 'exit' to quit): ");
  if (!question || question.toLowerCase() === "exit") {
    break;
  }

  const result = await graph.invoke({ question });
  console.log("\nAnswer:");
  console.log(result.answer);
  console.log("\n-------------------\n");
}
