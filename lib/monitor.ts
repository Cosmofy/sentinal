import axios from 'axios';
import { prisma } from './prisma';
import cron from 'node-cron';

interface EndpointJob {
  endpointId: number;
  task: cron.ScheduledTask;
}

class MonitorService {
  private jobs: Map<number, EndpointJob> = new Map();

  async pingEndpoint(endpointId: number) {
    const endpoint = await prisma.endpoint.findUnique({
      where: { id: endpointId, isActive: true },
    });

    if (!endpoint) {
      console.warn(`Endpoint ${endpointId} not found or inactive`);
      return;
    }

    const startTime = Date.now();

    try {
      const response = await axios.get(endpoint.url, {
        timeout: 30000,
        validateStatus: () => true, // Don't throw on any status code
      });

      const responseTimeMs = Date.now() - startTime;
      const success = response.status === endpoint.expectedStatusCode;

      await prisma.ping.create({
        data: {
          endpointId: endpoint.id,
          statusCode: response.status,
          responseTimeMs,
          success,
          errorMessage: success
            ? null
            : `Expected ${endpoint.expectedStatusCode}, got ${response.status}`,
        },
      });

      console.log(
        `[${new Date().toISOString()}] Pinged ${endpoint.title}: ${response.status} in ${responseTimeMs.toFixed(2)}ms`
      );
    } catch (error: any) {
      const responseTimeMs = Date.now() - startTime;

      await prisma.ping.create({
        data: {
          endpointId: endpoint.id,
          statusCode: null,
          responseTimeMs,
          success: false,
          errorMessage: error.message || 'Unknown error',
        },
      });

      console.error(`[${new Date().toISOString()}] Error pinging ${endpoint.title}: ${error.message}`);
    }
  }

  startMonitoring(endpointId: number, intervalSeconds: number) {
    // Stop existing job if any
    this.stopMonitoring(endpointId);

    // Convert seconds to cron expression
    // For intervals less than 60 seconds, use */N format
    // For 60 seconds and above, convert to minutes
    let cronExpression: string;

    if (intervalSeconds < 60) {
      cronExpression = `*/${intervalSeconds} * * * * *`; // Every N seconds
    } else {
      const minutes = Math.floor(intervalSeconds / 60);
      cronExpression = `*/${minutes} * * * *`; // Every N minutes
    }

    const task = cron.schedule(cronExpression, () => {
      this.pingEndpoint(endpointId);
    });

    this.jobs.set(endpointId, { endpointId, task });
    console.log(`Started monitoring endpoint ${endpointId} (interval: ${intervalSeconds}s)`);
  }

  stopMonitoring(endpointId: number) {
    const job = this.jobs.get(endpointId);
    if (job) {
      job.task.stop();
      this.jobs.delete(endpointId);
      console.log(`Stopped monitoring endpoint ${endpointId}`);
    }
  }

  async syncAllEndpoints() {
    // Stop all current jobs
    this.jobs.forEach((job) => job.task.stop());
    this.jobs.clear();

    // Get all active endpoints
    const endpoints = await prisma.endpoint.findMany({
      where: { isActive: true },
    });

    // Start monitoring for each endpoint
    endpoints.forEach((endpoint) => {
      this.startMonitoring(endpoint.id, endpoint.intervalSeconds);
    });

    console.log(`Synced ${endpoints.length} active endpoints`);
  }

  stopAll() {
    this.jobs.forEach((job) => job.task.stop());
    this.jobs.clear();
    console.log('Stopped all monitoring jobs');
  }
}

export const monitorService = new MonitorService();
