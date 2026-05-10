import { z } from "zod";

export const brandCategorySchema = z.enum([
  "ai",
  "cloud",
  "devtools",
  "self_hosted",
  "networking",
  "productivity",
  "home_automation"
]);

export const brandRegistryItemSchema = z
  .object({
    id: z.string().min(1).regex(/^[a-z0-9][a-z0-9-]*$/),
    name: z.string().min(1),
    aliases: z.array(z.string().min(1)).min(1),
    category: brandCategorySchema,
    logoPath: z.string().min(1),
    logoVariant: z.enum(["full_color", "mono", "auto"]),
    accentColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    cardGradient: z.tuple([
      z.string().regex(/^#[0-9A-Fa-f]{6}$/),
      z.string().regex(/^#[0-9A-Fa-f]{6}$/)
    ]),
    trademarkOwner: z.string().min(1),
    usageNote: z.literal("identifier_only"),
    allowRecolor: z.boolean(),
    preferredLogoBackground: z.enum(["dark", "light", "auto"])
  })
  .strict();

export type BrandCategory = z.infer<typeof brandCategorySchema>;
export type BrandRegistryItem = z.infer<typeof brandRegistryItemSchema>;
