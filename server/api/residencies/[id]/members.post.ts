// server/api/residencies/[id]/members.post.ts
import { defineEventHandler, readBody } from "h3";
import { ensureConnection } from "~/server/utils/mongoose";
import { MemberSchema } from "~/server/models/member.schema";

export default defineEventHandler(async (event) => {
  const residencyId = event.context.params.id;
  const { memberId } = await readBody(event);

  if (!residencyId || !memberId) {
    throw createError({
      statusCode: 400,
      message: "Missing required fields",
    });
  }

  const mongooseInstance = await ensureConnection();
  const Member =
    mongooseInstance.models.Member ||
    mongooseInstance.model("Member", MemberSchema);

  try {
    // Check if member exists
    const member = await Member.findById(memberId);
    if (!member) {
      throw createError({ statusCode: 404, message: "Member not found" });
    }

    // Check if already associated
    const existingRole = member.roles?.find(
      (r) => r.role === "resident" && r.datoRecordId === residencyId
    );

    if (existingRole) {
      throw createError({
        statusCode: 409,
        message: "Member already associated with this residency",
      });
    }

    // Add association
    await Member.findByIdAndUpdate(memberId, {
      $addToSet: {
        roles: {
          role: "resident",
          datoRecordId: residencyId,
        },
      },
    });

    return { success: true, memberId };
  } catch (error) {
    console.error("Association error:", error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || "Failed to associate member",
    });
  }
});
