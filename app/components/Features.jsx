// components/Features.js
export function Features() {
    const features = [
      {
        title: 'Live Classes',
        description: 'Join interactive live sessions with expert educators',
      },
      {
        title: 'On-Demand Content',
        description: 'Access pre-recorded lectures and courses anytime',
      },
      {
        title: 'Community Learning',
        description: 'Engage with peers and educators in discussion forums',
      },
    ];
  
    return (
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center mb-16">
            Transform Your Learning Experience
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 rounded-xl border hover:shadow-lg transition">
                <h3 className="text-xl font-semibold mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }