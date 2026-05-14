export const NEIGHBOURHOOD_IMAGES: Record<string, string> = {
  beltline:              "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80&fit=crop&auto=format",
  kensington:            "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=800&q=80&fit=crop&auto=format",
  mission:               "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=800&q=80&fit=crop&auto=format",
  inglewood:             "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800&q=80&fit=crop&auto=format",
  bridgeland:            "https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80&fit=crop&auto=format",
  "east-village":        "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?w=800&q=80&fit=crop&auto=format",
  "marda-loop":          "https://images.unsplash.com/photo-1467232004584-a241de8bcf5d?w=800&q=80&fit=crop&auto=format",
  sunnyside:             "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80&fit=crop&auto=format",
  "university-district": "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80&fit=crop&auto=format",
  seton:                 "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=800&q=80&fit=crop&auto=format",
  altadore:              "https://images.unsplash.com/photo-1508193638397-1c4234db14d8?w=800&q=80&fit=crop&auto=format",
  bowness:               "https://images.unsplash.com/photo-1475070929565-c985b496cb9f?w=800&q=80&fit=crop&auto=format",
  "capitol-hill":        "https://images.unsplash.com/photo-1464938050520-ef2270bb8ce8?w=800&q=80&fit=crop&auto=format",
  hillhurst:             "https://images.unsplash.com/photo-1445991842772-097fea258e7b?w=800&q=80&fit=crop&auto=format",
  "lower-mount-royal":   "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80&fit=crop&auto=format",
  "crescent-heights":    "https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800&q=80&fit=crop&auto=format",
  mahogany:              "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&q=80&fit=crop&auto=format",
  "aspen-woods":         "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80&fit=crop&auto=format",
  "panorama-hills":      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80&fit=crop&auto=format",
  "auburn-bay":          "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&q=80&fit=crop&auto=format",
};

export const FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=800&q=80&fit=crop&auto=format";

export function getNeighbourhoodImage(slug: string): string {
  return NEIGHBOURHOOD_IMAGES[slug] ?? FALLBACK_IMAGE;
}
