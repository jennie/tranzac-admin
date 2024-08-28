import { buildClient } from "@datocms/cma-client-node";

export default defineEventHandler(async (event) => {
  const itemId = event.context.params.id;
  const body = await readBody(event);

  console.log("Received update request for item:", itemId);
  console.log("Received body:", body);

  function toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
  }

  async function updateRental() {
    try {
      const client = buildClient({
        apiToken: useRuntimeConfig().public.datoCmsToken,
      });

      // Fetch the current record
      const currentRecord = await client.items.find(itemId);
      console.log("Current record:", currentRecord);

      // Prepare the update data
      const updateData = {};
      let hasChanges = false;

      for (const [key, value] of Object.entries(body)) {
        const snakeCaseKey = toSnakeCase(key);
        console.log(
          `Comparing ${snakeCaseKey}: current = "${currentRecord[snakeCaseKey]}", new = "${value}"`
        );
        if (
          currentRecord[snakeCaseKey] !== undefined &&
          currentRecord[snakeCaseKey] !== value
        ) {
          updateData[snakeCaseKey] = value;
          hasChanges = true;
          console.log(`Change detected in ${snakeCaseKey}`);
        }
      }

      console.log("Changes detected:", hasChanges);
      console.log("Update data:", updateData);

      // Check if there are any changes to update
      if (!hasChanges) {
        console.log("No changes detected. Returning current record.");
        return {
          statusCode: 200,
          body: currentRecord,
          message: "No changes detected. Record not updated.",
        };
      }

      // Add internal notes
      updateData.internal_notes = `${
        currentRecord.internal_notes || ""
      }\n- Record updated on ${new Date().toLocaleString()}`;

      console.log("Final update data:", updateData);

      // Update the record with the new data
      const updatedRecord = await client.items.update(itemId, updateData);

      console.log("Updated record:", updatedRecord);

      return {
        statusCode: 200,
        body: updatedRecord,
        message: "Record updated successfully.",
      };
    } catch (error) {
      console.error("Error updating rental:", error);
      throw createError({
        statusCode: 500,
        statusMessage: "An error occurred while updating the record",
      });
    }
  }

  return updateRental();
});
