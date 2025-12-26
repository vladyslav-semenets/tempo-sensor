export interface ITemperatureData {
	id: string;
	temperature: number;
	humidity: number;
	pressure: number;
	altitude: number;
	date: number;
}

export interface IChartData {
	time: string;
	temperature: number;
	humidity: number;
}

export interface IRawTemperatureItem {
	temperature: number;
	humidity: number;
	pressure: number;
	altitude: number;
	date: string;
}
