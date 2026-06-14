import Image from "next/image";
import Link from "next/link";
import { ArrowRight, BarChart3, BookOpenCheck, BrainCircuit, Building2, CheckCircle2, LineChart, Medal, Quote, SearchCheck, ShieldCheck, Sparkles, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const whatEsaraDoes = [
  ["Research Assessment", ShieldCheck],
  ["Publication Analytics", BookOpenCheck],
  ["Citation Analysis", Quote],
  ["Promotion Readiness", Medal],
  ["Research Rankings", Trophy],
  ["Academic Intelligence", BrainCircuit]
];

const features = ["Interactive Analytics", "Automated Journal Discovery", "Research Rankings", "Promotion Engine", "Institutional Reports", "Research Intelligence"];
const steps = ["Create Academic Profile", "Retrieve Publications", "Verify Author Identity", "Compute Research Score", "Track Promotion Readiness"];

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <header className="border-b bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary">
            <Building2 className="h-6 w-6" />
            ESARA
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
            <a href="#what">What ESARA Does</a>
            <a href="#workflow">How It Works</a>
            <a href="#features">Features</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className="rounded-md px-3 py-2 text-sm font-semibold text-primary">Login</Link>
            <Link href="/signup" className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground">Create Account</Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden bg-white">
        <div className="mx-auto grid min-h-[680px] max-w-7xl items-center gap-10 px-4 py-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="z-[1] max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border bg-white px-3 py-1 text-sm font-semibold text-primary"><Sparkles className="h-4 w-4" /> Academic analytics for promotion-ready institutions</p>
            <h1 className="text-4xl font-bold leading-tight tracking-normal text-foreground md:text-6xl">Enhanced Staff Assessment Repository Architecture (ESARA)</h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">An intelligent academic analytics platform for evaluating research productivity, scholarly impact, publication quality, and promotion readiness.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/login"><Button>Login <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link href="/signup"><Button className="bg-white text-primary ring-1 ring-border">Create Account</Button></Link>
              <a href="#what"><Button className="bg-white text-primary ring-1 ring-border">Learn More</Button></a>
            </div>
          </div>
          <div className="relative">
            <Image src="/esara-hero.png" alt="ESARA academic analytics preview" width={1400} height={900} priority className="rounded-lg shadow-soft" />
            <div className="absolute bottom-4 left-4 right-4 grid gap-3 rounded-lg bg-white/92 p-4 shadow-soft backdrop-blur md:grid-cols-3">
              <div><p className="text-xs text-muted-foreground">Institution SRS</p><p className="text-2xl font-bold text-primary">88.3</p></div>
              <div><p className="text-xs text-muted-foreground">Verified Works</p><p className="text-2xl font-bold text-primary">96%</p></div>
              <div><p className="text-xs text-muted-foreground">Promotion Ready</p><p className="text-2xl font-bold text-primary">24</p></div>
            </div>
          </div>
        </div>
      </section>

      <section id="what" className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-3xl font-bold">What ESARA Does</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {whatEsaraDoes.map(([label, Icon]) => (
            <Card key={label as string}>
              <CardContent className="pt-5">
                <Icon className="mb-4 h-6 w-6 text-primary" />
                <h3 className="font-semibold">{label as string}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">Turns academic records into verified, comparable institutional research intelligence.</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section id="workflow" className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-5">
            {steps.map((step, index) => (
              <Card key={step}>
                <CardContent className="pt-5">
                  <span className="text-sm font-bold text-primary">Step {index + 1}</span>
                  <p className="mt-3 text-sm font-semibold">{step}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="features" className="mx-auto max-w-7xl px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="text-3xl font-bold">Platform Features</h2>
            <p className="mt-3 text-muted-foreground">Built for research offices, ICT teams, promotion committees, and academic staff who need trustworthy evidence, not spreadsheet guesswork.</p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {features.map((feature) => <div key={feature} className="flex items-center gap-3 rounded-lg border bg-white p-4"><CheckCircle2 className="h-5 w-5 text-success" /><span className="font-semibold">{feature}</span></div>)}
          </div>
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4">
          <h2 className="text-3xl font-bold">Research Metrics Showcase</h2>
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><LineChart className="h-5 w-5" /> Growth</CardTitle></CardHeader><CardContent><div className="h-32 rounded bg-gradient-to-r from-primary/15 via-teal-100 to-amber-100" /></CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5" /> Rankings</CardTitle></CardHeader><CardContent className="space-y-3">{["Ojugo Arnold", "Dr Akazwe Maureen", "Dr Patrick Ejeh"].map((name, index) => <div key={name} className="flex items-center justify-between rounded border p-3 text-sm"><span>{index + 1}. {name}</span><span className="font-bold text-primary">{(92 - index * 8).toFixed(1)}</span></div>)}</CardContent></Card>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><SearchCheck className="h-5 w-5" /> Discovery</CardTitle></CardHeader><CardContent><p className="text-sm leading-6 text-muted-foreground">OpenAlex author search, publication claiming, metadata verification, and automatic score computation using OpenAlex records only.</p></CardContent></Card>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="flex flex-wrap items-center justify-between gap-4 p-8">
            <div><h2 className="text-2xl font-bold">Start building a complete research profile today.</h2><p className="mt-2 text-primary-foreground/80">Create a profile, discover publications, and enter your dashboard in minutes.</p></div>
            <div className="flex gap-3"><Link href="/signup"><Button className="bg-white text-primary">Get Started</Button></Link><Link href="/login"><Button className="bg-primary text-white ring-1 ring-white/40">Login</Button></Link></div>
          </CardContent>
        </Card>
      </section>

      <footer className="border-t bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground">
          <p>ESARA Academic Intelligence Platform</p>
          <div className="flex gap-5"><a>About</a><a>Privacy</a><a>Support</a><a>Documentation</a></div>
        </div>
      </footer>
    </main>
  );
}
