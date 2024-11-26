import useServerGraphQlQuery from "@/composables/useServerGraphQlQuery";

export default defineEventHandler(async () => {
  const runtimeConfig = useRuntimeConfig(); // Fetch runtime config here

  const mongooseInstance = await ensureConnection();

  let Member;
  try {
    Member = mongooseInstance.model("Member");
  } catch (e) {
    Member = mongooseInstance.model("Member", MemberSchema);
  }

  const fetchAllResidencies = async () => {
    const allResidencies = [];
    let skip = 0;
    const limit = 100;

    while (true) {
      const query = `
        query FetchResidencies($skip: IntType!, $limit: IntType!) {
          allResidencies(skip: $skip, first: $limit) {
            id
          }
        }
      `;
      const variables = { skip, limit };

      const result = await useServerGraphQlQuery(
        {
          query,
          variables,
          includeDrafts: true,
        },
        {
          datoCmsToken: runtimeConfig.public.datoCmsToken,
        }
      );

      const residencies = result?.allResidencies || [];
      allResidencies.push(...residencies);

      if (residencies.length < limit) break;
      skip += limit;
    }

    return allResidencies;
  };

  try {
    const residencies = await fetchAllResidencies();
    console.log("Fetched residencies from DatoCMS:", residencies);

    const residencyIdsWithMembers = await Member.distinct(
      "roles.datoRecordId",
      {
        "roles.role": "resident",
        "roles.datoRecordId": { $exists: true, $ne: null },
      }
    );

    console.log("Residency IDs with members:", residencyIdsWithMembers);

    const validResidencyIdsWithMembers = residencyIdsWithMembers.filter(
      (id) => id != null
    );

    console.log(
      "Valid Residency IDs with members:",
      validResidencyIdsWithMembers
    );

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error fetching residencies without members:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch residencies without members",
    });
  }
});
