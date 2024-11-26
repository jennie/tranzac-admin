// composables/useServerGraphQlQuery.ts
export default async (options: {
  query: string;
  variables?: Record<string, any>;
  includeDrafts?: boolean;
  token: string;
}) => {
  const { query, variables = {}, includeDrafts = false, token } = options;

  try {
    const response = await fetch("https://graphql.datocms.com", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...(includeDrafts && { "X-Include-Drafts": "true" }),
      },
      body: JSON.stringify({
        query,
        variables,
      }),
    });

    const { data, errors } = await response.json();

    if (errors) {
      const errorMessage = errors.map((error) => error.message).join(", ");
      throw new Error(errorMessage);
    }

    return data;
  } catch (error) {
    console.error("GraphQL query error:", error.message || error);
    throw error;
  }
};
