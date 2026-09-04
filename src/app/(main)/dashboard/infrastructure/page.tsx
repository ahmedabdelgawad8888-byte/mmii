import { InfrastructureClient } from "./_components/infrastructure-client";
import { infrastructureGroups } from "./_components/infrastructure-data";

// Import this stylesheet in any page or component that renders country flag classes.
import "@/styles/flag-icons/flags.css";

export default function Page() {
  return <InfrastructureClient initialGroups={infrastructureGroups} />;
}
