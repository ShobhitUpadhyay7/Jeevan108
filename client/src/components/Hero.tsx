import Navbar from "./Navbar";
import heroImg from "../assets/WhatsApp Image 2025-10-31 at 13.29.08_3221df55.jpg";

export default function Hero() {
  return (
    <>
      <div className="fixed top-16 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="pointer-events-auto">
          <Navbar />
        </div>
      </div>
      <section
        className="w-full h-[100vh] md:h-[90vh] lg:h-[95vh]"
        style={{
          backgroundImage: `url(${heroImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
      />
    </>
  );
}


