import { startConnection } from "@/lib/mongoose";
import { ModelService } from "@/struct";
import { NextRequest } from "next/server";
import { User } from "@/models/identity/user/model";
import { ENV_SERVER } from "@/env.server";

const ALLOWED_ROLES = ["admin", "operational", "commercial"] as const;
type AllowedRole = (typeof ALLOWED_ROLES)[number];

export const POST = async (req: NextRequest) => {
  try {
    const apiKey = req.headers.get("authorization");
    if (apiKey !== ENV_SERVER.PLATFORM_API_KEY)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    await startConnection();
    const body = await req.json();

    // 👇 Agora aceitamos role opcional vindo de fora
    const { email, name, avatar, role } = body as {
      email: string;
      name?: string;
      avatar?: string;
      role?: string;
    };

    let user = await User.findOne({ email });

    if (!user) {
      // 👇 Valida o role recebido; se for inválido, cai em "operational"
      const finalRole: AllowedRole = ALLOWED_ROLES.includes(role as any)
        ? (role as AllowedRole)
        : "operational";

      user = await User.create({
        status: "active",
        avatar: avatar || null,
        email,
        name: name || email.split("@")[0],
        role: finalRole, // 👈 agora pode ser admin / operational / commercial
      });
    }

    return Response.json({ status: !!user, user });
  } catch (error: any) {
    console.log("Auth error:", error.message);
    return Response.json({ status: false, error: error.message });
  }
};

export const PATCH = async (req: NextRequest) => {
  try {
    const apiKey = req.headers.get("authorization");

    if (apiKey !== ENV_SERVER.PLATFORM_API_KEY)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    await startConnection();
    const body = await req.json();
    delete body.id;

    const service = new ModelService(User);
    const data = await service.findOne({ email: body.email, status: "active" });

    // 🔹 Se você quiser, aqui poderia atualizar role/status/avatar etc.
    // Exemplo:
    // if (data && body.role && ALLOWED_ROLES.includes(body.role)) {
    //   await service.updateById(data._id, { role: body.role });
    // }

    return Response.json({ ok: true });
  } catch (error) {
    console.log(error);
    return Response.json(error, { status: 500 });
  }
};
