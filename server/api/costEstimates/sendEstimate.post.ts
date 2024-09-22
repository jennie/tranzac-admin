import { getCostEstimateModel } from "@tranzac/pricing-lib";
import { ensureConnection } from "@/server/utils/mongoose";
import sgMail from "@sendgrid/mail";
import fetch from "node-fetch";
import PricingRules from "@tranzac/pricing-lib";
const pricingRules = new PricingRules();
import { format } from "date-fns"; // Using date-fns for formatting
import { formatDescription } from "@/utils/formatters";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const PDFMONKEY_API_URL = "https://api.pdfmonkey.io/api/v1/documents";

export default defineEventHandler(async (event) => {
  const connection = await ensureConnection();
  const CostEstimate = await getCostEstimateModel(connection);
  const body = await readBody(event);
  const roomMapping = body.roomMapping || [];

  let items = [];

  body.costEstimates.forEach((estimate) => {
    const date = new Date(estimate.date || Date.now()).toLocaleDateString(
      "en-US"
    );

    // Per-slot costs
    const perSlotCosts = (estimate.perSlotCosts || []).map((cost) => ({
      date,
      description: cost.description || "N/A",
      total: (Number(cost.cost) || 0).toFixed(2),
    }));

    // Room costs
    const roomCosts = (estimate.rooms || []).flatMap((room) => {
      const roomItems = [];
      const roomName =
        roomMapping.find((r) => r.slug === room.roomSlug)?.name ||
        room.roomSlug;

      if (room.fullDayCostItem) {
        roomItems.push({
          date,
          description: `Full Day: ${roomName}`,
          total: (Number(room.fullDayCostItem.cost) || 0).toFixed(2),
        });
      }
      if (room.daytimeCostItem) {
        roomItems.push({
          date,
          description: formatDescription(
            room.daytimeHours,
            room.daytimePrice,
            room.daytimeRateType,
            "Daytime"
          ),
          total: (Number(room.daytimeCostItem.cost) || 0).toFixed(2),
        });
      }
      if (room.eveningCostItem) {
        roomItems.push({
          date,
          description: formatDescription(
            room.eveningHours,
            room.eveningPrice,
            room.eveningRateType,
            "Evening"
          ),
          total: (Number(room.eveningCostItem.cost) || 0).toFixed(2),
        });
      }

      // Additional room costs
      if (room.additionalCosts && room.additionalCosts.length > 0) {
        room.additionalCosts.forEach((additionalCost) => {
          roomItems.push({
            date,
            description: additionalCost.description || "Additional Cost",
            total: (Number(additionalCost.cost) || 0).toFixed(2),
          });
        });
      }

      return roomItems;
    });

    // Custom line items
    const customLineItems = (estimate.customLineItems || []).map((item) => ({
      date,
      description: item.description || "Custom Line Item",
      total: (Number(item.cost) || 0).toFixed(2),
    }));

    // Combine per-slot costs, room costs, and custom line items
    items = [...items, ...perSlotCosts, ...roomCosts, ...customLineItems];
  });

  try {
    await pricingRules.initialize();

    const costEstimate = await CostEstimate.findOne({ _id: body.estimateId });
    if (!costEstimate) {
      throw new Error("Cost estimate not found");
    }

    const currentVersionData = costEstimate.versions.find(
      (v) => v.version === body.currentVersion
    );

    console.log(
      "Current version data:",
      JSON.stringify(currentVersionData, null, 2)
    );

    if (!currentVersionData) {
      throw new Error("Selected version data not found");
    }

    const slots = currentVersionData.costEstimates.map((estimate) => {
      const rooms = (estimate.estimates || []).map((room) => {
        const roomName =
          roomMapping.find((r) => r.slug === room.roomSlug)?.name ||
          room.roomSlug;

        const costItems = [];
        if (room.fullDayPrice) {
          costItems.push({
            description: `Full Day Flat Rate`,
            total: Number(room.fullDayPrice).toFixed(2),
          });
        }
        if (room.daytimePrice) {
          costItems.push({
            description: formatDescription(
              room.daytimeHours,
              room.daytimeRate,
              room.daytimeRateType,
              "Daytime"
            ),
            total: Number(room.daytimePrice).toFixed(2),
          });
        }
        if (room.eveningPrice) {
          costItems.push({
            description: formatDescription(
              room.eveningHours,
              room.eveningRate,
              room.eveningRateType,
              "Evening"
            ),
            total: Number(room.eveningPrice).toFixed(2),
          });
        }

        const additionalCosts = (room.additionalCosts || []).map((cost) => ({
          description: cost.description || "Additional Cost",
          total: Number(cost.cost).toFixed(2),
        }));

        return {
          roomName,
          costItems,
          additionalCosts,
        };
      });

      return {
        date: format(new Date(estimate.date), "MMMM d, yyyy"),
        startTime: format(new Date(estimate.start), "h:mm a"),
        endTime: format(new Date(estimate.end), "h:mm a"),
        perSlotCosts: (estimate.perSlotCosts || []).map((cost) => ({
          description: cost.description || "N/A",
          total: Number(cost.cost).toFixed(2),
        })),
        rooms,
        customLineItems: (estimate.customLineItems || []).map((item) => ({
          description: item.description || "Custom Line Item",
          total: Number(item.cost).toFixed(2),
        })),
      };
    });

    console.log("Slots with room data:", JSON.stringify(slots, null, 2));

    const subtotal = currentVersionData.costEstimates.reduce(
      (total, estimate) => total + estimate.slotTotal,
      0
    );
    const tax = pricingRules.calculateTax(subtotal);
    const grandTotal = pricingRules.calculateTotalWithTax(subtotal);

    const pdfPayload = {
      estimateId: costEstimate._id.toString(),
      rentalRequestId: costEstimate.rentalRequestId,
      currentVersion: body.currentVersion,
      status: costEstimate.status,
      createdAt: new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      totalCost: subtotal.toFixed(2),
      recipientName: body.recipientName || "N/A",
      organization: body.recipientOrganization || "N/A",
      recipientEmail: body.recipientEmail || "N/A",
      slots, // Make sure this line exists
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
    };
    console.log(
      "PDF Payload slots:",
      JSON.stringify(pdfPayload.slots, null, 2)
    );

    // console.log(
    //   "PDF Payload before sending:",
    //   JSON.stringify(pdfPayload, null, 2)
    // );

    // Generate PDF using PDFMonkey API

    console.log(
      "PDF Payload slots:",
      JSON.stringify(pdfPayload.slots, null, 2)
    );

    const pdfResponse = await fetch(PDFMONKEY_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PDFMONKEY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        document: {
          document_template_id: "CBFF6201-E5C0-4DAF-91B5-A3F3AEA012C4",
          status: "pending", // This will trigger immediate generation
          payload: pdfPayload,
          meta: {
            _filename: `cost_estimate_${pdfPayload.estimateId}_v${pdfPayload.currentVersion}.pdf`,
            estimateId: pdfPayload.estimateId,
            currentVersion: pdfPayload.currentVersion,
          },
        },
      }),
    });

    if (!pdfResponse.ok) {
      throw new Error(`PDFMonkey API error: ${pdfResponse.statusText}`);
    }

    const pdfData = await pdfResponse.json();
    console.log("Full PDF Payload:", JSON.stringify(pdfPayload, null, 2));
    // Poll for document status
    let documentCard;
    while (true) {
      const statusResponse = await fetch(
        `${PDFMONKEY_API_URL}/${pdfData.document.id}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PDFMONKEY_API_KEY}`,
          },
        }
      );
      documentCard = await statusResponse.json();
      if (documentCard.document.status === "success") {
        break;
      } else if (documentCard.document.status === "failure") {
        throw new Error(
          `PDF generation failed: ${documentCard.document.failure_cause}`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait for 1 second before checking again
    }

    // Prepare the email content
    const msg = {
      to: body.recipientEmail,
      from: "jennie@machinemagic.co",
      subject: `Cost Estimate for Rental Request ${pdfPayload.rentalRequestId}`,
      text: `Please find attached your cost estimate for rental request ${pdfPayload.rentalRequestId}.`,
      html: `<strong>Please find attached your cost estimate for rental request ${pdfPayload.rentalRequestId}.</strong>`,
      attachments: [
        {
          content: Buffer.from(
            await (
              await fetch(documentCard.document.download_url)
            ).arrayBuffer()
          ).toString("base64"),
          filename: documentCard.document.filename,
          type: "application/pdf",
          disposition: "attachment",
        },
      ],
    };

    // Send email using SendGrid
    const response = await sgMail.send(msg);

    // Update the database
    const updateResult = await CostEstimate.updateOne(
      { _id: body.estimateId, "versions.version": body.currentVersion }, // Update based on the selected version
      {
        $push: {
          "versions.$.statusHistory": {
            status: "sent",
            timestamp: new Date(),
            changedBy: body.userId,
          },
        },
        $set: { status: "sent" },
      }
    );

    if (response[0].statusCode === 202 && updateResult.modifiedCount > 0) {
      return {
        success: true,
        message: "Estimate sent successfully with PDF attachment",
      };
    } else {
      console.error(
        "Failed to send estimate or update database:",
        response,
        updateResult
      );
      return {
        success: false,
        message: "Failed to send estimate or update database",
      };
    }
  } catch (error) {
    console.error("Error processing estimate:", error);
    if (error.response) {
      console.error("Error Response:", error.response.body);
    }
    return { success: false, message: error.message };
  }
});
