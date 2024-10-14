import PricingRules from "@tranzac/pricing-lib";
import { ensureConnection } from "@/server/utils/mongoose";

export default defineEventHandler(async (event) => {
  setHeader(event, "Access-Control-Allow-Origin", "*");
  setHeader(
    event,
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  setHeader(
    event,
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization"
  );

  if (event.node.req.method === "OPTIONS") {
    event.node.res.statusCode = 204;
    event.node.res.end();
    return;
  }

  try {
    await ensureConnection();
    const body = await readBody(event);
    console.log("-----------------body.rentalDates", body.rentalDates);
    if (!body.rentalDates || typeof body.rentalDates !== "object") {
      return { costEstimates: [], grandTotal: 0, tax: 0, totalWithTax: 0 };
    }

    const pricingRules = new PricingRules();

    const { costEstimates, grandTotal, tax, totalWithTax } =
      await pricingRules.getPrice({ rentalDates: body.rentalDates });

    return { costEstimates, grandTotal, tax, totalWithTax };
  } catch (error) {
    console.error("Error in calculateCostEstimates:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Error calculating cost estimates: ${error.message}`,
    });
  }
});
