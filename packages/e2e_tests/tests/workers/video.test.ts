import { assert, beforeEach, describe, expect, inject, it } from "vitest";

import { createNotedClient } from "@noted/sdk";

import { createTestUser } from "../../utils/api";
import { waitUntil } from "../../utils/general";

describe("Video Worker Tests", () => {
  const port = inject("notedPort");

  if (!port) {
    throw new Error("Missing required environment variables");
  }

  let client: ReturnType<typeof createNotedClient>;
  let apiKey: string;

  async function getBookmark(bookmarkId: string) {
    const { data } = await client.GET(`/bookmarks/{bookmarkId}`, {
      params: {
        path: {
          bookmarkId,
        },
        query: {
          includeContent: true,
        },
      },
    });
    return data;
  }

  beforeEach(async () => {
    apiKey = await createTestUser();
    client = createNotedClient({
      baseUrl: `http://localhost:${port}/api/v1/`,
      headers: {
        "Content-Type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
    });
  });

  it("downloads a video attachment using yt-dlp", async () => {
    let { data: bookmark } = await client.POST("/bookmarks", {
      body: {
        type: "link",
        url: "http://nginx:80/video.html",
      },
    });
    assert(bookmark);

    await waitUntil(
      async () => {
        const data = await getBookmark(bookmark!.id);
        assert(data);
        assert(data.content.type === "link");
        return !!data.content.videoAssetId;
      },
      "Video attachment is downloaded",
      120000,
    );

    bookmark = await getBookmark(bookmark.id);
    assert(bookmark && bookmark.content.type === "link");
    expect(bookmark.content.videoAssetId).toBeDefined();
    expect(bookmark.assets.find((a) => a.assetType === "video")).toBeDefined();
  });
});
