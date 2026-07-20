import { describe, it, expect } from "vitest";
import { HIDDEN_SELECTION_KEYS, prettifyAnswer } from "../lib/selection-format";

describe("prettifyAnswer", () => {
  it("title-cases enum slugs, including underscore-joined ones", () => {
    expect(prettifyAnswer("residential")).toBe("Residential");
    expect(prettifyAnswer("commercial")).toBe("Commercial");
    expect(prettifyAnswer("service_call")).toBe("Service Call");
    expect(prettifyAnswer("default")).toBe("Default");
    expect(prettifyAnswer("standard")).toBe("Standard");
  });

  it("leaves already-capitalized names, codes, and multi-word text alone", () => {
    expect(prettifyAnswer("CONSERVE A WATT LIGHTING")).toBe("CONSERVE A WATT LIGHTING");
    expect(prettifyAnswer("Electrical")).toBe("Electrical");
    expect(prettifyAnswer("USD")).toBe("USD");
    expect(prettifyAnswer("720 Vallejo st")).toBe("720 Vallejo st");
  });

  it("leaves urls, emails, ids, paths, and numbers untouched", () => {
    expect(prettifyAnswer("http://cawlighting.com")).toBe("http://cawlighting.com");
    expect(prettifyAnswer("service@cawlighting.com")).toBe("service@cawlighting.com");
    expect(prettifyAnswer("196457/logo.jpg")).toBe("196457/logo.jpg");
    expect(prettifyAnswer("80204")).toBe("80204");
    expect(prettifyAnswer("31-50")).toBe("31-50");
  });

  it("hides emergency services, which the onboarding app hides too", () => {
    expect(HIDDEN_SELECTION_KEYS.has("emergencyServices")).toBe(true);
  });
});
