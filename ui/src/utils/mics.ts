import type { IRawTemperatureItem, ITemperatureData } from '@/types/common.types.ts';

export const transformTemperatureData = (
	dataItem: Record<string, IRawTemperatureItem>
): ITemperatureData[] => {
	return Object.entries(dataItem)
		.filter(([, value]) => value && typeof value === 'object')
		.map(([id, data]) => ({
			id,
			temperature: data.temperature ?? 0,
			humidity: data.humidity ?? 0,
			pressure: data.pressure ?? 0,
			altitude: data.altitude ?? 0,
			date: data.date ? parseInt(data.date, 10) : new Date().getTime(),
		}));
};

export const getStartOfDay = (date: Date): number => {
	const start = new Date(date);
	start.setHours(0, 0, 0, 0);
	return Math.floor(start.getTime() / 1000);
};

export const getEndOfDay = (date: Date): number => {
	const end = new Date(date);
	end.setHours(23, 59, 59, 999);
	return Math.floor(end.getTime() / 1000);
};
