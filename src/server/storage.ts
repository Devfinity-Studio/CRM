import { Files } from "files-sdk";
import { neon } from "files-sdk/neon";

export const storage = new Files({
	adapter: neon({ bucket: "uploads" }),
});
