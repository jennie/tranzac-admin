import PricingRules from "@tranzac/pricing-lib";

export default async function handler(req, res) {
  try {
    const pricingRules = new PricingRules();
    await pricingRules.initialize();
    const data = req.body; // The booking data from the front-end
    const costEstimate = await pricingRules.getPrice(data); // Calculate price
    res.status(200).json({ success: true, costEstimate });
  } catch (error) {
    console.error("Error recalculating costs:", error);
    res.status(500).json({ success: false, error: error.message });
  }
}
