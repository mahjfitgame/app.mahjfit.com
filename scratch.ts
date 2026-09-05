import { GameTileEntity } from "@bfw/api-sdk/graphql/endpoints/business";
type K = keyof GameTileEntity;
const x: K = "fake_property_to_trigger_error";
