import { getCostEstimateModel } from "pricing-lib";
import { ensureConnection } from "@/server/utils/mongoose";
export default defineEventHandler(async (event) => {
  const connection = await ensureConnection();
  const CostEstimate = getCostEstimateModel(connection);
  const body = await readBody(event);
  //   console.log(body);

  try {
    const response = await $fetch(
      "https://hook.us1.make.com/8k6vfl8cvhwam8thfn44swq1pwrt3piy",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    //     console.log("Response from Make.com:", response);
    await CostEstimate.updateOne(
      { _id: body.estimateId, "versions.version": body.currentVersion },
      {
        $set: {
          "versions.$.status": "sent",
          status: "sent",
        },
      }
    );
    if (response === "Accepted") {
      return { success: true, message: "Estimate sent successfully" };
    } else {
      console.error("Failed to send estimate:", response);
      return { success: false, message: response };
    }
  } catch (error) {
    console.error("Error sending estimate:", error);
    return { success: false, message: error.message };
  }
});
