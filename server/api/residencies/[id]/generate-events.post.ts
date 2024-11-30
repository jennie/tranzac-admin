import { buildClient } from "@datocms/cma-client-node";
import { addMonths, eachWeekOfInterval, format } from "date-fns";

const client = buildClient({
  apiToken: process.env.DATO_API_TOKEN || "",
});

export default defineEventHandler(async (event) => {
  const residencyId = getRouterParam(event, "id");

  try {
    // 1. Fetch the residency
    const residency = await client.items.find(residencyId);

    if (!residency) {
      throw createError({
        statusCode: 404,
        message: "Residency not found",
      });
    }

    const startDate = new Date(residency.startDate);
    const endDate = new Date(residency.endDate);

    // 2. Generate weekly event dates
    const weeklyDates = eachWeekOfInterval({
      start: startDate,
      end: endDate,
    });

    // 3. Create events for each date
    const events = await Promise.all(
      weeklyDates.map(async (date) => {
        const eventStartTime = new Date(date);
        eventStartTime.setHours(20, 0, 0); // Set to 8:00 PM

        const eventEndTime = new Date(date);
        eventEndTime.setHours(23, 0, 0); // Set to 11:00 PM

        return client.items.create({
          item_type: {
            id: "event", // Replace with your actual event item type ID
            type: "item_type",
          },
          title: `${residency.title} - ${format(date, "MMMM d, yyyy")}`,
          startTime: eventStartTime.toISOString(),
          endTime: eventEndTime.toISOString(),
          residency: residencyId,
          status: "draft",
        });
      })
    );

    return {
      success: true,
      eventsCreated: events.length,
    };
  } catch (e) {
    console.error("Error generating events:", e);
    throw createError({
      statusCode: 500,
      message: "Failed to generate events",
    });
  }
});
