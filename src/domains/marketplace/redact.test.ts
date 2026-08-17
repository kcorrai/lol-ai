import { describe, it, expect } from "vitest";
import { redactContacts, redactionNotice } from "@/domains/marketplace/redact";

const clean = (text: string) => redactContacts(text).text;

describe("redactContacts", () => {
  it("leaves an ordinary message alone", () => {
    const message = "Send me the replay and I will look at your first back.";
    const result = redactContacts(message);

    expect(result.text).toBe(message);
    expect(result.redacted).toBe(false);
    expect(redactionNotice(result)).toBeNull();
  });

  describe("email", () => {
    it("removes a plain address", () => {
      expect(clean("mail me at coach@example.com ok")).toBe("mail me at [removed] ok");
    });

    it("removes the obvious spelled-out forms", () => {
      expect(clean("coach (at) example.com")).toContain("[removed]");
      expect(clean("coach [at] example.co.uk")).toContain("[removed]");
    });
  });

  describe("invites", () => {
    it("removes a discord invite whole, link and all", () => {
      const result = redactContacts("join https://discord.gg/abc123 tonight");
      expect(result.text).toBe("join [removed] tonight");
      expect(result.kinds).toContain("invite");
    });

    it("removes one without a scheme", () => {
      expect(clean("discord.gg/abc123")).toBe("[removed]");
    });

    it("removes telegram and whatsapp links", () => {
      expect(clean("t.me/somebody")).toBe("[removed]");
      expect(clean("wa.me/1234567890")).toBe("[removed]");
    });
  });

  describe("handles and tags", () => {
    it("removes a discord tag written out", () => {
      expect(clean("discord: someplayer")).toBe("[removed]");
      expect(clean("my disc tag: someplayer#1234")).toContain("[removed]");
    });

    it("removes an @handle", () => {
      expect(clean("find me @somecoach on there")).toBe("find me [removed] on there");
    });

    it("does not eat a word that merely contains an at sign mid-string", () => {
      expect(clean("the wave state@10 minutes")).toBe("the wave state@10 minutes");
    });
  });

  describe("phone numbers", () => {
    it("removes a plain international number", () => {
      expect(clean("call +90 532 123 4567")).toBe("call [removed]");
    });

    it("removes one with brackets and dashes", () => {
      expect(clean("(555) 123-4567 anytime")).toBe("[removed] anytime");
    });

    // "Play at 9 30" is not a phone number, and treating it as one would make
    // the feature more annoying than the leakage it prevents.
    it("leaves short numbers and game talk alone", () => {
      expect(clean("recall at 9 30 and take the wave")).toBe("recall at 9 30 and take the wave");
      expect(clean("you were 3/7/2 in that one")).toBe("you were 3/7/2 in that one");
      expect(clean("120 cs by 10 minutes")).toBe("120 cs by 10 minutes");
    });
  });

  it("removes several kinds from one message and names each", () => {
    const result = redactContacts("mail coach@example.com or discord.gg/xyz");

    expect(result.text).not.toContain("example.com");
    expect(result.text).not.toContain("discord.gg");
    expect(result.kinds.sort()).toEqual(["email", "invite"]);
  });

  // The regexes are module-level and carry `lastIndex`, so a second call must
  // not start halfway through the string.
  it("gives the same answer when called twice", () => {
    const message = "mail coach@example.com please";
    expect(clean(message)).toBe(clean(message));
  });

  it("never returns the original detail anywhere in the result", () => {
    const result = redactContacts("here: coach@example.com and +90 532 123 4567");

    expect(result.text).not.toMatch(/example\.com/);
    expect(result.text).not.toMatch(/532/);
  });
});

describe("redactionNotice", () => {
  it("names what was taken and says why it matters", () => {
    const notice = redactionNotice(redactContacts("mail coach@example.com"));

    expect(notice).toMatch(/email/);
    expect(notice).toMatch(/not covered/i);
  });

  it("joins several kinds readably", () => {
    const notice = redactionNotice(redactContacts("coach@example.com and discord.gg/x"));
    expect(notice).toMatch(/an email address and an invite link/);
  });
});
