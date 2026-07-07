import { describe, it, expect } from "vitest";
import { SALESFORCE_GROUPS, fieldValue, type SalesforceField } from "../lib/salesforce-fields";

function findField(label: string): SalesforceField {
  const field = SALESFORCE_GROUPS.flatMap((g) => g.fields).find((f) => f.label === label);
  if (!field) throw new Error(`No Salesforce field labeled "${label}"`);
  return field;
}

describe("salesforce field map", () => {
  it("has the five PRD groups", () => {
    expect(SALESFORCE_GROUPS.map((g) => g.title)).toEqual([
      "Account Information",
      "Contractual Details",
      "Firmographic Data",
      "Pipeline Information",
      "Products Enabled",
    ]);
  });

  it("resolves present fields, combining multi-key fields and formatting booleans", () => {
    const data = {
      companyName: "Acme HVAC",
      primaryContactFirstName: "Ada",
      primaryContactLastName: "Lin",
      fpPaymentsEnabled: true,
      billingStreet: "1 Main St",
      billingCity: "Austin",
      billingState: "TX",
    };
    expect(fieldValue(data, findField("Account Name"))).toBe("Acme HVAC");
    expect(fieldValue(data, findField("Primary Contact"))).toBe("Ada Lin");
    expect(fieldValue(data, findField("Has FP Payments"))).toBe("Yes");
    expect(fieldValue(data, findField("Billing Address"))).toBe("1 Main St, Austin, TX");
  });

  it("returns null (Not provided) for missing fields", () => {
    expect(fieldValue({}, findField("Website"))).toBeNull();
    // A PRD field with no matching key in the real data.
    expect(fieldValue({ quickbooksOnlineEnabled: true }, findField("QuickBooks Desktop Enabled"))).toBeNull();
  });
});
