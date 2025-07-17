import "dotenv/config";
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import { paymentsRoutes } from "./routers/payments";

const baseCorsConfig = {
  origin: "*",
  methods: ["GET", "POST"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With"
  ],
  credentials: true,
};

const fastify = Fastify();

fastify.register(fastifyCors, baseCorsConfig);
fastify.register(paymentsRoutes);

fastify.get('/ping', async () => {
  return 'pong'
})

fastify.listen({ port: 9999 }, (err) => {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }
  console.log("on")
});
