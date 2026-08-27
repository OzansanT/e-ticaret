import test from "node:test";
import assert from "node:assert/strict";
import { selectBestCampaign } from "../features/cart/campaigns.js";

test("uses the second-product offer for a matching pair", () => {
  const campaign = selectBestCampaign([170, 170], 340);
  assert.equal(campaign.name, "2. üründe %25");
  assert.equal(campaign.discount, 42.5);
});

test("uses the three-product offer when it saves more", () => {
  const campaign = selectBestCampaign([100, 100, 100], 300);
  assert.equal(campaign.name, "3 ürün al %20");
  assert.equal(campaign.discount, 60);
});

test("uses four-for-two for the four-item basket", () => {
  const campaign = selectBestCampaign([134, 170, 231, 325], 860);
  assert.equal(campaign.name, "4 al 2 öde");
  assert.equal(campaign.discount, 304);
});

test("keeps the base basket discount for a single item", () => {
  const campaign = selectBestCampaign([170], 170);
  assert.equal(campaign.name, "Sepette %10");
  assert.equal(campaign.discount, 17);
});
