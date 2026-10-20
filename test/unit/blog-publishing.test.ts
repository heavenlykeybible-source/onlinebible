import { describe, expect, it } from "vitest";
import { createBlogPost } from "../../src/services/blog-publishing-service";

describe("unified blog publishing contracts", () => {
  it("exports the blog service entry points for public reads and scheduled publishing", async () => {
    const service = await import("../../src/services/blog-publishing-service");
    expect(typeof service.listPublicBlogPosts).toBe("function");
    expect(typeof service.getPublicBlogPost).toBe("function");
    expect(typeof service.runDueBlogPublications).toBe("function");
  });
  it("requires an article body and title before saving", async () => {
    await expect(createBlogPost({} as any, {title:"",body:"short"}, 1)).rejects.toThrow("title");
    await expect(createBlogPost({} as any, {title:"Valid title",body:"short"}, 1)).rejects.toThrow("article content");
  });
});
