import { describe, expect, it } from "vitest";
import {
  build404Url,
  createRequest,
  existsAsync,
} from "../src/lib/entrypoint-utils";

describe("entrypoint utils", () => {
  it("builds a clean 404 URL", () => {
    expect(build404Url("https://example.com/blog/post?draft=1#section")).toBe(
      "https://example.com/404"
    );
  });

  it("creates requests without a body for GET and HEAD", async () => {
    const getRequest = createRequest({
      type: "v2",
      method: "GET",
      queryString: "",
      rawPath: "/",
      url: "https://example.com/",
      body: Buffer.from("ignored"),
      headers: { host: "example.com" },
      remoteAddress: "127.0.0.1",
    });

    const headRequest = createRequest({
      type: "v2",
      method: "HEAD",
      queryString: "",
      rawPath: "/",
      url: "https://example.com/",
      body: Buffer.from("ignored"),
      headers: { host: "example.com" },
      remoteAddress: "127.0.0.1",
    });

    expect(await getRequest.text()).toBe("");
    expect(await headRequest.text()).toBe("");
  });

  it("creates requests with a body for non-GET methods", async () => {
    const request = createRequest({
      type: "v2",
      method: "POST",
      queryString: "",
      rawPath: "/submit",
      url: "https://example.com/submit",
      body: Buffer.from("payload"),
      headers: { host: "example.com" },
      remoteAddress: "127.0.0.1",
    });

    expect(await request.text()).toBe("payload");
  });

  it("checks file existence asynchronously", async () => {
    await expect(existsAsync("packages/astro-sst/src/adapter.ts")).resolves.toBe(
      true
    );
    await expect(existsAsync("packages/astro-sst/src/missing-file.ts")).resolves.toBe(
      false
    );
  });
});
