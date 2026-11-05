import { Hono } from "hono";
import {
  listItemsQuerySchema,
  type CountsResponse,
  type ListItemsResponse,
} from "@inbox/contracts";
import {
  InvalidActionError,
  InvalidItemError,
  ItemNotActionableError,
  ItemNotFoundError,
  type ItemService,
} from "../service/item-service";
import { formatIssues } from "../zod-issues";
import { problem } from "./problem";

export function itemRoutes(service: ItemService) {
  return (
    new Hono()
      // Registered before `/:id` so "counts" is never read as an id.
      .get("/counts", async (c) => {
        const body: CountsResponse = { counts: await service.countItems() };
        return c.json(body);
      })
      .get("/", async (c) => {
        const query = listItemsQuerySchema.safeParse(c.req.query());
        if (!query.success)
          return problem(
            c,
            400,
            "Invalid query",
            formatIssues(query.error),
          );
        const body: ListItemsResponse = {
          items: await service.listItems(query.data),
        };
        return c.json(body);
      })
      .get("/:id", async (c) => {
        try {
          return c.json(await service.getItem(c.req.param("id")));
        } catch (error) {
          if (error instanceof ItemNotFoundError) {
            return problem(c, 404, "Item not found", error.message);
          }
          throw error;
        }
      })
      .post("/", async (c) => {
        const body: unknown = await c.req.json().catch(() => undefined);
        try {
          return c.json(await service.createItem(body), 201);
        } catch (error) {
          if (error instanceof InvalidItemError)
            return problem(c, 400, "Invalid item", error.message);
          throw error;
        }
      })
      .post("/:id/actions", async (c) => {
        const body: unknown = await c.req.json().catch(() => undefined);
        try {
          return c.json(await service.submitAction(c.req.param("id"), body));
        } catch (error) {
          if (error instanceof ItemNotFoundError)
            return problem(c, 404, "Item not found", error.message);
          if (error instanceof InvalidActionError)
            return problem(c, 400, "Invalid action", error.message);
          if (error instanceof ItemNotActionableError)
            return problem(c, 409, error.currentStatus === "failed" ? "Action not available" : "Item already handled", error.message, {
              itemStatus: error.currentStatus,
            });
          throw error;
        }
      })
  );
}
