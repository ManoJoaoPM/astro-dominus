import { NextRequest } from "next/server";
import { withSession } from "@/struct";
import { startConnection } from "@/lib/mongoose";
import { DataForSEO } from "@/services/commercial/dataforseo";

import {
  ScraperJob,
  ScraperJobInterface,
} from "@/models/commercial/scraper-job/model";

import {
  CommercialLead,
  CommercialLeadInterface,
} from "@/models/commercial/lead/model";

// Sanitizar o retorno para o front
function sanitizeScraperJob(job: ScraperJobInterface) {
  return {
    _id: job._id,
    query: job.query,
    city: job.city,
    state: job.state,
    status: job.status,
    totalLeads: job.totalLeads,
    withEmail: job.withEmail,
    withPhone: job.withPhone,
    withWebsite: job.withWebsite,
    withInstagram: job.withInstagram,
    startedAt: job.startedAt,
    finishedAt: job.finishedAt,
    errorMessage: job.errorMessage,
  } as any;
}

/**
 * POST /api/commercial/scraper-job/[id]/run
 *
 * - Atualiza o job para "running"
 * - Chama o DataForSEO (Google Maps Search)
 * - Cria CommercialLead para cada resultado
 * - Atualiza contadores + status do job
 */
export const POST = withSession(
  async ({ user }, req: NextRequest, context: any) => {
    const jobId = context?.params?.id as string | undefined;

    // Segurança básica por role
    if (!user || !["admin", "operational"].includes(user.role as string)) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    if (!jobId) {
      return Response.json(
        { message: "Parâmetro 'id' não encontrado na rota." },
        { status: 400 }
      );
    }

    if (!user || !["admin", "operational"].includes(user.role as string)) {
      return Response.json({ message: "Forbidden" }, { status: 403 });
    }

    await startConnection();

    // 1. Buscar o job
    const job = (await ScraperJob.findById(jobId)) as ScraperJobInterface | null;

    if (!job) {
      return Response.json({ message: "ScraperJob não encontrado" }, { status: 404 });
    }

    // 2. Atualizar para "running"
    job.status = "running";
    job.startedAt = new Date();
    job.errorMessage = null as any;
    await (job as any).save();

    try {
      // 3. Buscar dados no DataForSEO
      const items = await DataForSEO.fetchMapsData(
        job.city || job.query || "",
        100
      );

      // 5. Mapear resultados → CommercialLead
      let totalLeads = 0;
      let withEmail = 0;
      let withPhone = 0;
      let withWebsite = 0;
      let withInstagram = 0;

      const leadsToInsert: Partial<CommercialLeadInterface>[] = [];

      for (const item of items) {
        // ⚠ Esses campos podem variar conforme a versão da API
        // Veja o payload real de retorno para mapear certinho.
        const name: string =
          item.title ||
          item.name ||
          item.business_name ||
          item.domain ||
          "Imobiliária sem nome";

        const address: string | null =
          item.address ||
          item.full_address ||
          null;

        const phone: string | null =
          item.phone ||
          item.phone_numbers?.[0] ||
          null;

        const email: string | null =
          item.emails?.[0] ||
          item.contact_info?.email ||
          null;

        const website: string | null =
          item.site ||
          item.domain ||
          item.url ||
          null;

        // Tentativa de pegar Instagram a partir de links sociais (ajuste conforme payload real)
        let instagram: string | null = null;
        if (Array.isArray(item.profiles)) {
          const instaProfile = item.profiles.find((p: any) =>
            typeof p === "string" && p.includes("instagram.com")
          );
          if (instaProfile) instagram = instaProfile;
        }
        if (!instagram && Array.isArray(item.social_media)) {
          const instaProfile = item.social_media.find((p: any) =>
            typeof p === "string" && p.includes("instagram.com")
          );
          if (instaProfile) instagram = instaProfile;
        }

        totalLeads += 1;
        if (email) withEmail += 1;
        if (phone) withPhone += 1;
        if (website) withWebsite += 1;
        if (instagram) withInstagram += 1;

        leadsToInsert.push({
          name,
          address,
          phone,
          email,
          website,
          instagram,
          city: job.city || null,
          state: job.state || null,
          source: "scraper",
          qualificationStatus: "pending",
          qualificationNotes: null,
          scraperJobId: job._id?.toString() ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }

      // 6. Inserir leads (evite duplicar se quiser: aqui é simples insertMany)
      if (leadsToInsert.length > 0) {
        await CommercialLead.insertMany(leadsToInsert);
      }

      // 7. Atualizar job como concluído
      job.status = "completed";
      job.totalLeads = totalLeads;
      job.withEmail = withEmail;
      job.withPhone = withPhone;
      job.withWebsite = withWebsite;
      job.withInstagram = withInstagram;
      job.finishedAt = new Date();
      await (job as any).save();

      return Response.json(
        {
          ok: true,
          job: sanitizeScraperJob(job),
          stats: {
            totalLeads,
            withEmail,
            withPhone,
            withWebsite,
            withInstagram,
          },
        },
        { status: 200 }
      );
    } catch (err: any) {
      console.error("Erro na execução do scraper:", err);

      // Atualiza job como falho
      job.status = "failed";
      job.errorMessage = err.message || "Erro desconhecido na execução do scraper";
      job.finishedAt = new Date();
      await (job as any).save();

      return Response.json(
        {
          ok: false,
          job: sanitizeScraperJob(job),
          error: err.message || "Erro ao executar scraper",
        },
        { status: 500 }
      );
    }
  },
  {
    roles: ["admin", "operational"],
  }
);
