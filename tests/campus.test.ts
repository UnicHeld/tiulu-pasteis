import { describe, expect, it } from "vitest";
import {
  assertCampusLocation,
  locationInput,
  campusBoundary,
} from "../src/domain/campus";
const now = Date.parse("2026-10-28T15:00:00Z");
const location = {
  latitude: -20.78551898,
  longitude: -49.35995068,
  accuracy: 10,
  timestamp: now,
};
describe("Restrição ao IBILCE", () => {
  it("aceita ponto institucional do IBGE dentro do campus", () => {
    expect(() => assertCampusLocation(location, now)).not.toThrow();
  });
  it("recusa fora do campus mesmo dentro do retângulo que o envolve", () => {
    expect(() =>
      assertCampusLocation(
        { ...location, latitude: -20.7826, longitude: -49.3628 },
        now,
      ),
    ).toThrow("dentro do campus");
  });
  it("recusa a vizinhança externa sem ampliar o contorno pela precisão", () => {
    expect(() =>
      assertCampusLocation({ ...location, latitude: -20.79 }, now),
    ).toThrow("dentro do campus");
    const [longitude, latitude] = campusBoundary[0];
    expect(() =>
      assertCampusLocation({ ...location, latitude, longitude }, now),
    ).toThrow("dentro do campus");
  });
  it("recusa ponto interno cuja incerteza ultrapassa o muro", () => {
    expect(() =>
      assertCampusLocation(
        {
          ...location,
          latitude: -20.7859622,
          longitude: -49.3588,
          accuracy: 100,
        },
        now,
      ),
    ).toThrow("dentro do campus");
  });
  it("recusa posição vencida, futura ou imprecisa", () => {
    for (const timestamp of [now - 120001, now + 10001])
      expect(() =>
        assertCampusLocation({ ...location, timestamp }, now),
      ).toThrow("vencida");
    expect(() =>
      assertCampusLocation({ ...location, accuracy: 101 }, now),
    ).toThrow("imprecisa");
  });
  it("valida coordenadas e precisão antes da regra espacial", () => {
    for (const change of [
      { latitude: 91 },
      { longitude: -181 },
      { accuracy: 0 },
      { accuracy: -1 },
      { latitude: NaN },
      { timestamp: Infinity },
    ])
      expect(locationInput.safeParse({ ...location, ...change }).success).toBe(
        false,
      );
  });
});
