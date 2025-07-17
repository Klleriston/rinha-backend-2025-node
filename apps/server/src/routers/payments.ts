import type { FastifyInstance } from "fastify";
import type {
  PaymentSummaryQueryParams,
  PaymentSummaryResponse,
  PaymentRequestBody,
  Processor,
} from "../interfaces/payments";
import axios from "axios";
import {
  selectProcessor,
  executeWithProcessor,
} from "../utils/selectProcessor";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function paymentsRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Querystring?: PaymentSummaryQueryParams;
  }>("/payments-summary", async (req, res) => {
    try {
      const where: any = {};

      const payments = await prisma.payment.findMany({ where });

      const summary: PaymentSummaryResponse = {
        default: {
          totalRequests: payments.filter((p: any) => p.processor === "default")
            .length,
          totalAmount: payments
            .filter((p: any) => p.processor === "default")
            .reduce((acc: number, p: any) => acc + p.amount, 0),
        },
        fallback: {
          totalRequests: payments.filter((p: any) => p.processor === "fallback")
            .length,
          totalAmount: payments
            .filter((p: any) => p.processor === "fallback")
            .reduce((acc: number, p: any) => acc + p.amount, 0),
        },
      };

      return res.send(summary);
    } catch (error) {
      req.log.error(error);
      return res.code(200).send({
        default: { totalRequests: 0, totalAmount: 0 },
        fallback: { totalRequests: 0, totalAmount: 0 },
      });
    }
  });

  fastify.post<{ Body: PaymentRequestBody }>("/payments", async (req, res) => {
    try {
      const { correlationId, amount } = req.body as PaymentRequestBody;

      if (!correlationId || typeof amount !== "number" || isNaN(amount)) {
        return res.code(400).send();
      }

      const processor = selectProcessor();

      if (!processor) {
        return res.code(503).send();
      }

      try {
        await executeWithProcessor(processor, async () => {
          await axios.post(
            processor.url!,
            { correlationId, amount },
            { timeout: 2000 }
          );
        });

        await prisma.payment.create({
          data: {
            correlationId,
            amount,
            processor: processor.name,
          },
        });

        return res.code(200).send();
      } catch (err) {
        return res.code(502).send();
      }
    } catch (error) {
      req.log.error(error);
      return res.code(500).send();
    }
  });
}
