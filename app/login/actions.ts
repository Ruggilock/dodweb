"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";

export type LoginState = { error?: string } | undefined;

export async function login(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const username = formData.get("username")?.toString() ?? "";
  const password = formData.get("password")?.toString() ?? "";

  const validUser = process.env.AUTH_USER ?? "";
  const validPass = process.env.AUTH_PASS ?? "";

  if (!validUser || !validPass || username !== validUser || password !== validPass) {
    return { error: "Usuario o contraseña incorrectos." };
  }

  const session = await getSession();
  session.isLoggedIn = true;
  await session.save();

  redirect("/");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/login");
}
