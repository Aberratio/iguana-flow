import { useNavigate } from "react-router-dom";
import PricingPlansModal from "@/components/PricingPlansModal";
import SEO from "@/components/SEO";

const PricingPage = () => {
  const navigate = useNavigate();

  return (
    <>
      <SEO
        title="Cennik"
        description="Wybierz plan dopasowany do Twoich potrzeb treningowych. Darmowy dostęp lub pełna biblioteka figur aerial z premium."
        url="https://iguanaflow.app/pricing"
      />
      <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex items-center justify-center p-6">
        <PricingPlansModal isOpen={true} onClose={() => navigate("/feed")} />
      </div>
    </>
  );
};

export default PricingPage;
