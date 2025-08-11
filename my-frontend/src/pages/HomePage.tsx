import PromotionCards from "@/components/cards/PromotionCards";
import HeroSection from "@/components/sections/HeroSection";
import QuizListSection from "@/components/sections/QuizListSection";

const HomePage = () => {
  return (
    <div className="container-xxl flex-grow-1 container-p-y">
      <div className="app-academy">
        <HeroSection />
        <QuizListSection />
        <PromotionCards />
      </div>
    </div>
  );
};

export default HomePage;
