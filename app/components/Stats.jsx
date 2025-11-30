// components/Stats.jsx
export function Stats() {
    const stats = [
      {
        value: "500+",
        label: "Active Students"
      },
      {
        value: "50+",
        label: "Expert Teachers"
      },
      {
        value: "100+",
        label: "Courses"
      },
      {
        value: "95%",
        label: "Satisfaction Rate"
      }
    ];
  
    return (
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {stat.value}
                </div>
                <div className="text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }
  