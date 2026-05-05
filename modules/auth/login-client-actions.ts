export interface LoginFailure {
  error: string;
}

export interface LoginSuccess {
  ok: true;
}

export interface SignupSuccess {
  ok: true;
  signedIn: boolean;
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<LoginSuccess | LoginFailure> {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      return { error: body.error ?? "로그인에 실패했습니다." };
    }
    return { ok: true };
  } catch {
    return { error: "네트워크 오류가 발생했습니다." };
  }
}

export async function signUpWithPassword(
  email: string,
  password: string,
  displayName: string,
): Promise<SignupSuccess | LoginFailure> {
  try {
    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ email, password, displayName }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      return { error: body.error ?? "계정 만들기에 실패했습니다." };
    }
    const body = (await response.json().catch(() => ({}))) as {
      signedIn?: boolean;
    };
    return { ok: true, signedIn: Boolean(body.signedIn) };
  } catch {
    return { error: "네트워크 오류가 발생했습니다." };
  }
}
