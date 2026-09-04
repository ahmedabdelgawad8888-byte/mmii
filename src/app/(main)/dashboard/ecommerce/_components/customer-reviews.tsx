"use client";

import * as React from "react";

import { ArrowLeft, ArrowRight, ArrowUpRight, Star } from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const reviews = [
  {
    author: "Melody Macy",
    stars: 5,
    text: "The linen overshirt arrived faster than expected and the fit was exactly right.",
    date: "2 days ago",
  },
  {
    author: "Owen Wright",
    stars: 5,
    text: "Exceptional fabric quality. Will definitely order the olive variant once it's back in stock.",
    date: "4 days ago",
  },
  {
    author: "Nora Ortiz",
    stars: 4,
    text: "Great cut and very breathable. Sleeve length was slightly longer than standard, but looks great rolled up.",
    date: "1 week ago",
  },
  {
    author: "Marcus Miller",
    stars: 5,
    text: "Fast shipping and packaging felt premium. The texture holds up well after machine washing.",
    date: "2 weeks ago",
  },
];

const customerInitials = ["EM", "OW", "NO", "MM"] as const;
const starPositions = [1, 2, 3, 4, 5] as const;

export function CustomerReviews() {
  const [currentIndex, setCurrentIndex] = React.useState(0);

  const currentReview = reviews[currentIndex];

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? reviews.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === reviews.length - 1 ? 0 : prev + 1));
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="font-normal text-muted-foreground text-sm">Reviews</CardTitle>
        <CardDescription className="text-foreground text-xl tabular-nums leading-none tracking-tight">
          4.6 average rating
        </CardDescription>
        <CardAction>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="View all customer reviews"
            onClick={() => toast.info("Viewing all 12.8K verified customer reviews across global stores")}
          >
            <ArrowUpRight className="size-4" />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <div className="rounded-lg bg-muted p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex gap-0.5 text-foreground">
                {starPositions.map((pos) => (
                  <Star
                    key={pos}
                    className={`size-3.5 ${pos <= currentReview.stars ? "fill-current" : "text-muted-foreground/30"}`}
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">{currentReview.author}</span>
                  <span className="text-muted-foreground text-xs">{currentReview.date}</span>
                </div>
                <p className="mt-2 line-clamp-3 min-h-[4.5em] text-muted-foreground text-sm">{currentReview.text}</p>
              </div>
            </div>

            <div className="flex shrink-0 gap-1">
              <Button aria-label="Previous review" size="icon-xs" variant="outline" onClick={handlePrev}>
                <ArrowLeft />
              </Button>
              <Button aria-label="Next review" size="icon-xs" variant="outline" onClick={handleNext}>
                <ArrowRight />
              </Button>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="flex w-full text-left cursor-pointer items-center justify-between gap-4 rounded-lg border px-4 py-3 transition-colors hover:bg-muted/40"
          onClick={() => toast.info("Total reviews: 12,842 · Positive: 94.2% · CSAT: 4.8 / 5.0")}
        >
          <div className="min-w-0">
            <div className="font-medium text-sm">12.8K reviews</div>
            <div className="line-clamp-2 min-h-[3em] text-muted-foreground text-xs">
              Customers reviewed this month · Click to see breakdown
            </div>
          </div>

          <AvatarGroup>
            {customerInitials.map((initials) => (
              <Avatar key={initials}>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            ))}

            <AvatarGroupCount>+42</AvatarGroupCount>
          </AvatarGroup>
        </button>
      </CardContent>
    </Card>
  );
}
