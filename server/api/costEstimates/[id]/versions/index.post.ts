import { getCostEstimateModel } from "@tranzac/pricing-lib";
import { ensureConnection } from "~/server/utils/mongoose";

export default defineEventHandler(async (event) => {
  const mongooseInstance = await ensureConnection();
  const CostEstimate = await getCostEstimateModel(mongooseInstance);

  const id = event.context.params.id;
  const body = await readBody(event);

  console.log("Request body:", JSON.stringify(body, null, 2));

  if (!body.costEstimates || !Array.isArray(body.costEstimates)) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid cost estimates format",
    });
  }

  try {
    const costEstimate = await CostEstimate.findOne({ rentalRequestId: id });

    if (!costEstimate) {
      throw createError({
        statusCode: 404,
        statusMessage: "Cost estimate not found",
      });
    }

    const newVersion = {
      version: costEstimate.versions.length,
      label: body.label,
      costEstimates: body.costEstimates,
      totalCost: body.totalCost,
      tax: body.tax,
      totalWithTax: body.totalWithTax,
      createdAt: new Date(),
      statusHistory: [
        {
          status: "Created",
          changedBy: "System",
          timestamp: new Date(),
        },
      ],
      depositInvoiceUrl: null,
      balanceInvoiceUrl: null,
      contractPdf: { data: null, contentType: null },
    };

    costEstimate.versions.push(newVersion);
    costEstimate.currentVersion = newVersion.version;
    await costEstimate.save();

    console.log("New version saved:", JSON.stringify(newVersion, null, 2));

    return newVersion;
  } catch (error) {
    console.error("Error creating new cost estimate version:", error);
    throw createError({
      statusCode: 500,
      statusMessage: "Error creating new cost estimate version",
    });
  }
});
