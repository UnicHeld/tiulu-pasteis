import { z } from "zod";

export const locationInput = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracy: z.number().positive(),
  timestamp: z.number().int().positive(),
});

// OpenStreetMap way 228464680, consultado em 28/10/2026; pares longitude/latitude.
// Contorno colaborativo: homologar os limites no campus antes da operação comercial.
export const campusBoundary: readonly (readonly [number, number])[] = [
  [-49.3587579, -20.7859622],
  [-49.358632, -20.7861166],
  [-49.3571682, -20.7847637],
  [-49.359676, -20.7825342],
  [-49.3622781, -20.7850428],
  [-49.3629115, -20.7856534],
  [-49.3626279, -20.785907],
  [-49.3622958, -20.786204],
  [-49.3616653, -20.7867746],
  [-49.3614584, -20.7869605],
  [-49.3613584, -20.7870504],
  [-49.3604205, -20.7878933],
  [-49.3596981, -20.787175],
  [-49.3589716, -20.7864527],
  [-49.3587467, -20.7862291],
  [-49.3589201, -20.7861113],
  [-49.3587579, -20.7859622],
];

export class LocationError extends Error {}

export function assertCampusLocation(
  location: z.infer<typeof locationInput>,
  now = Date.now(),
) {
  if (now - location.timestamp > 120_000 || location.timestamp > now + 10_000)
    throw new LocationError(
      "Localização vencida. Tente enviar novamente para atualizar sua posição.",
    );
  if (location.accuracy > 100)
    throw new LocationError(
      "Localização imprecisa. Ative a localização precisa e tente novamente em uma área aberta do campus.",
    );

  // Projeção local em metros, suficiente para a extensão deste campus.
  const scaleX = 111_320 * Math.cos((location.latitude * Math.PI) / 180);
  const scaleY = 111_320;
  let inside = false;
  let nearest = Infinity;
  for (let i = 0; i < campusBoundary.length - 1; i++) {
    const [lngA, latA] = campusBoundary[i];
    const [lngB, latB] = campusBoundary[i + 1];
    if (
      latA > location.latitude !== latB > location.latitude &&
      location.longitude <
        ((lngB - lngA) * (location.latitude - latA)) / (latB - latA) + lngA
    )
      inside = !inside;
    const ax = (lngA - location.longitude) * scaleX;
    const ay = (latA - location.latitude) * scaleY;
    const bx = (lngB - location.longitude) * scaleX;
    const by = (latB - location.latitude) * scaleY;
    const dx = bx - ax,
      dy = by - ay;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared
      ? Math.max(0, Math.min(1, -(ax * dx + ay * dy) / lengthSquared))
      : 0;
    nearest = Math.min(nearest, Math.hypot(ax + t * dx, ay + t * dy));
  }
  // A margem não amplia o campus: a área de incerteza precisa caber no contorno.
  if (!inside || nearest < location.accuracy)
    throw new LocationError(
      "Só é possível pedir dentro do campus IBILCE/UNESP. Se estiver perto da entrada, avance para dentro do campus e tente novamente.",
    );
}
