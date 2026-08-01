import { Experience } from "@/components/Experience";
import { getRecentFeed, getWaitlistStats } from "@/lib/waitlist";

export const dynamic = "force-dynamic";

const BASE_COUNT = Number(process.env.WAITLIST_BASE_COUNT ?? 0);

export default async function Home() {
  // The waitlist is nice-to-have context, never a reason the page fails to
  // render. Both reads degrade to a usable default.
  const [stats, feed] = await Promise.all([
    getWaitlistStats().catch((err) => {
      console.error("[page] waitlist stats unavailable:", err.message);
      return { count: 0, displayCount: BASE_COUNT };
    }),
    getRecentFeed(3).catch((err) => {
      console.error("[page] waitlist feed unavailable:", err.message);
      return [];
    }),
  ]);

  return (
    <main>
      <Experience
        initialFeed={feed}
        countLabel={stats.displayCount.toLocaleString("en-US")}
      />
    </main>
  );
}
