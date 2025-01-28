export interface DenoAPI {
	init(bucketDir: string, bucketName: string): Promise<void>;
	addTextFile(filePath: string): Promise<void>;
	addPDF(filePath: string): Promise<void>;
	addDirectory(dir: string): Promise<void>;
	indexFiles(files: string[]): Promise<void>;
	save(): Promise<void>;
	retrieve(query: string): Promise<string>;
	query(query: string): Promise<string>;
}
