import { describe, it, expect } from "vitest";
import { isPrivateAddress, validateTarget, extractFields, categorise, bandOf } from "../sandbox/link-fetch";
import { suggestionsFor } from "../sandbox/complements";

describe("link-paste SSRF guards (v11 WS-3, non-negotiable)", () => {
  it("refuses private, loopback, link-local and reserved IPv4 targets", async () => {
    for (const ip of ["10.0.0.1", "172.16.9.1", "192.168.1.1", "127.0.0.1", "169.254.169.254", "0.0.0.0", "224.0.0.1"]) {
      expect(isPrivateAddress(ip), ip).toBe(true);
      await expect(validateTarget(`http://${ip}/admin`)).rejects.toThrow();
    }
  });
  it("refuses IPv6 loopback/ULA/link-local and mapped-private forms", () => {
    for (const ip of ["::1", "fc00::1", "fd12::1", "fe80::1", "::ffff:127.0.0.1", "::ffff:192.168.0.1"]) {
      expect(isPrivateAddress(ip), ip).toBe(true);
    }
  });
  it("allows public addresses and strips credentials", async () => {
    expect(isPrivateAddress("142.250.187.206")).toBe(false);
    const u = await validateTarget("https://user:pass@142.250.187.206/product");
    expect(u.username).toBe("");
    expect(u.password).toBe("");
  });
  it("refuses non-http protocols and localhost names", async () => {
    await expect(validateTarget("file:///etc/passwd")).rejects.toThrow();
    await expect(validateTarget("ftp://example.com/x")).rejects.toThrow();
    await expect(validateTarget("http://localhost:3000/api")).rejects.toThrow();
    await expect(validateTarget("http://internal.local/x")).rejects.toThrow();
  });
});

describe("field extraction + normalisation", () => {
  it("extracts JSON-LD product fields and normalises category/retailer/band", () => {
    const html = `<html><head><script type="application/ld+json">
      {"@type":"Product","name":"Premium head razor pro","image":"https://cdn.example.com/razor.jpg","offers":{"price":"79.00"}}
    </script></head></html>`;
    const f = extractFields(html, "www.johnlewis.com");
    expect(f.title).toBe("Premium head razor pro");
    expect(f.price).toBe(79);
    expect(f.retailer).toBe("Johnlewis");
    expect(f.category).toBe("Grooming");
    expect(f.priceBand).toBe("25to100");
  });
  it("falls back to OpenGraph and page title", () => {
    const html = `<head><meta property="og:title" content="Camping tent 4 person"/><meta property="product:price:amount" content="179"/></head>`;
    const f = extractFields(html, "www.gooutdoors.co.uk");
    expect(f.title).toBe("Camping tent 4 person");
    expect(f.price).toBe(179);
    expect(f.category).toBe("Outdoors");
  });
  it("categorise + band edges", () => {
    expect(categorise("Nintendo Switch OLED console")).toBe("Games");
    expect(bandOf(24)).toBe("under25");
    expect(bandOf(500)).toBe("100to500");
    expect(bandOf(501)).toBe("over500");
  });
});

describe("the complement engine stub", () => {
  it("razor → two alternative price points + the scalp moisturiser", () => {
    const s = suggestionsFor("Premium head razor pro");
    expect(s).not.toBeNull();
    expect(s!.alternatives).toHaveLength(2);
    expect(s!.complement.name).toMatch(/scalp moisturiser/i);
    expect(s!.line).toMatch(/small wish, easily granted/);
  });
  it("covers the mapped pairs and returns null off-map", () => {
    for (const t of ["Telescope 130mm", "Espresso coffee machine", "Road running trainers", "PlayStation console", "Two person tent", "Mechanical keyboard", "Dual air fryer", "Hybrid bike", "Wireless headphones"]) {
      expect(suggestionsFor(t), t).not.toBeNull();
    }
    expect(suggestionsFor("A woolly jumper")).toBeNull();
  });
});
