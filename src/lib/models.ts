import * as v from 'valibot';

export const DBInfo = v.object({
	id: v.number(),
	name: v.string(),
	ai: v.string(),
	apiKey: v.string()
});
export type DBInfo = v.InferOutput<typeof DBInfo>;
