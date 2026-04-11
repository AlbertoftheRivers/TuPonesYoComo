import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWebLanguage } from "@/lib/WebLanguageContext";

const Admin = () => {
  const { t } = useWebLanguage();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/80 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/" aria-label={t("backHome")}>
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="font-heading text-xl">{t("adminTitle")}</h1>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-8 space-y-4 text-muted-foreground">
        <p className="text-foreground text-base leading-relaxed">{t("adminLead")}</p>
        <ul className="list-disc pl-5 space-y-2 text-sm">
          <li>{t("adminBullet1")}</li>
          <li>{t("adminBullet2")}</li>
        </ul>
        <Button asChild variant="default" className="mt-6">
          <Link to="/">{t("backHome")}</Link>
        </Button>
      </main>
    </div>
  );
};

export default Admin;
