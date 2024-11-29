import { defineEventHandler, getQuery } from "h3";
import { ensureConnection } from "~/server/utils/mongoose";

export default defineEventHandler(async (event) => {
  const { q } = getQuery(event);
  if (!q || typeof q !== "string") {
    return [];
  }

  const mongooseInstance = await ensureConnection();
  const Member =
    mongooseInstance.models.Member ||
    mongooseInstance.model("Member", MemberSchema);

  try {
    // Use aggregation to search across concatenated name
    const members = await Member.aggregate([
      {
        $addFields: {
          fullName: { $concat: ["$firstName", " ", "$lastName"] },
        },
      },
      {
        $match: {
          $or: [
            { fullName: { $regex: q, $options: "i" } },
            { firstName: { $regex: q, $options: "i" } },
            { lastName: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
          ],
        },
      },
      { $limit: 10 },
    ]);

    return members.map((m) => ({
      value: m._id,
      label: `${m.firstName} ${m.lastName}`,
      email: m.email,
    }));
  } catch (error) {
    console.error("Member search error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to search members",
    });
  }
});
