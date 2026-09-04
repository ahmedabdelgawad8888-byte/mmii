"use client";

import * as React from "react";

import { BellOff, Pause, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const PRESETS = [
  { label: "25m", seconds: 25 * 60 },
  { label: "50m", seconds: 50 * 60 },
  { label: "90m", seconds: 90 * 60 },
];

export function FocusCard() {
  const [selectedPreset, setSelectedPreset] = React.useState(PRESETS[2].seconds);
  const [timeLeft, setTimeLeft] = React.useState(selectedPreset);
  const [isRunning, setIsRunning] = React.useState(false);

  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            toast.success("Focus session completed! Great job!", {
              description: "Take a 5-minute recharge break.",
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRunning, timeLeft]);

  const handleToggle = () => {
    if (!isRunning && timeLeft === 0) {
      setTimeLeft(selectedPreset);
    }
    setIsRunning(!isRunning);
    if (!isRunning) {
      toast.success("Focus session started", {
        description: "Notifications silenced · Deep focus mode engaged",
      });
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(selectedPreset);
    toast.info("Timer reset");
  };

  const handlePresetSelect = (secs: number) => {
    setIsRunning(false);
    setSelectedPreset(secs);
    setTimeLeft(secs);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <Card className="shadow-xs">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Focus</CardTitle>
        <div className="flex items-center gap-1">
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => handlePresetSelect(preset.seconds)}
              className={`cursor-pointer rounded px-1.5 py-0.5 font-medium text-xs transition-colors ${
                selectedPreset === preset.seconds
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-4">
            <div className="font-medium font-mono text-3xl tabular-nums tracking-tight">{formattedTime}</div>
            <div className="flex items-center gap-1.5">
              <Button
                className="min-w-20 cursor-pointer"
                variant={isRunning ? "secondary" : "default"}
                onClick={handleToggle}
              >
                {isRunning ? (
                  <>
                    <Pause className="mr-1 size-4" /> Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-1 size-4" /> Start
                  </>
                )}
              </Button>
              {(isRunning || timeLeft < selectedPreset) && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleReset}
                  title="Reset Timer"
                  className="cursor-pointer"
                >
                  <RotateCcw className="size-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 text-muted-foreground text-xs">
            <BellOff className="size-3" />
            <span>{isRunning ? "Focus active · Stay in the flow" : "No notifications · Full focus"}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
