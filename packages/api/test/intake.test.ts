import { describe, expect, it } from "vitest";
import {
  itemSchema,
  listItemsResponseSchema,
  problemDetailsSchema,
  type ItemEvent,
} from "@inbox/contracts";
import { createApp } from "../src/composition-root";
import { InMemoryItemRepository } from "../src/repository/in-memory-item-repository";

const base = { title: "Raised", priority: "high", requester: "Ops bot" };
const bodies = {
  expense: {
    ...base,
    type: "expense",
    payload: {
      merchant: "Acme",
      category: "Travel",
      amount: 10,
      currency: "EUR",
    },
  },
  deployment: {
    ...base,
    type: "deployment",
    payload: { service: "api", environment: "staging", version: "1.0.0" },
  },
  documentation: {
    ...base,
    type: "documentation",
    payload: { topic: "Runbook", audience: "On-call" },
  },
};

function setup() {
  const events: ItemEvent[] = [];
  const app = createApp(new InMemoryItemRepository([]), undefined, {
    publish: (e) => void events.push(e),
  });
  const create = (body: unknown) =>
    app.request("/api/items", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  return { app, create, events };
}

describe("item intake", () => {
  it.each(Object.entries(bodies))(
    "creates a pending %s item and publishes item.created",
    async (type, body) => {
      const { app, create, events } = setup();
      const res = await create(body);
      expect(res.status).toBe(201);
      const item = itemSchema.parse(await res.json());
      expect(item).toMatchObject({
        type,
        status: "pending",
        outcome: null,
        lastAttempt: null,
        failureReason: null,
        dueDate: null,
        payload: body.payload,
      });
      expect(item.id).toBeTruthy();
      expect(events).toEqual([{ type: "item.created", item }]);

      const list = listItemsResponseSchema.parse(
        await (await app.request("/api/items?status=pending")).json(),
      );
      expect(list.items.map((i) => i.id)).toEqual([item.id]);
    },
  );

  it("keeps a given due date", async () => {
    const { create } = setup();
    const res = await create({ ...bodies.expense, dueDate: "2026-12-01" });
    expect(itemSchema.parse(await res.json()).dueDate).toBe("2026-12-01");
  });

  it.each([
    ["unknown type", { ...base, type: "refund", payload: {} }],
    [
      "payload of another type",
      { ...bodies.expense, payload: bodies.deployment.payload },
    ],
    [
      "invalid payload value",
      { ...bodies.expense, payload: { ...bodies.expense.payload, amount: -1 } },
    ],
    ["missing title", { ...bodies.documentation, title: undefined }],
    ["not an object", "nope"],
  ])("rejects %s with a 400 problem and no event", async (_name, body) => {
    const { create, events } = setup();
    const res = await create(body);
    expect(res.status).toBe(400);
    expect(res.headers.get("content-type")).toContain(
      "application/problem+json",
    );
    expect(problemDetailsSchema.parse(await res.json()).status).toBe(400);
    expect(events).toEqual([]);
  });

  it("rejects a body that is not JSON", async () => {
    const { app } = setup();
    const res = await app.request("/api/items", { method: "POST", body: "x" });
    expect(res.status).toBe(400);
  });
});
