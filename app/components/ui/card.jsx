// components/ui/card.jsx
import * as React from "react";
import { cn } from "@/lib/utils";

const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-xl border bg-card text-card-foreground shadow transition-all hover:shadow-lg",
      className
    )}
    {...props}
  />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

// Example usage with hover effects and animations
const CardWithHover = React.forwardRef(({ className, ...props }, ref) => (
  <Card
    ref={ref}
    className={cn(
      "group cursor-pointer transition-all duration-300 hover:scale-[1.02]",
      className
    )}
    {...props}
  />
));
CardWithHover.displayName = "CardWithHover";

// Card with gradient border
const CardGradient = React.forwardRef(({ className, ...props }, ref) => (
  <div className="relative rounded-xl p-[1px] bg-gradient-to-r from-primary to-primary/50">
    <Card
      ref={ref}
      className={cn("rounded-[10px] h-full", className)}
      {...props}
    />
  </div>
));
CardGradient.displayName = "CardGradient";

// Interactive card with hover state
const InteractiveCard = React.forwardRef(
  ({ className, interactive = true, ...props }, ref) => (
    <Card
      ref={ref}
      className={cn(
        interactive &&
          "transition-colors hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    />
  )
);
InteractiveCard.displayName = "InteractiveCard";

// Card with image
const CardWithImage = React.forwardRef(
  ({ className, imageUrl, imageAlt = "", children, ...props }, ref) => (
    <Card ref={ref} className={cn("overflow-hidden", className)} {...props}>
      <div className="aspect-video relative">
        <img
          src={imageUrl}
          alt={imageAlt}
          className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      {children}
    </Card>
  )
);
CardWithImage.displayName = "CardWithImage";

// Card with badge
const CardWithBadge = React.forwardRef(
  ({ className, badge, children, ...props }, ref) => (
    <Card ref={ref} className={cn("relative", className)} {...props}>
      {badge && (
        <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground px-2 py-1 rounded-full text-xs font-semibold">
          {badge}
        </div>
      )}
      {children}
    </Card>
  )
);
CardWithBadge.displayName = "CardWithBadge";

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardWithHover,
  CardGradient,
  InteractiveCard,
  CardWithImage,
  CardWithBadge,
};