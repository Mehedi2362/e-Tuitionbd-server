export const getEnv = {
	string: (key: string, fallback?: string): string =>
		process.env[key] ?? fallback ?? (() => {
			throw new Error(`Environment variable ${key} is not defined`);
		})(),

	number: (key: string, fallback?: number): number =>
		(process.env[key] !== undefined ? Number(process.env[key]) : fallback) ?? (() => {
			throw new Error(`Environment variable ${key} is not defined`);
		})(),

	boolean: (key: string, fallback?: boolean): boolean =>
		(process.env[key] !== undefined
			? process.env[key]!.toLowerCase() === 'true' || process.env[key] === '1'
			: fallback) ?? (() => {
				throw new Error(`Environment variable ${key} is not defined`);
			})(),

	multiple: (keys: string[]): Record<string, string> => {
		const result: Record<string, string> = {};
		for (const key of keys) result[key] = getEnv.string(key);
		return result;
	}
};