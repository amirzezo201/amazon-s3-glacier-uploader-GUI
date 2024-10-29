import {
  GlacierClient,
  DescribeJobCommand,
  GetJobOutputCommand,
} from "@aws-sdk/client-glacier";
import { NextResponse } from "next/server";

const glacier = new GlacierClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
  },
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json(
        { error: "Job ID is required" },
        { status: 400 }
      );
    }

    const describeCommand = new DescribeJobCommand({
      vaultName: process.env.AWS_GLACIER_VAULT_NAME,
      accountId: process.env.AWS_ACCOUNT_ID,
      jobId: jobId,
    });

    const jobDescription = await glacier.send(describeCommand);

    if (jobDescription.Completed) {
      const outputCommand = new GetJobOutputCommand({
        vaultName: process.env.AWS_GLACIER_VAULT_NAME,
        accountId: process.env.AWS_ACCOUNT_ID,
        jobId: jobId,
      });

      const jobOutput = await glacier.send(outputCommand);
      const inventory = await jobOutput.body?.transformToString();

      return NextResponse.json({
        completed: true,
        inventory: inventory ? JSON.parse(inventory) : null,
      });
    }

    return NextResponse.json({
      completed: false,
      status: jobDescription.StatusCode,
    });
  } catch (error) {
    console.error("Inventory status check error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}
