import nursesLogo from "../assets/logos/Nurses.png";
import caretakerLogo from "../assets/logos/Caretaker.png";
import compounderLogo from "../assets/logos/compounder.png";

export default function ImageSection() {
  const services = [
    {
      icon: nursesLogo,
      title: "Nurses",
      description: "Registered nurses providing skilled medical care, medication management, and patient monitoring.",
      features: [
        "Medication administration",
        "Wound care",
        "Vital signs monitoring",
        "Post-operative care"
      ]
    },
    {
      icon: caretakerLogo,
      title: "Caretakers",
      description: "Compassionate caregivers offering daily living assistance and companionship for patients.",
      features: [
        "Personal care assistance",
        "Mobility support",
        "Meal preparation",
        "Companionship"
      ]
    },
    {
      icon: compounderLogo,
      title: "Compounders",
      description: "Trained assistants providing medication support and basic healthcare assistance.",
      features: [
        "Medication preparation",
        "First aid",
        "Patient assistance",
        "Healthcare support"
      ]
    }
  ];

  return (
    <section className="w-full bg-white py-8 sm:py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 text-center mb-8 sm:mb-10 md:mb-12 px-2">
          Our Health Services
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 md:gap-8">
          {services.map((service, index) => (
            <div
              key={index}
              className="bg-teal-500 rounded-lg p-5 sm:p-6 md:p-8 flex flex-col"
            >
              {/* Icon */}
              <div className="flex justify-center mb-3 sm:mb-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                  <img 
                    src={service.icon} 
                    alt={service.title}
                    className="w-full h-full object-contain p-2"
                  />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-xl sm:text-2xl md:text-3xl font-bold text-white text-center mb-2 sm:mb-3">
                {service.title}
              </h3>

              {/* Description */}
              <p className="text-xs sm:text-sm md:text-base text-teal-100 text-center mb-4 sm:mb-6 leading-relaxed px-1">
                {service.description}
              </p>

              {/* Features List */}
              <ul className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6 flex-grow">
                {service.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="text-white text-xs sm:text-sm md:text-base flex items-start">
                    <span className="mr-2 flex-shrink-0">•</span>
                    <span className="break-words">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* Learn More Button */}
              <button className="w-full bg-gray-300 hover:bg-gray-400 text-white font-semibold py-2 sm:py-2.5 md:py-3 rounded-lg transition-colors mt-auto text-sm sm:text-base">
                Learn more
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

