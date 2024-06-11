import { buildClient } from "@datocms/cma-client-node";

export default defineEventHandler(async (event) => {
  const client = buildClient({
    apiToken: useRuntimeConfig().public.datoCmsToken,
  });

  const filter = {
    first: 100,
    type: "rental",
    fields: {},
  };

  try {
    const result = await client.items.list({
      filter,
      order_by: "start_date_DESC",
    });

    return result;
  } catch (error) {
    console.error("Error fetching search results:", error);
    throw createError({
      statusCode: 500,
      message: "An error occurred while fetching search results",
    });
  }
});
