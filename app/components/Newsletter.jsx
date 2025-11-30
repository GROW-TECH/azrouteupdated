// components/Newsletter.jsx
import { Input } from "./ui/input";
import { Button } from "./ui/button";
export function Newsletter() {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">
              Stay Updated
            </h2>
            <p className="text-muted-foreground mb-8">
              Get notifications about new courses and dental education updates
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Input
                type="email"
                placeholder="Enter your email"
                className="max-w-sm"
              />
              <Button>Subscribe</Button>
            </div>
          </div>
        </div>
      </section>
    );
  }