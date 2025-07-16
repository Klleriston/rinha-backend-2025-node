import axios from "axios";

const processors = [
    {
        name: "default",
        url: "http://payment-processor-default:8080/payments",
        healthUrl: "http://payment-processor-default:8080/payments/service-health",
        activeConnections: 0,
        healthy: true,
    },
    {
        name: "fallback",
        url: "http://payment-processor-fallback:8080/payments",
        healthUrl: "http://payment-processor-fallback:8080/payments/service-health",
        activeConnections: 0,
        healthy: true,
    }
];

let rrIndex = 0;

export async function updateProcessorsHealth() {
    await Promise.all(processors.map(async (proc) => {
        try {
            await axios.get(proc.healthUrl, { timeout: 6000 });
            proc.healthy = true;
        } catch {
            proc.healthy = false;
        }
    }));
}

export function selectProcessor() {
    const healthyProcessors = processors.filter(p => p.healthy);
    if (healthyProcessors.length === 0) return null;

    let minConnections = Math.min(...healthyProcessors.map(p => p.activeConnections));
    const leastConnected = healthyProcessors.filter(p => p.activeConnections === minConnections);

    if (leastConnected.length === 1) {
        return leastConnected[0];
    } else {
        rrIndex = (rrIndex + 1) % leastConnected.length;
        return leastConnected[rrIndex];
    }
}