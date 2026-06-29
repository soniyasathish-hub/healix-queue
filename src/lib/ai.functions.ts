// AI-powered waiting time prediction.
import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  doctorName: z.string(),
  specialization: z.string(),
  queueLength: z.number().int().min(0),
  avgConsultationMinutes: z.number().int().min(1),
  emergencyCount: z.number().int().min(0).default(0),
  positionInQueue: z.number().int().min(0),
  timeOfDay: z.string().optional(),
});

const OutputSchema = z.object({
  estimatedMinutes: z.number().int().min(0),
  confidence: z.number().int().min(50).max(99),
  reasoning: z.string(),
});

export const predictWaitTime = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      // Heuristic fallback if AI key missing
      const base = data.positionInQueue * data.avgConsultationMinutes;
      const emergencyBuffer = data.emergencyCount * 8;
      return {
        estimatedMinutes: Math.max(0, base + emergencyBuffer),
        confidence: 78,
        reasoning: "Statistical estimate based on queue position and average consultation time.",
      };
    }

    try {
      const gateway = createLovableAiGatewayProvider(key);
      const { output } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        output: Output.object({ schema: OutputSchema }),
        prompt: `You are an AI scheduler for a hospital queue system. Predict the patient's waiting time.

Context:
- Doctor: ${data.doctorName} (${data.specialization})
- Average consultation time: ${data.avgConsultationMinutes} minutes
- Queue length: ${data.queueLength}
- Patient's position in queue: ${data.positionInQueue}
- Emergency cases ahead: ${data.emergencyCount}
- Time of day: ${data.timeOfDay ?? "now"}

Estimate realistic waiting time in minutes considering emergencies add ~8 min each, peak hours (9-11am, 5-7pm) add 15% delay, and natural variation. Return a confidence percentage (50-99) and a one-sentence reasoning.`,
      });
      return output;
    } catch (e) {
      console.error("AI prediction failed", e);
      const base = data.positionInQueue * data.avgConsultationMinutes;
      return {
        estimatedMinutes: Math.max(0, base + data.emergencyCount * 8),
        confidence: 75,
        reasoning: "Fallback estimate (AI service unavailable).",
      };
    }
  });
