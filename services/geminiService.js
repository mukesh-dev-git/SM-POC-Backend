const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash"});

async function generateAnalyticsSummary(anomalies, forecast) {
  if (!anomalies || !forecast) {
    return "Not enough data to generate a summary.";
  }

  // Craft a detailed prompt for the AI
  const prompt = `
    You are an expert energy analyst for a smart home. Your task is to provide a concise, insightful summary based on the following smart meter data.

    Data Context:
    - This data is from a single smart meter.
    - Anomaly data points to unusual power spikes.
    - Forecast data predicts future energy consumption.

    Here is the anomaly data from the last 24 hours:
    ${JSON.stringify(anomalies, null, 2)}

    Here is the power forecast for the next 6 hours:
    - Forecast starts at: ${new Date(forecast.startTime).toLocaleString()}
    - Predicted Power (Watts): ${forecast.forecast.power_watts.map(p => p.toFixed(0)).join(', ')}

    Please provide a summary with the following structure:
    - **Overall Status:** A single sentence summarizing the energy situation.
    - **Key Observations:** 2-3 bullet points highlighting the most important findings from the anomalies and forecast (e.g., number of anomalies, when the highest power usage is predicted).
    - **Recommendation:** One actionable recommendation for the homeowner (e.g., "Consider shifting high-power tasks away from the predicted peak usage time around 8 PM.").
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating summary with Gemini:", error);
    return "Error: Could not generate AI summary at this time.";
  }
}

module.exports = { generateAnalyticsSummary };