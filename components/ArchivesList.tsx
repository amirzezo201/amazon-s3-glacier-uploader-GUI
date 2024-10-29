"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, RefreshCw } from "lucide-react";

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

const STORAGE_KEY = "glacier-inventory-job";
const CHECK_INTERVAL = 30000; // 30 seconds

export default function ArchivesList(): JSX.Element {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inventoryJob, setInventoryJob] = useState<InventoryJob | null>(null);
  const [archives, setArchives] = useState<ArchiveItem[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [pendingJob, setPendingJob] = useState<InventoryJob | null>(null);

  // Load existing job and cached results on mount
  useEffect(() => {
    try {
      const savedJob = localStorage.getItem(STORAGE_KEY);
      if (savedJob) {
        const parsedJob = JSON.parse(savedJob);
        const jobAge = Date.now() - new Date(parsedJob.creationDate).getTime();
        if (jobAge < 24 * 60 * 60 * 1000) {
          setInventoryJob(parsedJob);
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }

      const cachedResults = localStorage.getItem("glacier-inventory-results");
      if (cachedResults) {
        const { timestamp, archives: cachedArchives } =
          JSON.parse(cachedResults);
        const cacheAge = Date.now() - new Date(timestamp).getTime();
        if (cacheAge < 60 * 60 * 1000) {
          setArchives(cachedArchives);
          setLastUpdated(timestamp);
        }
      }
    } catch (err) {
      console.error("Error loading from localStorage:", err);
    }
  }, []);

  // Save job to localStorage when it changes
  useEffect(() => {
    if (pendingJob) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(pendingJob));
        setInventoryJob(pendingJob);
        setPendingJob(null);
      } catch (err) {
        console.error("Error saving job to localStorage:", err);
      }
    }
  }, [pendingJob]);

  // Save archives to localStorage when they change
  useEffect(() => {
    if (archives.length > 0) {
      try {
        const timestamp = new Date().toISOString();
        localStorage.setItem(
          "glacier-inventory-results",
          JSON.stringify({
            timestamp,
            archives,
          })
        );
        setLastUpdated(timestamp);
      } catch (err) {
        console.error("Error saving archives to localStorage:", err);
      }
    }
  }, [archives]);

  const checkJobStatus = useCallback(async () => {
    if (!inventoryJob?.jobId) return;

    try {
      const response = await fetch(
        `/api/inventory/status?jobId=${inventoryJob.jobId}`
      );
      const data = await response.json();

      if (data.completed && data.inventory) {
        setArchives(data.inventory.ArchiveList || []);
        setInventoryJob(null);
        try {
          localStorage.removeItem(STORAGE_KEY);
        } catch (err) {
          console.error("Error removing completed job:", err);
        }
        return true;
      } else if (data.status) {
        const updatedJob = {
          ...inventoryJob,
          status: data.status,
        };
        setPendingJob(updatedJob);
      }
      return false;
    } catch (err) {
      console.error("Error checking job status:", err);
      return false;
    }
  }, [inventoryJob?.jobId]);

  // Poll for job status
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    const startChecking = async () => {
      if (inventoryJob?.jobId && !inventoryJob.completed) {
        const isComplete = await checkJobStatus();
        if (!isComplete) {
          interval = setInterval(checkJobStatus, CHECK_INTERVAL);
        }
      }
    };

    startChecking();

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [inventoryJob?.jobId, checkJobStatus]);

  const initiateInventoryRetrieval = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/inventory/initiate", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to initiate inventory retrieval");
      }

      const newJob = {
        jobId: data.jobId,
        status: "In Progress",
        creationDate: new Date().toISOString(),
        completed: false,
      };

      setPendingJob(newJob);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0 Byte";
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)).toString());
    return Math.round(bytes / Math.pow(1024, i)) + " " + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold">Archived Files</h2>
          {lastUpdated && (
            <p className="text-sm text-gray-500">
              Last updated: {formatDate(lastUpdated)}
            </p>
          )}
        </div>
        <Button
          onClick={initiateInventoryRetrieval}
          disabled={loading || !!inventoryJob}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh Inventory
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {inventoryJob && (
        <Alert>
          <AlertTitle>Inventory Retrieval in Progress</AlertTitle>
          <AlertDescription>
            Status: {inventoryJob.status}
            <br />
            Started: {formatDate(inventoryJob.creationDate)}
            <br />
            This process typically takes 3-5 hours to complete. You can close
            this page and come back later - the job will continue processing.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-4">
        {archives.map((archive) => (
          <Card key={archive.ArchiveId}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">
                    {archive.ArchiveDescription || "Unnamed Archive"}
                  </h3>
                  <p className="text-sm text-gray-500">
                    ID: {archive.ArchiveId}
                  </p>
                  <p className="text-sm text-gray-500">
                    Created: {formatDate(archive.CreationDate)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatBytes(archive.Size)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {archives.length === 0 && !inventoryJob && (
          <p className="text-center text-gray-500 py-8">
            No archives found. Click Refresh Inventory to check for updates.
          </p>
        )}
      </div>
    </div>
  );
}
