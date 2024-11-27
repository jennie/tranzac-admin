// server/api/members/index.post.ts
import { defineEventHandler, readBody } from "h3";
import { ensureConnection } from "~/server/utils/mongoose";

export default defineEventHandler(async (event) => {
  const body = await readBody(event);

  if (!body.firstName || !body.lastName || !body.email) {
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
    const member = await Member.create({
      ...body,
      membership: {
        status: "pending",
        paymentMethod: "none",
      },
    });

    return member.toObject();
  } catch (error) {
    console.error("Member creation error:", error);
    throw createError({
      statusCode: 500,
      message: error.message || "Failed to create member",
    });
  }
});
