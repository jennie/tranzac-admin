import { defineEventHandler, createError } from "h3";
import { ensureConnection } from "~/server/utils/mongoose";
import { MemberSchema } from "~/server/models/member.schema";
import mongoose from "mongoose";

export default defineEventHandler(async () => {
  const mongooseInstance = await ensureConnection();

  // Safe model registration
  let Member;
  try {
    Member = mongooseInstance.model("Member");
  } catch (e) {
    Member = mongooseInstance.model("Member", MemberSchema);
  }

  try {
    // Fetch all residencies from DatoCMS
    const residenciesQuery = `
      {
        allResidencies {
          id
          title
        }
      }
    `;
    const { data } = await $fetch("https://graphql.datocms.com", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.DATO_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: residenciesQuery }),
    });

    const residencies = data?.data?.allResidencies || [];

    // Fetch residency IDs with members
    const residencyIdsWithMembers = await Member.distinct(
      "roles.datoRecordId",
      {
        "roles.role": "resident",
      }
    );

    // Identify residencies without members
    const residenciesWithoutMembers = residencies.filter(
      (residency) => !residencyIdsWithMembers.includes(residency.id)
    );

    return {
      success: true,
      residenciesWithoutMembers,
    };
  } catch (error) {
    console.error("Error fetching residencies without members:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch residencies without members",
    });
  }
});
