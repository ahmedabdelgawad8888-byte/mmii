import packageJson from "../../package.json";

const currentYear = new Date().getFullYear();

export const APP_CONFIG = {
  name: "Trygc CRM Hub",
  version: packageJson.version,
  copyright: `© ${currentYear}, Trygc CRM Hub.`,
  meta: {
    title: "Trygc CRM Hub",
    description:
      "Trygc CRM Hub is the central workspace for managing customers, conversations, and pipeline — dashboards, analytics, and day-to-day operations in one place.",
  },
};
