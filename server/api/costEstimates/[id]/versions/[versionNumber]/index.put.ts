import { getCostEstimateModel } from "pricing-lib";
import { ensureConnection } from "~/server/utils/mongoose";

export default defineEventHandler(async (event) => {
  const mongooseInstance = await ensureConnection();
  const CostEstimate = getCostEstimateModel(mongooseInstance);

  const id = event.context.params.id;
  const versionNumber = parseInt(event.context.params.versionNumber as string);
  const body = await readBody(event);

  //   console.log(`Updating version ${versionNumber} for cost estimate id: ${id}`);

  try {
    const costEstimate = await CostEstimate.findOne({ rentalRequestId: id });

    if (!costEstimate) {
      //       console.log("Cost estimate not found for id:", id);
      throw createError({
        statusCode: 404,
        statusMessage: "Cost estimate not found",
      });
    }

    const versionIndex = costEstimate.versions.findIndex(
      (v) => v.version === versionNumber
    );

    if (versionIndex === -1) {
      console.log(
        `Version ${versionNumber} not found for cost estimate id: ${id}`
      );
      throw createError({
        statusCode: 404,
        statusMessage: "Version not found",
      });
    }

    costEstimate.versions[versionIndex] = {
      ...costEstimate.versions[versionIndex],
      ...body,
      updatedAt: new Date(),
    };

    await costEstimate.save();

    //     console.log("Updated version:", costEstimate.versions[versionIndex]);
    return costEstimate.versions[versionIndex];
  } catch (error) {
    console.error("Error updating cost estimate version:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Error updating cost estimate version",
    });
  }
});
