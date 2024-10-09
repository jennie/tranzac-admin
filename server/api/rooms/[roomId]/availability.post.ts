import { defineEventHandler, readBody } from "h3";
import { buildClient } from "@datocms/cma-client-node";

const client = buildClient({ apiToken: process.env.DATO_API_TOKEN });

export default defineEventHandler(async (event) => {
  const { roomId } = event.context.params;
  const { startDate, endDate } = await readBody(event);

  if (!roomId || !startDate || !endDate) {
    return { statusCode: 400, body: { error: "Missing required parameters" } };
  }

  const startTime = new Date(startDate);
  const endTime = new Date(endDate);

  try {
    const rentals = await client.items.list({
      filter: {
        type: "rental",
        fields: {
          dates: {
            exists: {
              date: {
                gte: startTime.toISOString().split("T")[0],
                lte: endTime.toISOString().split("T")[0],
              },
            },
          },
        },
      },
      nested: true,
    });

    let isAvailable = true;
    let conflictingRental = null;

    for (const rental of rentals) {
      for (const date of rental.dates) {
        for (const slot of date.slots) {
          const slotStart = new Date(`${date.date}T${slot.startTime.time}`);
          const slotEnd = new Date(`${date.date}T${slot.endTime.time}`);

          // Adjust for slots that span midnight
          if (slot.spansMidnight) {
            slotEnd.setDate(slotEnd.getDate() + 1);
          }

          if (
            slot.rooms.some((r) => r.id === roomId) &&
            slotStart < endTime &&
            slotEnd > startTime
          ) {
            isAvailable = false;
            conflictingRental = rental;
            break;
          }
        }
        if (!isAvailable) break;
      }
      if (!isAvailable) break;
    }

    return {
      statusCode: 200,
      body: {
        isAvailable,
        conflictingRental: conflictingRental
          ? {
              id: conflictingRental.id,
              organization: conflictingRental.organization,
            }
          : null,
      },
    };
  } catch (error) {
    console.error("Error checking room availability:", error);
    return { statusCode: 500, body: { error: "Internal server error" } };
  }
});
