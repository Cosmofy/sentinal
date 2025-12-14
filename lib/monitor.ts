import axios from 'axios';
import { prisma } from './prisma';
import cron from 'node-cron';
import { status as mcStatus } from 'minecraft-server-util';

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

    if (endpoint.type === 'minecraft') {
      await this.pingMinecraftServer(endpoint);
    } else {
      await this.pingHttpEndpoint(endpoint);
    }
  }

  private async pingHttpEndpoint(endpoint: { id: number; title: string; url: string; expectedStatusCode: number }) {
    const startTime = Date.now();

    try {
      const response = await axios.get(endpoint.url, {
        timeout: 30000,
        validateStatus: () => true,
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

  private async pingMinecraftServer(endpoint: { id: number; title: string; url: string; port: number | null }) {
    const startTime = Date.now();
    const port = endpoint.port || 25565;

    try {
      const response = await mcStatus(endpoint.url, port, { timeout: 10000 });
      const responseTimeMs = Date.now() - startTime;

      await prisma.ping.create({
        data: {
          endpointId: endpoint.id,
          statusCode: null,
          responseTimeMs,
          success: true,
          playersOnline: response.players.online,
          playersMax: response.players.max,
        },
      });

      console.log(
        `[${new Date().toISOString()}] Pinged MC ${endpoint.title}: ${response.players.online}/${response.players.max} players in ${responseTimeMs.toFixed(2)}ms`
      );
    } catch (error: any) {
      const responseTimeMs = Date.now() - startTime;

      await prisma.ping.create({
        data: {
          endpointId: endpoint.id,
          statusCode: null,
          responseTimeMs,
          success: false,
          errorMessage: error.message || 'Server offline',
        },
      });

      console.error(`[${new Date().toISOString()}] Error pinging MC ${endpoint.title}: ${error.message}`);
    }
  }

  startMonitoring(endpointId: number, intervalSeconds: number) {
    this.stopMonitoring(endpointId);

    let cronExpression: string;

    if (intervalSeconds < 60) {
      cronExpression = `*/${intervalSeconds} * * * * *`;
    } else {
      const minutes = Math.floor(intervalSeconds / 60);
      cronExpression = `*/${minutes} * * * *`;
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
    this.jobs.forEach((job) => job.task.stop());
    this.jobs.clear();

    const endpoints = await prisma.endpoint.findMany({
      where: { isActive: true },
    });

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
