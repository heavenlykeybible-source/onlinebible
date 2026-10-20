import { describe, expect, it } from "vitest";
import { createBlogPost, formatBlogSocialText } from "../../src/services/blog-publishing-service";

describe("unified blog publishing contracts", () => {
  it("exports public reads and the scheduled publication worker", async () => {
    const service = await import("../../src/services/blog-publishing-service");
    expect(typeof service.listPublicBlogPosts).toBe("function");
    expect(typeof service.getPublicBlogPost).toBe("function");
    expect(typeof service.runDueBlogPublications).toBe("function");
  });

  it("requires a title and article body before saving", async () => {
    await expect(createBlogPost({} as any, {title:"",body:"short"}, 1)).rejects.toThrow("title");
    await expect(createBlogPost({} as any, {title:"Valid title",body:"short"}, 1)).rejects.toThrow("article content");
  });

  it("keeps the canonical article link in X posts within the 280-character limit", () => {
    const url = "https://www.heavenlykey.org/blog/a-long-article-title/";
    const text = formatBlogSocialText({title:"A".repeat(170),excerpt:"B".repeat(500)},url,"x");
    expect(Array.from(text).length).toBeLessThanOrEqual(280);
    expect(text).toContain(url);
  });

  it("includes the article link and ministry identity in Facebook link announcements", () => {
    const url = "https://www.heavenlykey.org/blog/repentance-and-readiness/";
    const text = formatBlogSocialText({title:"Repentance and Readiness",excerpt:"A Bible teaching"},url,"facebook");
    expect(text).toContain("Repentance and Readiness");
    expect(text).toContain("A Bible teaching");
    expect(text).toContain(url);
    expect(text).toContain("Heavenly Key Evangelistic Movement");
  });
});
