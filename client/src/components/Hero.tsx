import Navbar from "./Navbar";
import heroImg from "../assets/hero.avif";

export default function Hero() {
  return (
    <>
      <section className="w-full h-[100vh] md:h-[90vh] lg:h-[88vh] flex items-center justify-center relative">
        <div className="absolute top-4 left-0 right-20 z-50 flex justify-center pointer-events-none">
          <div className="pointer-events-auto w-full">
            <Navbar />
          </div>
        </div>
        <div className="w-full h-full rounded-md overflow-hidden flex items-center justify-center bg-black/5">
          <img src={heroImg} alt="Hero" className="w-full h-full object-cover" />
        </div>
      </section>
    </>
  );
}


