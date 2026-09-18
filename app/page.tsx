import { FinalCallToAction, Inventory, ProfitCallout } from "@/components/closing-sections";
import { Clarity, Dashboard, Hero, ProductIntro } from "@/components/landing";
import { Footer, Header } from "@/components/site-chrome";

export default function HomePage() {
  return <><Header /><main className="w-full flex-1 bg-surface pt-20"><Hero /><Clarity /><ProductIntro /><Dashboard /><ProfitCallout /><Inventory /><FinalCallToAction /></main><Footer /></>;
}
