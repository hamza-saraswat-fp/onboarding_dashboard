// Maps the PRD's Salesforce field labels (section 3.6) to the salesforceData
// JSON keys captured at link creation, grouped by section.
//
// The keys below were confirmed against the real onboarding Supabase (project
// rqelncbqgepyardwtltc) on 2026-07-07 via a read-only, keys-only query. Two PRD
// fields have no matching key yet and will render "Not provided": QuickBooks
// Desktop Enabled and Add-On and Revenue Partner Products Enabled. If the
// upstream Salesforce mapping changes, edit this map (confirm new keys with
// Hamza against the database).

export interface SalesforceField {
  label: string;
  keys: string[]; // source salesforceData keys, in order; multiple keys are combined
  separator?: string; // how to join multiple present values (default a space)
}

export interface SalesforceGroup {
  title: string;
  fields: SalesforceField[];
}

export const SALESFORCE_GROUPS: SalesforceGroup[] = [
  {
    title: "Account Information",
    fields: [
      { label: "Account Name", keys: ["companyName"] },
      { label: "Company ID", keys: ["companyId"] },
      { label: "Primary Contact", keys: ["primaryContactFirstName", "primaryContactLastName"] },
      { label: "Primary Contact Email", keys: ["primaryContactEmail"] },
      { label: "Phone", keys: ["phone"] },
    ],
  },
  {
    title: "Contractual Details",
    fields: [
      { label: "User Count", keys: ["userCount"] },
      { label: "Full Users (Admin/Manager/Tech)", keys: ["fullUsers"] },
      { label: "Data Migration", keys: ["dataMigration"] },
      { label: "Contracted Seats", keys: ["contractedSeats"] },
      { label: "Support Type", keys: ["supportType"] },
      { label: "Limited Agents", keys: ["limitedAgents"] },
      { label: "Engage Contracted Seats", keys: ["engageContractedSeats"] },
    ],
  },
  {
    title: "Firmographic Data",
    fields: [
      { label: "Number of Employees", keys: ["numberOfEmployees"] },
      { label: "Primary Language", keys: ["primaryLanguage"] },
      { label: "Industry", keys: ["industry"] },
      { label: "Industry (Other)", keys: ["industryOther"] },
      { label: "Website", keys: ["website"] },
      { label: "Sales Segment", keys: ["salesSegment"] },
    ],
  },
  {
    title: "Pipeline Information",
    fields: [
      { label: "Account Currency", keys: ["currencyCode"] },
      {
        label: "Billing Address",
        keys: ["billingStreet", "billingCity", "billingState", "billingPostalCode", "billingCountry"],
        separator: ", ",
      },
    ],
  },
  {
    title: "Products Enabled",
    fields: [
      { label: "Customer Communication", keys: ["customerCommunicationEnabled"] },
      { label: "QuickBooks Online Enabled", keys: ["quickbooksOnlineEnabled"] },
      // No matching key in the data yet; renders "Not provided".
      { label: "QuickBooks Desktop Enabled", keys: ["quickbooksDesktopEnabled"] },
      { label: "Has FP Payments", keys: ["fpPaymentsEnabled"] },
      // No matching key in the data yet; renders "Not provided".
      { label: "Add-On and Revenue Partner Products Enabled", keys: ["addOnRevenuePartnerProductsEnabled"] },
      { label: "Custom Forms", keys: ["customFormsEnabled"] },
      { label: "Engage", keys: ["engageEnabled"] },
    ],
  },
];

function formatValue(value: unknown): string {
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.map((v) => String(v)).join(", ");
  if (typeof value === "object" && value !== null) return JSON.stringify(value);
  return String(value);
}

// Resolve a field's display value from salesforceData. Returns null when none of
// the field's keys are present (the caller renders "Not provided").
export function fieldValue(data: Record<string, unknown>, field: SalesforceField): string | null {
  const source = data && typeof data === "object" ? data : {};
  const parts = field.keys
    .map((key) => source[key])
    .filter((value) => value !== null && value !== undefined && value !== "")
    .map(formatValue);
  return parts.length > 0 ? parts.join(field.separator ?? " ") : null;
}
