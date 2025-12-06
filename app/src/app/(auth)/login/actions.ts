"use server";

import { signIn } from "@/lib/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";

export interface LoginState {
    error?: string;
    success?: boolean;
}

export async function loginWithCredentials(
    prevState: LoginState,
    formData: FormData
): Promise<LoginState> {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Please enter your email and password" };
    }

    try {
        await signIn("credentials", {
            email,
            password,
            redirect: false,
        });

        return { success: true };
    } catch (error) {
        if (error instanceof AuthError) {
            switch (error.type) {
                case "CredentialsSignin":
                    return { error: "Invalid email or password" };
                default:
                    return { error: "Something went wrong. Please try again." };
            }
        }
        throw error;
    }
}

export async function loginWithGitHub() {
    await signIn("github", { redirectTo: "/observatory" });
}

export async function loginWithGoogle() {
    await signIn("google", { redirectTo: "/observatory" });
}
