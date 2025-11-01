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

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 items-center justify-items-center">
          {stats.map((stat, index) => (
            <div
              key={index}
              className={`w-40 h-40 md:w-48 md:h-48 rounded-full ${
                index === 1 ? 'bg-teal-100' : 'bg-white border border-gray-300'
              } shadow-sm flex flex-col items-center justify-center text-center`}
            >
              <p className="text-gray-900 font-extrabold text-xl md:text-2xl mb-2">
                {stat.number}
              </p>
              <p className="text-gray-700 font-semibold text-sm md:text-base">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


