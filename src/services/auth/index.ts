import { CustomSession } from "@/services/auth/utils";
import { UserInterface } from "@/models/identity/user";
import { fetcher } from "@discovery-solutions/struct";
import { ENV } from "@/env";

const baseUrl = ENV.AUTH_URL;

export class AuthService {
  static getUserOrCreate(user: CustomSession["user"]) {
    return fetcher(baseUrl + "/api/auth/edge", {
      method: "POST",
      body: user,
      headers: {
        authorization: ENV.PLATFORM_API_KEY,
      },
    });
  }

  static async validateUser(email: string, password: string) {
    const { user } = await AuthService.getUserByEmail(email);
    if (!user || !user?.password) return null;

    const isPasswordValid = await this.verifyPassword(password, user.password);
    if (!isPasswordValid) return null;

    return AuthService.parse(user);
  }

  static parse(user: UserInterface) {
    if (!user) return null;
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      status: user.status,
      role: user.role,
    };
  }

  // Função para gerar hash SHA-512 usando Web Crypto API
  static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-512", data);
    return AuthService.bufferToHex(hashBuffer);
  }

  // Função para verificar se a senha bate com o hash armazenado
  static async verifyPassword(password: string, storedHash: string): Promise<boolean> {
    const hash = await AuthService.hashPassword(password);
    return hash === storedHash;
  }

  // Helper para converter ArrayBuffer para string hex
  private static bufferToHex(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
  }

  static getUserByEmail(email: string) {
    return fetcher(baseUrl + "/api/auth/edge", {
      method: "POST",
      headers: { authorization: ENV.PLATFORM_API_KEY },
      body: { email }
    });
  }
}
