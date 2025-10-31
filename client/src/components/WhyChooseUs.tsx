export default function WhyChooseUs() {
  return (
    <section className="w-full bg-white py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 md:px-6">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900">
            Why Choose
          </h2>
          <p className="mt-2 text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
            <span className="text-teal-500">Jeevan 108?</span>
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10 items-center justify-items-center">
          <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-center">
            <div className="px-4">
              <p className="text-gray-900 font-extrabold text-lg md:text-xl">10,000+</p>
              <p className="text-gray-900 font-extrabold text-lg md:text-xl">Patients</p>
            </div>
          </div>

          <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-teal-200 flex items-center justify-center text-center">
            <div className="px-6">
              <p className="text-gray-900 font-extrabold text-base md:text-lg">Accessible in</p>
              <p className="text-gray-900 font-extrabold text-base md:text-lg">15+ Locations</p>
            </div>
          </div>

          <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-center">
            <div className="px-6">
              <p className="text-gray-900 font-extrabold text-base md:text-lg">Available</p>
              <p className="text-gray-900 font-extrabold text-base md:text-lg">24/7</p>
            </div>
          </div>

          <div className="w-40 h-40 md:w-48 md:h-48 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-center">
            <div className="px-6">
              <p className="text-gray-900 font-extrabold text-base md:text-lg">Verified</p>
              <p className="text-gray-900 font-extrabold text-base md:text-lg">Professionals</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


