import { Link } from "react-router-dom";
import { XCircle } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

const PaymentFail = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Header />
    <main className="flex-1 container max-w-md py-20 text-center space-y-6">
      <XCircle className="h-20 w-20 text-destructive mx-auto" />
      <h1 className="font-display text-3xl font-bold">Оплата не пройшла</h1>
      <p className="text-muted-foreground">Спробуй ще раз або обери іншу карту.</p>
      <Button asChild><Link to="/my-events">До моїх подій</Link></Button>
    </main>
    <Footer />
  </div>
);
export default PaymentFail;
