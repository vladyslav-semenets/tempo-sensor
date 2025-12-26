import React, { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { database } from '@/config/firebase';
import { endAt, onValue, orderByChild, query, ref, startAt, limitToLast } from 'firebase/database';
import { useCapacitorAuth } from '@/hooks/useCapacitorAuth';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { IChartData, ITemperatureData } from '@/types/common.types.ts';
import { getEndOfDay, getStartOfDay, transformTemperatureData } from '@/utils/mics.ts';
import { HumidityRating } from '@/components/HumidityRating/HumidityRating.tsx';

export const TempoSensor: React.FC = () => {
	const [chartData, setChartData] = useState<IChartData[]>([]);
	const [currentTemp, setCurrentTemp] = useState<ITemperatureData | null>(null);
	const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
	const [loading, setLoading] = useState(false);

	const { user, loading: authLoading, handleGoogleLogin } = useCapacitorAuth();

	useEffect(() => {
		if (!user) {
			return;
		}

		const collectionRef = ref(database, 'temp_sensor_items');
		const currentTemperatureQuery = query(
			collectionRef,
			orderByChild('date'),
			limitToLast(1)
		);

		const currentTemperatureSubscriber = onValue(
			currentTemperatureQuery,
			(snapshot) => {
				const dataItem = snapshot.val();
				if (dataItem) {
					const currentTemperatureData = transformTemperatureData(dataItem);
					setCurrentTemp(currentTemperatureData[0]);
				}
			},
			(error) => {
				console.error('Error fetching temperature data:', error);
				setLoading(false);
			}
		);

		return () => {
			currentTemperatureSubscriber();
		};
	}, [user]);

	useEffect(() => {
		if (!user) {
			return;
		}

		try {
			const selectedDateObj = new Date(selectedDate);
			const startOfDayTimestamp = getStartOfDay(selectedDateObj);
			const endOfDayTimestamp = getEndOfDay(selectedDateObj);

			const collectionRef = ref(database, 'temp_sensor_items');
			const dailyTemperatureQuery = query(
				collectionRef,
				orderByChild('date'),
				startAt(startOfDayTimestamp),
				endAt(endOfDayTimestamp)
			);

			const dailyTemperatureSubscriber = onValue(
				dailyTemperatureQuery,
				(snapshot) => {
					const dataItem = snapshot.val();
					if (dataItem) {
						const allItems: ITemperatureData[] = transformTemperatureData(dataItem);
						const transformed = allItems.map((item) => ({
							time: new Date(item.date * 1000).toLocaleTimeString('en-US', {
								hour: '2-digit',
								minute: '2-digit',
							}),
							temperature: Math.round(item.temperature * 10) / 10,
							humidity: Math.round(item.humidity * 10) / 10,
						}));
						setChartData(transformed);
					} else {
						setChartData([]);
					}
					setLoading(false);
				},
				(error) => {
					console.error('Error fetching temperature data:', error);
					setLoading(false);
				}
			);

			return () => {
				dailyTemperatureSubscriber();
			};
		} catch (error) {
			console.error('Error setting up listener:', error);
		}
	}, [user, selectedDate]);

	const handlePreviousDay = () => {
		const prev = new Date(selectedDate);
		prev.setDate(prev.getDate() - 1);
		setSelectedDate(prev.toISOString().split('T')[0]);
	};

	const handleNextDay = () => {
		const next = new Date(selectedDate);
		next.setDate(next.getDate() + 1);
		setSelectedDate(next.toISOString().split('T')[0]);
	};

	const handleToday = () => {
		setSelectedDate(new Date().toISOString().split('T')[0]);
	};

	if (authLoading) {
		return (
			<div className="w-full min-h-screen flex items-center justify-center bg-gray-50">
				<div className="flex flex-col items-center gap-4">
					<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
					<p className="text-gray-500 text-sm sm:text-base">Loading...</p>
				</div>
			</div>
		);
	}

	if (!user) {
		return (
			<div className="flex h-screen flex-col items-center justify-center gap-4 bg-gray-50 px-4">
				<h1 className="text-2xl font-bold text-center sm:text-3xl">Temperature Sensor</h1>
				<p className="text-gray-600 text-center text-sm sm:text-base">Sign in to view temperature data</p>
				<Button onClick={handleGoogleLogin} size="lg" className="w-full sm:w-auto">
					Sign in with Google
				</Button>
			</div>
		);
	}

	return (
		<div className="w-full min-h-screen bg-gray-50 p-2 sm:p-4">
			<div className="max-w-6xl mx-auto space-y-3 sm:space-y-6">
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4">
					<h1 className="text-xl sm:text-3xl font-bold">Temperature Sensor</h1>
				</div>
				<Card className="w-full">
					<CardHeader className="pb-2 sm:pb-4">
						<CardTitle className="text-base sm:text-xl">Current Temperature</CardTitle>
					</CardHeader>
					<CardContent>
						{currentTemp ? (
							<div className="grid grid-cols-2 gap-2 sm:gap-4 md:grid-cols-4">
								<div className="bg-red-50 rounded p-2 sm:p-3">
									<p className="text-xs sm:text-sm text-gray-600">Temperature</p>
									<p className="text-lg sm:text-3xl font-bold text-red-600">{currentTemp.temperature}°C</p>
								</div>
								<div className="bg-blue-50 rounded p-2 sm:p-3">
									<p className="text-xs sm:text-sm text-gray-600">Humidity</p>
									<p className="text-lg sm:text-2xl font-semibold text-blue-600">{currentTemp.humidity}%</p>
								</div>
								<div className="bg-yellow-50 rounded p-2 sm:p-3">
									<p className="text-xs sm:text-sm text-gray-600">Pressure</p>
									<p className="text-lg sm:text-2xl font-semibold text-yellow-600">{currentTemp.pressure} hPa</p>
								</div>
								<div className="bg-green-50 rounded p-2 sm:p-3">
									<p className="text-xs sm:text-sm text-gray-600">Altitude</p>
									<p className="text-lg sm:text-2xl font-semibold text-green-600">{currentTemp.altitude} m</p>
								</div>
							</div>
						) : (
							<p className="text-gray-500 text-sm">No data available</p>
						)}
					</CardContent>
				</Card>

				{currentTemp ? <HumidityRating humidity={currentTemp.humidity}/> : null}

				<Card className="w-full">
					<CardHeader className="pb-2 sm:pb-4">
						<CardTitle className="text-base sm:text-xl">Temperature Chart</CardTitle>
						<CardDescription className="text-xs sm:text-sm">Temperature and humidity throughout the day</CardDescription>
					</CardHeader>
					<CardContent className="space-y-3 sm:space-y-4">
						{/* Date Controls */}
						<div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-2 sm:gap-3">
							<Button
								onClick={handlePreviousDay}
								size="sm"
								className="text-xs sm:text-sm w-full sm:w-auto"
							>
								<ChevronLeft size={16} /> Previous
							</Button>
							<input
								type="date"
								value={selectedDate}
								onChange={(e) => setSelectedDate(e.target.value)}
								className="rounded border border-gray-300 px-2 sm:px-3 py-2 text-xs sm:text-sm w-full sm:w-auto"
							/>
							<Button
								onClick={handleNextDay}
								size="sm"
								className="text-xs sm:text-sm w-full sm:w-auto"
							>
								Next <ChevronRight size={16} />
							</Button>
							<Button
								onClick={handleToday}
								size="sm"
								className="text-xs sm:text-sm w-full sm:w-auto"
							>
								Today
							</Button>
						</div>
						{loading ? (
							<div className="flex h-64 sm:h-96 items-center justify-center">
								<p className="text-gray-500 text-sm">Loading data...</p>
							</div>
						) : chartData.length > 0 ? (
							<ResponsiveContainer width="100%" height={280}>
								<AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
									<defs>
										<linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
											<stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
										</linearGradient>
										<linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
											<stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
											<stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
										</linearGradient>
									</defs>
									<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
									<XAxis
										dataKey="time"
										tick={{ fontSize: 10 }}
										interval={Math.floor(Math.max(0, chartData.length / 4))}
									/>
									<YAxis
										yAxisId="left"
										tick={{ fontSize: 10 }}
										label={{ value: '°C', angle: -90, position: 'insideLeft', offset: 5 }}
									/>
									<YAxis
										yAxisId="right"
										orientation="right"
										tick={{ fontSize: 10 }}
										label={{ value: '%', angle: 90, position: 'insideRight', offset: 5 }}
									/>
									<Tooltip
										contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px', fontSize: '12px' }}
										formatter={(value: number) => value.toFixed(1)}
									/>
									<Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
									<Area
										yAxisId="left"
										type="monotone"
										dataKey="temperature"
										stroke="#ef4444"
										fillOpacity={1}
										fill="url(#colorTemp)"
										name="Temperature (°C)"
									/>
									<Area
										yAxisId="right"
										type="monotone"
										dataKey="humidity"
										stroke="#3b82f6"
										fillOpacity={1}
										fill="url(#colorHumidity)"
										name="Humidity (%)"
									/>
								</AreaChart>
							</ResponsiveContainer>
						) : (
							<div className="flex h-64 sm:h-96 items-center justify-center">
								<p className="text-gray-500 text-sm">No data available for the selected date</p>
							</div>
						)}

						{chartData.length > 0 && (
							<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3 pt-2 sm:pt-4">
								<div className="rounded bg-red-50 p-2 sm:p-3">
									<p className="text-xs text-gray-600">Max Temp</p>
									<p className="text-base sm:text-xl font-semibold text-red-600">
										{Math.max(...chartData.map((d) => d.temperature))}°C
									</p>
								</div>
								<div className="rounded bg-red-50 p-2 sm:p-3">
									<p className="text-xs text-gray-600">Min Temp</p>
									<p className="text-base sm:text-xl font-semibold text-red-600">
										{Math.min(...chartData.map((d) => d.temperature))}°C
									</p>
								</div>
								<div className="rounded bg-red-50 p-2 sm:p-3">
									<p className="text-xs text-gray-600">Avg Temp</p>
									<p className="text-base sm:text-xl font-semibold text-red-600">
										{(chartData.reduce((sum, d) => sum + d.temperature, 0) / chartData.length).toFixed(1)}°C
									</p>
								</div>

								{/* Humidity Stats */}
								<div className="rounded bg-blue-50 p-2 sm:p-3">
									<p className="text-xs text-gray-600">Max Humidity</p>
									<p className="text-base sm:text-xl font-semibold text-blue-600">
										{Math.max(...chartData.map((d) => d.humidity))}%
									</p>
								</div>
								<div className="rounded bg-blue-50 p-2 sm:p-3">
									<p className="text-xs text-gray-600">Min Humidity</p>
									<p className="text-base sm:text-xl font-semibold text-blue-600">
										{Math.min(...chartData.map((d) => d.humidity))}%
									</p>
								</div>
								<div className="rounded bg-blue-50 p-2 sm:p-3">
									<p className="text-xs text-gray-600">Avg Humidity</p>
									<p className="text-base sm:text-xl font-semibold text-blue-600">
										{(chartData.reduce((sum, d) => sum + d.humidity, 0) / chartData.length).toFixed(1)}%
									</p>
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
};
