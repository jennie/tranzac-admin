import { buildClient } from "@datocms/cma-client-node";

export default defineEventHandler(async (event) => {
  const residencyId = event.context.params?.id;

  if (!residencyId) {
    throw createError({
      statusCode: 400,
      message: "Residency ID is required",
    });
  }

  try {
    const client = buildClient({
      apiToken: process.env.DATO_API_TOKEN || "",
    });

    // First get the residency to access its referencing events
    const residency = await client.items.find(residencyId);

    if (!residency._allReferencingEvents?.length) {
      return { events: [] };
    }

    // Get all the referenced events
    const events = await client.items.list({
      filter: {
        type: "event",
        id: {
          in: residency._allReferencingEvents,
        },
      },
      order_by: "start_date_ASC",
    });

    return { events };
  } catch (e) {
    console.error("Error fetching events:", e);
    throw createError({
      statusCode: 500,
      message: e.message || "Failed to fetch events",
      data: { error: e },
    });
  }
});
