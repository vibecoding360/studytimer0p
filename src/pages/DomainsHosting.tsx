import { useState } from "react";
import { motion } from "framer-motion";
import { Globe, Server, Shield, Zap, Search, Check, ArrowRight, Star, Clock, Headphones } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const domainExtensions = [
  { ext: ".com", price: 12.99, popular: true },
  { ext: ".net", price: 10.99, popular: false },
  { ext: ".org", price: 11.99, popular: false },
  { ext: ".io", price: 39.99, popular: true },
  { ext: ".dev", price: 14.99, popular: false },
  { ext: ".co", price: 9.99, popular: false },
];

const hostingPlans = [
  {
    name: "Starter",
    price: 4.99,
    period: "mo",
    description: "Perfect for personal sites & blogs",
    features: [
      "1 Website",
      "10 GB SSD Storage",
      "Free SSL Certificate",
      "100 GB Bandwidth",
      "Weekly Backups",
      "Email Support",
    ],
    popular: false,
    color: "secondary",
  },
  {
    name: "Professional",
    price: 9.99,
    period: "mo",
    description: "For growing businesses & portfolios",
    features: [
      "Unlimited Websites",
      "50 GB NVMe Storage",
      "Free SSL + CDN",
      "Unlimited Bandwidth",
      "Daily Backups",
      "Priority Support",
      "Staging Environment",
      "Free Domain (1 yr)",
    ],
    popular: true,
    color: "primary",
  },
  {
    name: "Enterprise",
    price: 24.99,
    period: "mo",
    description: "Maximum performance & control",
    features: [
      "Unlimited Websites",
      "200 GB NVMe Storage",
      "Free SSL + CDN + WAF",
      "Unlimited Bandwidth",
      "Real-time Backups",
      "24/7 Phone Support",
      "Staging + Dev Environments",
      "Free Domain (lifetime)",
      "Dedicated IP Address",
      "Advanced Analytics",
    ],
    popular: false,
    color: "secondary",
  },
];

const features = [
  { icon: Zap, title: "99.9% Uptime", description: "Enterprise-grade infrastructure with guaranteed reliability" },
  { icon: Shield, title: "DDoS Protection", description: "Advanced security against attacks included free" },
  { icon: Clock, title: "Instant Setup", description: "Your site goes live in under 60 seconds" },
  { icon: Headphones, title: "Expert Support", description: "Real humans available 24/7 to help you" },
];

export default function DomainsHosting() {
  const [domainQuery, setDomainQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ domain: string; available: boolean; price: number }[] | null>(null);
  const [searching, setSearching] = useState(false);

  const handleDomainSearch = () => {
    if (!domainQuery.trim()) {
      toast.error("Please enter a domain name");
      return;
    }

    setSearching(true);
    // Simulate domain search
    setTimeout(() => {
      const baseName = domainQuery.replace(/\.[a-z]+$/i, "").trim().toLowerCase().replace(/\s+/g, "");
      const results = domainExtensions.map((ext) => ({
        domain: `${baseName}${ext.ext}`,
        available: Math.random() > 0.35,
        price: ext.price,
      }));
      setSearchResults(results);
      setSearching(false);
    }, 1200);
  };

  const handleAddToCart = (item: string, price: number) => {
    toast.info(`Stripe payments coming soon! "${item}" @ $${price} will be available for checkout shortly.`);
  };

  return (
    <div className="space-y-16 pb-12">
      {/* Hero */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-6"
      >
        <Badge variant="secondary" className="px-4 py-1.5 text-xs font-semibold tracking-wide uppercase">
          Domains & Hosting
        </Badge>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
          Your Next Big Idea{" "}
          <span className="text-gradient">Starts Here</span>
        </h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          Register premium domains and deploy on blazing-fast hosting — all in one place. No hidden fees, no surprises.
        </p>
      </motion.section>

      {/* Domain Search */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
        className="max-w-2xl mx-auto"
      >
        <Card className="glass-card glow overflow-hidden">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Find Your Perfect Domain</h2>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Enter your dream domain..."
                value={domainQuery}
                onChange={(e) => setDomainQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleDomainSearch()}
                className="flex-1"
              />
              <Button onClick={handleDomainSearch} disabled={searching} className="gap-2">
                {searching ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </Button>
            </div>

            {searchResults && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2 pt-2"
              >
                {searchResults.map((r) => (
                  <div
                    key={r.domain}
                    className="flex items-center justify-between p-3 rounded-xl bg-secondary/50 border border-border/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2.5 h-2.5 rounded-full ${r.available ? "bg-[hsl(var(--success))]" : "bg-destructive"}`} />
                      <span className="font-semibold text-sm text-foreground">{r.domain}</span>
                      {!r.available && (
                        <span className="text-xs text-muted-foreground">Taken</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-foreground">${r.price}/yr</span>
                      <Button
                        size="sm"
                        variant={r.available ? "default" : "outline"}
                        disabled={!r.available}
                        onClick={() => handleAddToCart(r.domain, r.price)}
                      >
                        {r.available ? "Add to Cart" : "Unavailable"}
                      </Button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.section>

      {/* Hosting Plans */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="space-y-8"
      >
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-extrabold text-foreground">
            Web Hosting Plans
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Lightning-fast NVMe storage, free SSL, and one-click deployments.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {hostingPlans.map((plan, i) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.1, duration: 0.4 }}
            >
              <Card
                className={`relative h-full flex flex-col transition-all duration-300 hover:shadow-xl ${
                  plan.popular
                    ? "border-primary/50 glow scale-[1.02]"
                    : "glass-card-hover"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground px-4 py-1 text-xs font-bold gap-1">
                      <Star className="w-3 h-3" /> Most Popular
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-2">
                    <Server className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  <div className="text-center mb-6">
                    <span className="text-4xl font-extrabold text-foreground">${plan.price}</span>
                    <span className="text-muted-foreground text-sm">/{plan.period}</span>
                  </div>
                  <ul className="space-y-3 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                        <Check className="w-4 h-4 text-[hsl(var(--success))] shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    className="w-full gap-2"
                    variant={plan.popular ? "default" : "outline"}
                    onClick={() => handleAddToCart(`${plan.name} Hosting`, plan.price)}
                  >
                    Get Started <ArrowRight className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Features Grid */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
        className="space-y-8"
      >
        <h2 className="text-2xl font-extrabold text-foreground text-center">
          Why Choose Us
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.08 }}
            >
              <Card className="glass-card-hover h-full text-center p-6">
                <div className="mx-auto w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-foreground mb-1">{title}</h3>
                <p className="text-xs text-muted-foreground">{description}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* CTA */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-center glass-card glow p-8 md:p-12 rounded-2xl space-y-4"
      >
        <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">
          Ready to Launch?
        </h2>
        <p className="text-muted-foreground max-w-md mx-auto">
          Get your domain + hosting bundle and save up to 30%. Start building today.
        </p>
        <Button size="lg" className="gap-2 mt-2" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <Globe className="w-5 h-5" /> Search Domains Now
        </Button>
      </motion.section>
    </div>
  );
}
