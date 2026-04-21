import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

const PaymentSuccess = () => {
  const [params] = useSearchParams();
  const order = params.get("order");
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container max-w-md py-20 text-center space-y-6">
        <CheckCircle2 className="h-20 w-20 text-primary mx-auto" />
        <h1 className="font-display text-3xl font-bold">Дякуємо! Оплата прийнята</h1>
        <p className="text-muted-foreground">
          Підтвердження може зайняти кілька секунд. Перевір статус у розділі «Мої події».
        </p>
        {order && <p className="text-xs text-muted-foreground">Замовлення: {order}</p>}
        <div className="flex gap-3 justify-center">
          <Button asChild><Link to="/my-events">Мої події</Link></Button>
          <Button asChild variant="outline"><Link to="/">На головну</Link></Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};
export default PaymentSuccess;
