import axios from "axios";
import { Semaphore } from "async-mutex";
import type { ProcessorConfig } from "../interfaces/payments";

const processors: ProcessorConfig[] = [
    {
        name: "default",
        url: process.env.PROCESSOR_DEFAULT_URL!,
        healthUrl: process.env.PROCESSOR_DEFAULT_URL! + "/service-health",
        activeConnections: 0,
        pendingPromises: 0,
        healthy: true,
        semaphore: new Semaphore(10)
    },
    {
        name: "fallback",
        url: process.env.PROCESSOR_FALLBACK_URL!,
        healthUrl: process.env.PROCESSOR_FALLBACK_URL! + "/service-health",
        activeConnections: 0,
        pendingPromises: 0,
        healthy: true,
        semaphore: new Semaphore(10)
    }
];

let rrIndex = 0;
const MAX_DEFAULT_PENDING = 25;

export async function updateProcessorsHealth(): Promise<void> {
    await Promise.all(processors.map(async (proc: ProcessorConfig) => {
        try {
            await axios.get(proc.healthUrl, { timeout: 6000 });
            proc.healthy = true;
        } catch {
            proc.healthy = false;
        }
    }));
}

export function selectProcessor(): ProcessorConfig | null {
    const healthyProcessors = processors.filter(p => p.healthy);
    if (healthyProcessors.length === 0) return null;

    const defaultProcessor = healthyProcessors.find(p => p.name === "default");
    const fallbackProcessor = healthyProcessors.find(p => p.name === "fallback");

    if (defaultProcessor && defaultProcessor.pendingPromises > MAX_DEFAULT_PENDING && fallbackProcessor) {
        return fallbackProcessor;
    }

    const minConnections = Math.min(...healthyProcessors.map(p => p.activeConnections));
    const leastConnected = healthyProcessors.filter(p => p.activeConnections === minConnections);

    if (leastConnected.length === 1) {
        return leastConnected[0];
    } else {
        rrIndex = (rrIndex + 1) % leastConnected.length;
        return leastConnected[rrIndex];
    }
}

export async function executeWithProcessor<T>(
    processor: ProcessorConfig, 
    operation: () => Promise<T>
): Promise<T> {
    const [value, release] = await processor.semaphore.acquire();
    processor.pendingPromises++;
    
    try {
        const result = await operation();
        return result;
    } finally {
        processor.pendingPromises--;
        release();
    }
}

export type { ProcessorConfig };