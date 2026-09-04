"use client";

import * as React from "react";

import {
  Banknote,
  ChevronRight,
  Droplet,
  History,
  Lightbulb,
  MoreHorizontal,
  QrCode,
  SendHorizontal,
  Smartphone,
} from "lucide-react";
import { toast } from "sonner";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from "@/components/ui/input-group";

const contacts = [
  { id: 1, name: "Alex Rivera", initials: "AR" },
  { id: 2, name: "Sarah Chen", initials: "SC" },
  { id: 3, name: "Marcus Johnson", initials: "MJ" },
  { id: 4, name: "Elena Diaz", initials: "ED" },
];

const shortcuts = [
  { id: 1, label: "Scan QR", icon: QrCode, action: "Opening camera for QR code scan..." },
  { id: 2, label: "Transfer", icon: SendHorizontal, action: "Direct wire transfer screen loaded" },
  { id: 3, label: "Pay Bills", icon: Banknote, action: "Utility and recurring bills loaded" },
  { id: 4, label: "History", icon: History, action: "Viewing transaction statement history" },
  { id: 5, label: "Mobile", icon: Smartphone, action: "Mobile recharge & data top-up selected" },
  { id: 6, label: "Electricity", icon: Lightbulb, action: "Power & electric grid provider selected" },
  { id: 7, label: "Water", icon: Droplet, action: "Municipal water services selected" },
  { id: 8, label: "More", icon: MoreHorizontal, action: "All connected banking integrations" },
];

export function QuickActions() {
  const [selectedContact, setSelectedContact] = React.useState(contacts[0]);
  const [amount, setAmount] = React.useState("");

  const handleSend = () => {
    const parsed = parseFloat(amount);
    if (!amount || Number.isNaN(parsed) || parsed <= 0) {
      toast.error("Please enter a valid transfer amount");
      return;
    }

    toast.success(`Transfer of $${parsed.toFixed(2)} USD to ${selectedContact.name} sent successfully!`, {
      description: `Transaction reference #TX-${Math.floor(100000 + Math.random() * 900000)}`,
    });
    setAmount("");
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-0.5">
            <CardTitle className="font-normal">Quick Transfer</CardTitle>
            <span className="text-muted-foreground text-xs">
              Recipient: <span className="font-medium text-foreground">{selectedContact.name}</span>
            </span>
          </div>
          <CardAction>
            <div className="flex items-center gap-1">
              <div className="flex -space-x-1.5">
                {contacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    title={contact.name}
                    onClick={() => {
                      setSelectedContact(contact);
                      toast.info(`Selected recipient: ${contact.name}`);
                    }}
                    className={`rounded-full transition-transform hover:scale-110 focus:outline-hidden ${
                      selectedContact.id === contact.id ? "ring-2 ring-primary ring-offset-2" : ""
                    }`}
                  >
                    <Avatar className="size-7 cursor-pointer border-2 border-background">
                      <AvatarFallback className="text-[10px]">{contact.initials}</AvatarFallback>
                    </Avatar>
                  </button>
                ))}
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </div>
          </CardAction>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <Field orientation="horizontal">
              <InputGroup>
                <InputGroupAddon>
                  <InputGroupText>$</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  placeholder="0.00"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <InputGroupAddon align="inline-end">
                  <InputGroupText>USD</InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              <Button type="submit">Send</Button>
            </Field>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-normal">Shortcuts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {shortcuts.map((shortcut) => {
              const Icon = shortcut.icon;
              return (
                <div key={shortcut.id} className="flex flex-col items-center gap-2.5">
                  <Button
                    variant="outline"
                    className="size-12 cursor-pointer rounded-full transition-transform hover:scale-105 active:scale-95"
                    onClick={() => toast.info(shortcut.action)}
                  >
                    <Icon className="size-5" />
                  </Button>
                  <span className="text-center text-muted-foreground text-xs">{shortcut.label}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
