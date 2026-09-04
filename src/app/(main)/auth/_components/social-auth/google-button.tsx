"use client";

import { useRouter } from "next/navigation";

import { cn } from "cn";
import { siGoogle } from "simple-icons";
import { toast } from "sonner";

import { SimpleIcon } from "@/components/simple-icon";
import { Button } from "@/components/ui/button";

export function GoogleButton({ className, onClick, ...props }: React.ComponentProps<typeof Button>) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (onClick) {
      onClick(e);
      return;
    }
    toast.success("Signed in with Google. Welcome!");
    router.push("/dashboard/default");
  };

  return (
    <Button variant="secondary" className={cn(className)} onClick={handleClick} {...props}>
      <SimpleIcon icon={siGoogle} className="size-4" />
      Continue with Google
    </Button>
  );
}
