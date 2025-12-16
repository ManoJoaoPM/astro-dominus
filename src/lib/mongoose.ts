import mongoose, { Connection, Schema } from "mongoose";
import { ENV } from "@/env";

declare global {
  var db: mongoose.Connection | null;
}

const MONGODB_URI = ENV.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI não está definida.");

export const getConnection = () => {
  if (!global.db) {
    console.log("[MongoDB] Conectando ao banco");
    global.db = mongoose.createConnection(MONGODB_URI, {
      dbName: ENV.MONGODB_NAME,
      bufferCommands: false,
      maxPoolSize: 5,
    });
  }

  return {
    db: global.db!,
  } as any;
};

export const db = (global.db ?? getConnection().db) as Connection;

export const ObjectId = mongoose.Types.ObjectId;
export { mongoose, Schema };

// UTILS
const waitForConnection = (conn: mongoose.Connection, name: string, timeout = 8000) => {
  return new Promise<void>((resolve, reject) => {
    // Se já estiver conectado, sai cedo
    if (conn.readyState === 1) {
      console.log(`[MongoDB] ${name} já está conectado.`);
      return resolve();
    }

    const timer = setTimeout(() => {
      reject(new Error(`[MongoDB] Timeout ao conectar com ${name} (${timeout}ms)`));
    }, timeout);

    conn.once("connected", () => {
      clearTimeout(timer);
      console.log(`[MongoDB] Conexão ${name} aberta.`);
      resolve();
    });

    conn.once("error", (err) => {
      clearTimeout(timer);
      console.error(`[MongoDB] Erro ao conectar com ${name}:`, err);
      reject(err);
    });
  });
};

export const startConnection = async () => {
  const { db } = getConnection();

  try {
    await Promise.all([
      waitForConnection(db, "db"),
    ]);
    console.log("[MongoDB] Todas as conexões ativas e prontas.");
  } catch (err) {
    console.error("[MongoDB] Falha ao estabelecer conexões:", err);
    throw err;
  }
};
