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

    console.log(
      "Rental Dates received in API route:",
      JSON.stringify(body.rentalDates, null, 2)
    );

    // Ensure body.rentalDates is an object
    if (!body.rentalDates || typeof body.rentalDates !== "object") {
      return { costEstimates: [], grandTotal: 0, tax: 0, totalWithTax: 0 };
    }

    // Pass rentalDates directly without normalization
    const pricingRules = new PricingRules();
    console.log(
      "Checking additionalCosts:",
      JSON.stringify(body.rentalDates, null, 2)
    );

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
