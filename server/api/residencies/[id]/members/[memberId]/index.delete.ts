import mongoose from "mongoose";

// server/api/residencies/[id]/members/[memberId]/index.delete.ts
export default defineEventHandler(async (event) => {
  const { id: residencyId, memberId } = event.context.params;

  if (!residencyId || !memberId) {
    throw createError({
      statusCode: 400,
      message: "Residency ID and Member ID are required",
    });
  }

  try {
    const mongooseInstance = await ensureConnection();
    const Member = mongooseInstance.models.Member;

    const result = await Member.updateOne(
      { _id: mongoose.Types.ObjectId.createFromTime(memberId) },
      {
        $pull: {
          roles: {
            role: "resident",
            datoRecordId: residencyId,
          },
        },
      }
    );

    return {
      success: true,
      message: "Member removed from residency successfully",
    };
  } catch (error) {
    console.error("Error removing member from residency:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to remove member from residency",
    });
  }
});
