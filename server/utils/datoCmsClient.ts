// utils/datoCmsClient.ts
import { buildClient } from "@datocms/cma-client-node";
import type { SimpleSchemaTypes } from "@datocms/cma-client-node";

let client: ReturnType<typeof buildClient>;

export const getDatoClient = () => {
  if (!client) {
    const config = useRuntimeConfig();
    client = buildClient({
      apiToken: config.public.datoCmsToken,
    });
  }
  return client;
};

export const updateDatoRecord = async (
  modelId: string,
  recordId: string,
  data: Partial<SimpleSchemaTypes.Item>
) => {
  const client = getDatoClient();
  try {
    const record = await client.items.update(recordId, {
      ...data,
    });
    return record;
  } catch (error) {
    console.error("Error updating DatoCMS record:", error);
    throw error;
  }
};
