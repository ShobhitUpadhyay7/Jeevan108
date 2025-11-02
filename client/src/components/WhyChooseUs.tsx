export default function WhyChooseUs() {
  const stats = [
    {
      number: "10,000+",
      label: "Patients"
    },
    {
      number: "15+",
      label: "Locations"
    },
    {
      number: "24/7",
      label: "Available"
    },
    {
      number: "Verified",
      label: "Professionals"
    }
  ];

  return (
    <section className="w-full bg-white py-12 sm:py-16 md:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 md:px-8">
        <div className="text-center mb-8 sm:mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight text-gray-900 px-2">
            Why Choose
          </h2>
          <p className="mt-2 text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight px-2">
            <span className="text-teal-500">Jeevan 108?</span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 md:gap-8 lg:gap-12 items-center justify-items-center">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-48 lg:h-48 rounded-full ${
                index === 1 ? 'bg-teal-100' : 'bg-white border border-gray-300'
              } shadow-sm flex flex-col items-center justify-center text-center p-2 sm:p-4`}
            >
              <p className="text-gray-900 font-extrabold text-lg sm:text-xl md:text-2xl mb-1 sm:mb-2 break-words">
                {stat.number}
              </p>
              <p className="text-gray-700 font-semibold text-xs sm:text-sm md:text-base break-words px-1">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


