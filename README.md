# Kunkun RAG Extension

RAG means Retrieval-Augmented Generation.

This extension is a local RAG app, that allows you to index a local directory of files and search them using a LLM model.

If you don't know what RAG is, see [Wikipedia: RAG](https://en.wikipedia.org/wiki/Retrieval-augmented_generation)

Basically, this extension allows you index local files and directories and search them using a LLM model.

For now, only text files and pdf files are supported.

The following file extensions are supported for `Add Files`:

- `.txt`
- `.pdf`
- `.md`
- `.mdx`

`.pdf` is not supported yet for `Add Directory`.

> [!CAUTION]
> If you want other file extensions to be supported, please send a issue to the repository.
> I will add options to let user add dynamic file extensions if there are people using this extension.

This is to prevent indexing other files you may not want to index, like lock files.

## Sample Images

![](https://i.imgur.com/SMwsks7.png)
![](https://i.imgur.com/KPkwhMN.png)

## API Key

You need to supply an OpenAI API key to use this extension. It's kept locally with encryption.
It's used for running embedding and LLM model. So if you index lots of files and directories, it may cost you some money.
Index only the files you need.

## Reference

- [Langchain RAG](https://js.langchain.com/docs/concepts/rag/)
