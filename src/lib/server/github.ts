import "server-only";
import { projects } from "../domain/portfolio";
import { z } from "zod";
const profileSchema = z.object({
  public_repos: z.number(),
  created_at: z.string(),
});
const repoSchema = z.array(
  z.object({
    name: z.string(),
    private: z.boolean(),
    language: z.string().nullable(),
  }),
);
async function github(path: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "kaue-portfolio",
  };
  if (process.env.GITHUB_TOKEN)
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const r = await fetch(`https://api.github.com/${path}`, {
    headers,
    next: { revalidate: 3600 },
    signal: AbortSignal.timeout(4000),
  });
  if (!r.ok) throw new Error("GitHub unavailable");
  return r.json() as Promise<unknown>;
}
export async function githubData() {
  try {
    const [profileRaw, reposRaw] = await Promise.all([
      github("users/kaueajure"),
      github("users/kaueajure/repos?per_page=100&sort=updated"),
    ]);
    const profile = profileSchema.parse(profileRaw);
    const repos = repoSchema.parse(reposRaw).filter((r) => !r.private);
    const featured = repos.filter((r) =>
      projects.some((p) => p.slug === r.name),
    );
    const languages = await Promise.all(
      featured.map((r) =>
        github(`repos/kaueajure/${encodeURIComponent(r.name)}/languages`)
          .then((v) => z.record(z.string(), z.number()).parse(v))
          .catch(() => ({}) as Record<string, number>),
      ),
    );
    const combined: Record<string, number> = {};
    for (const lang of languages)
      for (const [key, value] of Object.entries(lang))
        combined[key] = (combined[key] ?? 0) + value;
    const entries = Object.entries(combined).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((n, [, v]) => n + v, 0);
    return {
      online: true,
      count: profile.public_repos,
      since: profile.created_at,
      primary: entries[0]?.[0] ?? "TypeScript",
      languages: entries
        .slice(0, 5)
        .map(([name, n]) => ({ name, percent: (n / total) * 100 })),
      publicNames: featured.map((r) => r.name),
    };
  } catch {
    return {
      online: false,
      count: null,
      since: null,
      primary: "TypeScript",
      languages: [],
      publicNames: [] as string[],
    };
  }
}
