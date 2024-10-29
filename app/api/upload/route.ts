export interface UploadResponse {
  success: boolean;
  archiveId?: string;
  location?: string;
  error?: string;
}

export interface SuccessState {
  archiveId: string;
  location: string;
}

import { GlacierClient, UploadArchiveCommand } from "@aws-sdk/client-glacier";
import { NextResponse } from "next/server";
import { Buffer } from "buffer";

const glacier = new GlacierClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json<UploadResponse>(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const command = new UploadArchiveCommand({
      vaultName: process.env.AWS_GLACIER_VAULT_NAME,
      body: buffer,
      accountId: process.env.AWS_ACCOUNT_ID,
      archiveDescription: file.name,
    });

    const response = await glacier.send(command);

    return NextResponse.json<UploadResponse>({
      success: true,
      archiveId: response.archiveId,
      location: response.location,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json<UploadResponse>(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
