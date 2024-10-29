# AWS Glacier Storage Data Uploader GUI

A modern web interface for managing AWS Glacier Storage operations, built with Next.js 14, TypeScript, and AWS SDK v3. This application provides a user-friendly way to upload, manage, and retrieve data from AWS Glacier vaults.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## Features

- 📤 Upload files to AWS Glacier with progress tracking
- 📋 View inventory of archived files
- 📥 Initiate and track retrieval jobs
- 🔍 Monitor job status with real-time updates
- 📊 File size and storage statistics
- 🔐 Secure AWS credentials management
- 🎯 Multi-part upload support for large files

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js 18.x or later
- npm or yarn
- AWS Account with appropriate IAM permissions
- AWS CLI (optional, for local testing)

## Required AWS IAM Permissions

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "glacier:UploadArchive",
                "glacier:InitiateJob",
                "glacier:ListJobs",
                "glacier:GetJobOutput",
                "glacier:DescribeJob",
                "glacier:ListVaults",
                "glacier:DescribeVault"
            ],
            "Resource": "arn:aws:glacier:*:*:vaults/*"
        }
    ]
}
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/amirzezo201/amazon-s3-glacier-uploader-GUI.git
cd amazon-s3-glacier-uploader-GUI
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your `.env.local`:
```env
AWS_REGION=your-region
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_GLACIER_VAULT_NAME=your-vault-name
```

5. Start the development server:
```bash
npm run dev
# or
yarn dev
```

## Usage

### Uploading Files

1. Navigate to the upload page
2. Select files using the drag-and-drop interface or file browser
3. Click "Upload" to begin the process
4. Monitor upload progress in real-time

### Job Status Checking

Inventory retrieval typically takes 3-5 hours. The application automatically:
- Saves job IDs to localStorage
- Polls job status at regular intervals
- Updates the UI with current status
- Caches results when complete

