export interface DenoAPI {
	indexFiles(bucketName: string, files: string[]): Promise<void>;
}
