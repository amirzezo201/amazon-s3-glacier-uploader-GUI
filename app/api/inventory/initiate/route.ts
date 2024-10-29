import { GlacierClient, InitiateJobCommand } from "@aws-sdk/client-glacier";
import { NextResponse } from "next/server";
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

export interface InventoryJob {
  jobId: string;
  status: string;
  creationDate: string;
  completed: boolean;
}

export interface ArchiveItem {
  ArchiveId: string;
  ArchiveDescription: string;
  CreationDate: string;
  Size: number;
  SHA256TreeHash: string;
}
const glacier = new GlacierClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

export async function POST() {
  try {
    const command = new InitiateJobCommand({
      vaultName: process.env.AWS_GLACIER_VAULT_NAME,
      accountId: process.env.AWS_ACCOUNT_ID,
      jobParameters: {
        Type: "inventory-retrieval",
        Description: "Inventory retrieval job",
        Format: "JSON",
      },
    });

    const response = await glacier.send(command);

    return NextResponse.json({
      success: true,
      jobId: response.jobId,
    });
  } catch (error) {
    console.error("Inventory initiation error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
