
import { environment } from "../../../env/env";
import { ConfPublic } from "./public";
import { ConfPrivate } from "./private";

// IMPORTANT
// environment related env will be overriden by angular through angular.json settings
// so we will have environment variable by default as per set environment

// one-time build at module load
function buildConf(base: ConfPublic, overrides: Record<string, unknown>): ConfPublic {
  const keys = Object.keys(base) as (keyof ConfPublic)[];
  const out = new ConfPublic();
  for (const k of keys) {
    const v = overrides[k as string];
    (out as any)[k] = v === undefined ? (base as any)[k] : v;
  }
  return Object.freeze(out);
}

const pubConf: Readonly<ConfPublic> = buildConf(new ConfPublic(), environment);
const pvtConf = Object.freeze(new ConfPrivate());

// we can also import this at everywhere and use, thi is to handle unwated situation prefer ConfService
export const CONF: Readonly<ConfPublic & ConfPrivate> = Object.freeze({...pubConf, ...pvtConf});