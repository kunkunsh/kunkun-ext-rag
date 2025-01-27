import crypto from "node:crypto";
import fs from "node:fs";

export function computeSha256(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash("sha256");
    const fileStream = fs.createReadStream(filePath);

    fileStream.on("data", (chunk) => {
      hash.update(chunk);
    });

    fileStream.on("end", () => {
      resolve(hash.digest("hex"));
    });

    fileStream.on("error", (err) => {
      reject(err);
    });
  });
}

export function computeSha256FromText(text: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(text);
  return hash.digest("hex");
}
