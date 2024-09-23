// server/api/costEstimates/recalculate.ts
import PricingRules from "@tranzac/pricing-lib";
import { ensureConnection } from "@/server/utils/mongoose";
import { v4 as uuidv4 } from "uuid";

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

  if (event.req.method === "OPTIONS") {
    event.res.statusCode = 204;
    event.res.end();
    return;
  }

  try {
    await ensureConnection();
    const body = await readBody(event);

    console.log(
      "Rental Dates received in API route:",
      JSON.stringify(body.rentalDates, null, 2)
    );

    if (
      !body.rentalDates ||
      (Array.isArray(body.rentalDates) && body.rentalDates.length === 0) ||
      Object.keys(body.rentalDates).length === 0
    ) {
      return { costEstimates: [], grandTotal: 0, tax: 0, totalWithTax: 0 };
    }

    const normalizedData = {
      rentalDates: normalizeRentalDates(body.rentalDates),
    };

    console.log("Normalized data:", JSON.stringify(normalizedData, null, 2));

    const pricingRules = new PricingRules();

    const { costEstimates, grandTotal, tax, totalWithTax } =
      await pricingRules.getPrice(normalizedData);

    return { costEstimates, grandTotal, tax, totalWithTax };
  } catch (error) {
    console.error("Error in calculateCostEstimates:", error);
    throw createError({
      statusCode: 500,
      statusMessage: `Error calculating cost estimates: ${error.message}`,
    });
  }
});

function normalizeRentalDates(rentalDates) {
  if (Array.isArray(rentalDates)) {
    return rentalDates.map(normalizeBooking);
  } else if (typeof rentalDates === "object") {
    return Object.entries(rentalDates).flatMap(([date, bookings]) =>
      (Array.isArray(bookings) ? bookings : [bookings]).map((booking) =>
        normalizeBooking({ ...booking, date })
      )
    );
  } else {
    throw new Error("Invalid rentalDates structure");
  }
}

function normalizeBooking(booking) {
  return {
    ...booking,
    id: booking.id || uuidv4(),
    date:
      booking.date ||
      (booking.start
        ? new Date(booking.start).toISOString().split("T")[0]
        : null),
    costItems: (booking.costItems || []).map((item) => ({
      id: item.id || item._id || uuidv4(),
      ...item,
      slotId: booking.id || uuidv4(),
    })),
  };
}
