import { buildClient } from "@datocms/cma-client-node";
export default defineEventHandler(async (event) => {
  const itemId = event.context.params.id;
  async function run() {
    try {
      const client = buildClient({
        apiToken: useRuntimeConfig().public.datoCmsToken,
      });

      // Fetch the current record
      const currentRecord = await client.items.find(itemId);
      console.log(currentRecord);
      // Append the new string to the existing internalNotes
      const newInternalNotes = currentRecord.internal_notes
        ? `${
            currentRecord.internal_notes
          }\n- Record published and renter emailed on ${new Date().toLocaleString()}`
        : `- Record published and renter emailed on ${new Date().toLocaleString()}`;

      // Update the record with the new internalNotes
      const updatedRecord = await client.items.update(itemId, {
        internal_notes: newInternalNotes,
      });

      const publishedRecord = await client.items.publish(itemId);
      if (!publishedRecord) {
        return {
          status: 404,
          body: { error: "Record not found" },
        };
      } else {
        const response = await fetch(
          "https://hook.us1.make.com/uoj3biypeksm9sbstpidnij0dyehoa71",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ publishedRecord }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        } else {
          return {
            status: 200,
          };
        }
      }
    } catch (error) {
      console.error(error);
      return {
        status: 500,
        body: { error: "An error occurred while publishing the record" },
      };
    }
  }

  return run();
});
