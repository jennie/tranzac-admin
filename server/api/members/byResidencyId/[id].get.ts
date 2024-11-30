// /server/api/members/byResidencyId/[id].get.ts

import { defineEventHandler, createError } from "h3";
import { ensureConnection } from "~/server/utils/mongoose";
import { MemberSchema } from "~/server/models/member.schema";
import mongoose from "mongoose";

export default defineEventHandler(async (event) => {
  const residencyId = event.context.params.id;
  const mongooseInstance = await ensureConnection();

  // Safe model registration
  let Member;
  try {
    Member = mongooseInstance.model("Member");
  } catch (e) {
    Member = mongooseInstance.model("Member", MemberSchema);
  }

  try {
    // Find members with matching residency ID in their roles
    const members = await Member.find({
      roles: {
        $elemMatch: {
          role: "resident",
          datoRecordId: residencyId,
        },
      },
    })
      .select("firstName lastName email")
      .lean();

    // console.log("Found members:", members);

    return {
      success: true,
      members,
      emails: members.map((m) => m.email), // Keep emails array for compatibility
    };
  } catch (error) {
    console.error("Error fetching member emails:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to fetch member emails",
    });
  }
});
