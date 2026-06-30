// AI-powered server functions.
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
      const base = data.positionInQueue * data.avgConsultationMinutes;
      return {
        estimatedMinutes: Math.max(0, base + data.emergencyCount * 8),
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

/* ============ AI Chatbot — patient health assistant ============ */

const ChatInput = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().max(2000),
  })).min(1).max(40),
});

export const chatWithAssistant = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ChatInput.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) return { reply: "AI assistant is currently unavailable. Please contact the hospital directly." };
    try {
      const gateway = createLovableAiGatewayProvider(key);
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system: `You are QueueLess Health Assistant, a friendly AI for a hospital app.
- Help patients understand symptoms in plain language and recommend the right department (Cardiology, Neurology, Orthopedics, Pediatrics, General Medicine, etc.).
- Suggest booking an appointment, checking the live queue, or uploading reports inside the app.
- Never diagnose. Always recommend seeing a doctor for anything serious.
- For emergencies (chest pain, difficulty breathing, severe bleeding, stroke signs) instruct the user to call emergency services immediately.
- Keep replies under 120 words, warm, and clear. Use short paragraphs or bullet points.`,
        messages: data.messages.map((m) => ({ role: m.role, content: m.content })),
      });
      return { reply: text };
    } catch (e) {
      console.error("Chat failed", e);
      return { reply: "Sorry, I had trouble responding. Please try again in a moment." };
    }
  });

/* ============ AI Medical Report Summary ============ */

const SummaryInput = z.object({
  title: z.string(),
  fileType: z.string().optional(),
});

export const summarizeReport = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SummaryInput.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      return { summary: "AI summary unavailable. Please review the file with your doctor." };
    }
    try {
      const gateway = createLovableAiGatewayProvider(key);
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system: "You are a medical AI assistant explaining medical report titles to patients in plain language. Always include a disclaimer that this is not medical advice.",
        prompt: `A patient uploaded a medical report titled: "${data.title}" (${data.fileType ?? "unknown type"}).
Without seeing the contents, give them a brief (under 90 words) friendly orientation:
- What this type of report usually contains
- What metrics or sections to look at
- A reminder to discuss results with their doctor.`,
      });
      return { summary: text };
    } catch (e) {
      console.error("Summary failed", e);
      return { summary: "Unable to generate summary right now." };
    }
  });
