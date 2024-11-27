import mongoose from "mongoose";

// server/api/residencies/[id]/members/[memberId]/index.delete.ts
export default defineEventHandler(async (event) => {
  const { id: residencyId, memberId } = event.context.params;

  console.log("Residency ID:", residencyId); // Add this log
  console.log("Member ID:", memberId); // Add this log

  if (!residencyId || !memberId) {
    throw createError({
      statusCode: 400,
      message: "Residency ID and Member ID are required",
    });
  }

  try {
    const mongooseInstance = await ensureConnection();
    const Member = mongooseInstance.models.Member;

    // Log the state of the roles array before the update
    const memberBeforeUpdate = await Member.findById(memberId).lean();
    console.log("Member roles before update:", memberBeforeUpdate.roles);

    const result = await Member.updateOne(
      { _id: new mongoose.Types.ObjectId(memberId) },
      {
        $pull: {
          roles: {
            role: "resident",
            datoRecordId: residencyId,
          },
        },
      }
    );

    console.log("Update result:", result); // Add this log

    if (result.modifiedCount === 0) {
      throw createError({
        statusCode: 404,
        message: "Member not found or residency not associated with member",
      });
    }

    // Verify the roles array after update
    const updatedMember = await Member.findById(memberId).lean();
    console.log("Updated member roles:", updatedMember.roles);

    return {
      success: true,
      message: "Member removed from residency successfully",
    });
  } catch (error) {
    console.error("Error removing member from residency:", error);
    throw createError({
      statusCode: 500,
      message: "Failed to remove member from residency",
    });
  }
});
