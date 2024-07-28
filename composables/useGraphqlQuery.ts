export default (options) => {
  const { query, variables = {}, includeDrafts = true } = options;
  const runtimeConfig = useRuntimeConfig();
  const key = JSON.stringify(options);
  return useFetch("https://graphql.datocms.com", {
    key,
    method: "POST",
    headers: {
      Authorization: `Bearer ${runtimeConfig.public.datoCmsToken}`,
      ...(includeDrafts && {
        "X-Include-Drafts": "true",
        "X-Base-Editing-Url": "https://tranzac.admin.datocms.com",
      }),
    },
    body: {
      query,
      variables,
    },
    transform: ({ data, errors }) => {
      if (errors) {
        // Assuming errors is an array of error messages or objects
        const errorMessage = errors.map((error) => error.message).join(", ");
        throw new Error(errorMessage);
      }

      return data;
    },
  });
};
