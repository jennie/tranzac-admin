import { buildClient } from "@datocms/cma-client-node";
export default defineEventHandler(async (event) => {
  const itemId = event.context.params.id;
  console.log("itemId", itemId);
  async function run() {
    const client = buildClient({
      apiToken: useRuntimeConfig().public.datoCmsToken,
    });
    const publishedRecord = await client.items.publish(itemId);
    console.log(publishedRecord);
  }
  run();
});
