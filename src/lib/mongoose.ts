import mongoose, { Connection, Schema } from "mongoose";
import { ENV } from "@/env";

declare global {
  var db: mongoose.Connection | null;
}

const MONGODB_URI = ENV.MONGODB_URI;
if (!MONGODB_URI) throw new Error("MONGODB_URI não está definida.");

export const getConnection = () => {
  const mustReconnect =
    !global.db || global.db.readyState === 0 || global.db.readyState === 3;

  if (mustReconnect) {
    console.log("[MongoDB] Conectando ao banco");
    global.db = mongoose.createConnection(MONGODB_URI, {
      dbName: ENV.MONGODB_NAME,
      bufferCommands: false,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 30000,
      connectTimeoutMS: 30000,
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
const withTimeout = async <T>(promise: Promise<T>, ms: number, message: string) => {
  let timer: NodeJS.Timeout | null = null;
  try {
    return await new Promise<T>((resolve, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
      promise.then(resolve, reject);
    });
  } finally {
    if (timer) clearTimeout(timer);
  }
};

const waitForConnection = async (
  conn: mongoose.Connection,
  name: string,
  timeout = 30000,
) => {
  if (Number(conn.readyState) === 1) {
    console.log(`[MongoDB] ${name} já está conectado.`);
    return;
  }

  const state = Number(conn.readyState);
  const stateLabel =
    state === 0 ? "disconnected" : state === 1 ? "connected" : state === 2 ? "connecting" : "disconnecting";

  try {
    await withTimeout(
      conn.asPromise().then(() => undefined),
      timeout,
      `[MongoDB] Timeout ao conectar com ${name} (${timeout}ms, estado=${stateLabel})`,
    );
    console.log(`[MongoDB] Conexão ${name} aberta.`);
  } catch (err) {
    console.error(`[MongoDB] Erro ao conectar com ${name} (estado=${stateLabel}):`, err);
    throw err;
  }
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
