import { MessageInterface } from "@/models/whatsapp/message";

export class IntelligenceAnalyzer {
  // Simple rule-based analysis for now
  // Can be upgraded to OpenAI/LLM later
  
  static analyze(content: string): MessageInterface["analysis"] {
    const text = content.toLowerCase();
    
    let intent = "general";
    const keywords: string[] = [];

    // Basic Intent Detection
    if (text.includes("preço") || text.includes("quanto custa") || text.includes("valor")) {
      intent = "price_inquiry";
      keywords.push("price");
    }
    else if (text.includes("visita") || text.includes("agendar") || text.includes("conhecer")) {
      intent = "visit_scheduling";
      keywords.push("visit");
    }
    else if (text.includes("comprar") || text.includes("fechar") || text.includes("contrato")) {
      intent = "purchase_intent";
      keywords.push("purchase");
    }

    // Sentiment (very basic)
    let sentiment: "positive" | "negative" | "neutral" = "neutral";
    if (text.includes("obrigado") || text.includes("gostei") || text.includes("ótimo")) {
      sentiment = "positive";
    } else if (text.includes("ruim") || text.includes("demora") || text.includes("não quero")) {
      sentiment = "negative";
    }

    return {
      intent,
      sentiment,
      keywords,
      summary: content.substring(0, 100) + (content.length > 100 ? "..." : ""),
    };
  }
}

export class TriggerService {
  static async processTriggers(message: MessageInterface, conversation: any) {
    // Check intents and perform actions
    const intent = message.analysis?.intent;

    if (intent === "price_inquiry") {
      console.log(`[Trigger] Price inquiry detected for conversation ${conversation._id}`);
      // TODO: Create a lead opportunity or notify sales
    }

    if (intent === "visit_scheduling") {
      console.log(`[Trigger] Visit scheduling detected for conversation ${conversation._id}`);
      // TODO: Schedule task
    }
    
    // Auto-tagging based on intent
    if (intent && intent !== "general") {
        if (!conversation.tags.includes(intent)) {
            conversation.tags.push(intent);
            await conversation.save();
        }
    }
  }
}
