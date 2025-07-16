import type { FastifyInstance } from "fastify";
import type { PaymentSummaryQueryParams, PaymentSummaryResponse, PaymentRequestBody } from "../interfaces/payments";
import { isValidISODate } from "@/utils/isValidISODate";
import axios from "axios";
import { updateProcessorsHealth, selectProcessor } from "../utils/selectProcessor";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function paymentsRoutes(fastify: FastifyInstance) {
  fastify.get<{
    Querystring?: PaymentSummaryQueryParams;
  }>('/payments-summary', async (req, res) => {
    try {
      const { from, to } = req.query as PaymentSummaryQueryParams;

      const where: any = {};
      if (from && isValidISODate(from)) {
        where.createdAt = { ...(where.createdAt || {}), gte: new Date(from) };
      }
      if (to && isValidISODate(to)) {
        where.createdAt = { ...(where.createdAt || {}), lte: new Date(to) };
      }

      const payments = await prisma.payment.findMany({ where });

      if (!payments.length) {
        return res.code(200).send({});
      }

      const summary: PaymentSummaryResponse = {
        default: {
          totalRequests: payments.filter((p: any) => p.processor === "default").length,
          totalAmount: payments.filter((p: any) => p.processor === "default").reduce((acc: number, p: any) => acc + p.amount, 0)
        },
        fallback: {
          totalRequests: payments.filter((p: any) => p.processor === "fallback").length,
          totalAmount: payments.filter((p: any) => p.processor === "fallback").reduce((acc: number, p: any) => acc + p.amount, 0)
        }
      };

      return res.send(summary);
    } catch (error) {
      req.log.error(error);
      return res.code(500).send();
    }
  });

  fastify.post<{ Body: PaymentRequestBody }>('/payments', async (req, res) => {
    try {
      const { correlationId, amount } = req.body as PaymentRequestBody;

      if (!correlationId || typeof amount !== "number" || isNaN(amount)) {
        return res.code(400).send();
      }

      await updateProcessorsHealth();

      const processor = selectProcessor();
      if (!processor) {
        return res.code(503).send();
      }

      processor.activeConnections++;

      try {
        await axios.post(processor.url, { correlationId, amount }, { timeout: 3000 });
        await prisma.payment.create({
          data: {
            correlationId,
            amount,
            processor: processor.name,
          }
        });
        return res.code(200).send();
      } catch (err) {
        return res.code(502).send();
      } finally {
        processor.activeConnections--;
      }
    } catch (error) {
      req.log.error(error);
      return res.code(500).send();
    }
  });
}

